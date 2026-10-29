import express, { Response } from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { storeDB, verifyPassword, hashPassword } from './src/server/db';
import { generateToken, verifyToken, requireAdminAuth, AuthenticatedRequest } from './src/server/auth';
import { CustomerReview, FAQItem, Order, ProductCategory, HomepageSection, StoreBanner, SocialMediaLink, Product } from './src/types';

async function startServer() {
  const app = express();

  // High-performance gzip/deflate compression for fast asset & API transfers (<2s cold load)
  app.use(compression({ threshold: 512 }));

  // Express Server + Render Port configuration (Render uses process.env.PORT || 10000)
  const PORT = process.env.NODE_ENV === 'production'
    ? (Number(process.env.PORT) || 10000)
    : (process.env.PORT && process.env.PORT !== '8080' ? Number(process.env.PORT) : 3000);

  // JSON payload parsers with generous limits for screenshot uploads and base64 images
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));

  // Static directory for uploaded files and persistent assets
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Intelligent Persistent Image Serving:
  // If file exists on disk, serve directly.
  // If not on disk (e.g. fresh container or after Render restart/deploy),
  // automatically retrieve it from Firebase Cloud Storage or Firestore metadata,
  // restore it to local disk cache, and serve it seamlessly!
  app.get('/uploads/:filename', async (req, res, next) => {
    try {
      const filename = path.basename(req.params.filename);
      const localFilePath = path.join(uploadsDir, filename);

      if (fs.existsSync(localFilePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.sendFile(localFilePath);
      }

      // Restore from Firebase Cloud Storage / Firestore metadata
      const cloudImage = await storeDB.getImageFromFirestore(filename);
      if (cloudImage) {
        if (cloudImage.imageUrl && cloudImage.imageUrl.startsWith('http')) {
          try {
            const fetchRes = await fetch(cloudImage.imageUrl);
            if (fetchRes.ok) {
              const arrayBuffer = await fetchRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              fs.writeFileSync(localFilePath, buffer);
              res.setHeader('Content-Type', cloudImage.mimeType || 'image/jpeg');
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              return res.send(buffer);
            }
          } catch (fetchErr) {
            console.warn(`Could not cache from Cloud Storage URL ${cloudImage.imageUrl}:`, fetchErr);
            return res.redirect(cloudImage.imageUrl);
          }
        } else if (cloudImage.base64Data) {
          const buffer = Buffer.from(cloudImage.base64Data, 'base64');
          fs.writeFileSync(localFilePath, buffer);
          res.setHeader('Content-Type', cloudImage.mimeType || 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return res.send(buffer);
        }
      }
    } catch (err) {
      console.error('Error in persistent image serving middleware:', err);
    }
    next();
  });

  app.use('/uploads', express.static(uploadsDir));
  app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));

  // Initialize Google Cloud Firestore synchronization
  try {
    console.log('🔄 Initializing Google Cloud Firestore synchronization for persistent storage...');
    await storeDB.initFirestoreSync();
  } catch (err) {
    console.error('Failed to sync Firestore on startup:', err);
  }

  // 1. Health & Database Status
  app.get('/api/health', (req, res) => {
    const diag = storeDB.getDiagnostics();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      status: 'ok',
      service: 'ammi-express',
      brand: 'Ammi Express',
      timestamp: Date.now(),
      database: diag.databaseType,
      persistent: diag.isPersistent,
      firestoreStatus: diag.status
    });
  });

  app.get('/api/database-status', (req, res) => {
    res.json(storeDB.getDiagnostics());
  });

  // 2. Authentication Routes
  app.post('/api/auth/login', (req, res) => {
    try {
      const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!username || !password) {
        return res.status(400).json({ error: 'Username/email and password are required' });
      }

      const admin = storeDB.findAdminByUsernameOrEmail(username);
      if (!admin) {
        return res.status(401).json({ error: 'Invalid admin credentials or authentication service unavailable.' });
      }

      const isValid = verifyPassword(password, admin.passwordHash, admin.salt);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid admin credentials or authentication service unavailable.' });
      }

      // If valid, auto-upgrade password hash to standard PBKDF2 sha512 if legacy or mismatched
      if (!admin.passwordHash || admin.passwordHash.length !== 128) {
        const upgraded = hashPassword(password.trim(), admin.salt || 'ammiexpress_salt_2025');
        admin.passwordHash = upgraded.hash;
        admin.salt = upgraded.salt;
        admin.updatedAt = new Date().toISOString();
        storeDB.persistToFirestore('adminUsers', admin.id, admin);
      }

      admin.lastLoginAt = new Date().toISOString();
      storeDB.save();

      const token = generateToken(admin);

      // Set cookie for browser session persistence
      res.setHeader('Set-Cookie', `ammi_admin_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=604800`);

      res.json({
        success: true,
        token,
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          name: admin.fullName,
          role: admin.role,
          lastLoginAt: admin.lastLoginAt
        }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Invalid admin credentials or authentication service unavailable.' });
    }
  });

  app.get('/api/auth/me', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const admin = storeDB.getAdminUsers().find(u => u.id === req.adminUser?.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    res.json({
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        name: admin.fullName,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt
      }
    });
  });

  app.put('/api/auth/profile', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const updated = storeDB.updateAdminProfile(req.adminUser!.id, req.body);
      if (!updated) return res.status(404).json({ error: 'User not found' });
      res.json({ success: true, user: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  const changeAdminPasswordHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const currentPassword = req.body?.currentPassword || req.body?.oldPassword || req.body?.currentKey || req.body?.oldKey;
      const newPassword = req.body?.newPassword || req.body?.newKey || req.body?.adminKey;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current Admin Key and New Admin Key are both required' });
      }
      if (typeof newPassword !== 'string' || newPassword.trim().length < 4) {
        return res.status(400).json({ error: 'New Admin Key must be at least 4 characters long' });
      }

      // Strictly identify admin user from authenticated session
      const adminUserId = req.adminUser?.id;
      if (!adminUserId) {
        return res.status(401).json({ error: 'Unauthorized: Admin session required' });
      }

      const admin = storeDB.getAdminUsers().find(u => u.id === adminUserId);
      if (!admin) {
        return res.status(404).json({ error: 'Admin account not found' });
      }

      const isValid = verifyPassword(currentPassword, admin.passwordHash, admin.salt);
      if (!isValid) {
        return res.status(400).json({ error: 'Incorrect Current Admin Key. Please check and try again.' });
      }

      const updated = storeDB.updateAdminPassword(admin.id, newPassword.trim());
      if (!updated) {
        return res.status(500).json({ error: 'Database failed to update Admin Key' });
      }

      await storeDB.persistToFirestore('adminUsers', admin.id, admin);

      return res.json({
        success: true,
        message: 'Admin Key successfully updated and saved permanently! All previous sessions have been invalidated.',
        sessionInvalidated: true,
        newToken: generateToken(admin),
        updatedAt: admin.updatedAt,
        tokenVersion: admin.tokenVersion
      });
    } catch (err: any) {
      console.error('Failed to change admin key/password:', err);
      return res.status(500).json({ error: err.message || 'Failed to change Admin Key' });
    }
  };

  app.put('/api/auth/change-password', requireAdminAuth, changeAdminPasswordHandler);
  app.post('/api/auth/change-password', requireAdminAuth, changeAdminPasswordHandler);
  app.put('/api/auth/change-key', requireAdminAuth, changeAdminPasswordHandler);
  app.post('/api/auth/change-key', requireAdminAuth, changeAdminPasswordHandler);
  app.put('/api/auth/change-admin-key', requireAdminAuth, changeAdminPasswordHandler);
  app.post('/api/auth/change-admin-key', requireAdminAuth, changeAdminPasswordHandler);
  app.put('/api/admin/change-key', requireAdminAuth, changeAdminPasswordHandler);
  app.post('/api/admin/change-key', requireAdminAuth, changeAdminPasswordHandler);
  app.put('/api/admin/change-admin-key', requireAdminAuth, changeAdminPasswordHandler);
  app.post('/api/admin/change-admin-key', requireAdminAuth, changeAdminPasswordHandler);

  // 2.5 Automated Keep-Alive & Render Ping Endpoints
  app.get('/api/ping', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send('pong');
  });

  // 3. Storefront Dynamic Data (Customer Website Entry)
  app.get('/api/store-data', (req, res) => {
    try {
      // Prevent stale browser caching so users always receive fresh published product
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const publishedProduct = storeDB.getPublishedProduct();
      const allProducts = storeDB.getProducts('published');
      const categories = storeDB.getCategories();
      const homepageSections = storeDB.getHomepageSections();
      const banners = storeDB.getBanners();
      const socialLinks = storeDB.getSocialLinks();
      const settings = storeDB.getSettings();
      // Only approved reviews show on customer website
      const approvedReviews = storeDB.getReviews().filter(r => r.approved);
      const faqs = storeDB.getFAQs();
      const orders = storeDB.getOrders();

      res.json({
        product: publishedProduct,
        products: allProducts,
        categories,
        homepageSections,
        banners,
        socialLinks,
        settings,
        reviews: approvedReviews,
        faqs,
        totalOrders: orders.length
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load store data' });
    }
  });

  // 4. Products API
  app.get('/api/products', (req, res) => {
    try {
      const { status, search, includeTrash } = req.query;
      const filterStatus = includeTrash === 'true' ? 'all_with_trash' : (status as string);
      const products = storeDB.getProducts(filterStatus, search as string);
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/products/:id', (req, res) => {
    const prod = storeDB.getProductById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  });

  app.post('/api/products', requireAdminAuth, async (req, res) => {
    try {
      const salePrice = req.body.salePrice || req.body.price;
      if (!req.body.title || !salePrice) {
        return res.status(400).json({ error: 'Product title and sale price are required' });
      }
      const newProduct = await storeDB.createProduct({
        ...req.body,
        salePrice: Number(salePrice)
      });
      res.status(201).json({ success: true, product: newProduct });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const updated = await storeDB.updateProduct(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Product not found' });
      res.json({ success: true, product: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update product' });
    }
  });

  // Dedicated Product Benefits API
  app.get('/api/products/:id/benefits', (req, res) => {
    try {
      const benefits = storeDB.getProductBenefits(req.params.id);
      res.json({ success: true, benefits });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get product benefits' });
    }
  });

  app.put('/api/products/:id/benefits', requireAdminAuth, (req, res) => {
    try {
      const rawList = Array.isArray(req.body) ? req.body : (req.body?.benefits || []);
      const updatedBenefits = storeDB.updateProductBenefits(req.params.id, rawList);
      res.json({ success: true, benefits: updatedBenefits });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update product benefits' });
    }
  });

  app.post('/api/products/:id/benefits', requireAdminAuth, (req, res) => {
    try {
      const newBenefit = storeDB.addProductBenefit(req.params.id, req.body);
      res.status(201).json({ success: true, benefit: newBenefit });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to add product benefit' });
    }
  });

  app.delete('/api/products/:id/benefits/:benefitId', requireAdminAuth, (req, res) => {
    try {
      const deleted = storeDB.deleteProductBenefit(req.params.id, req.params.benefitId);
      if (!deleted) return res.status(404).json({ error: 'Benefit not found or could not be deleted' });
      res.json({ success: true, message: 'Benefit deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete product benefit' });
    }
  });

  // Dedicated Product Benefits Section (Small Label, Main Heading, Description) API
  app.get('/api/products/:id/benefits-section', (req, res) => {
    try {
      const product = storeDB.getProductById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      const handling = storeDB.getProductHandling(req.params.id);
      const benefitsSection = product.benefitsSection || handling?.benefitsSection || {
        eyebrow: 'ENGINEERED FOR DAILY USE',
        heading: 'Why Every Pakistani Kitchen Needs This',
        description: 'Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.'
      };
      res.json({ success: true, benefitsSection, benefits: product.benefits || [] });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch benefits section' });
    }
  });

  app.put('/api/products/:id/benefits-section', requireAdminAuth, (req, res) => {
    try {
      const { eyebrow, heading, description, benefits } = req.body;
      const product = storeDB.getProductById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const newBenefitsSection = {
        eyebrow: eyebrow !== undefined ? eyebrow : (product.benefitsSection?.eyebrow ?? ''),
        heading: heading !== undefined ? heading : (product.benefitsSection?.heading ?? ''),
        description: description !== undefined ? description : (product.benefitsSection?.description ?? '')
      };

      const updateData: Partial<Product> = {
        benefitsSection: newBenefitsSection
      };

      if (Array.isArray(benefits)) {
        updateData.benefits = benefits;
      }

      const updated = storeDB.updateProduct(req.params.id, updateData);

      // Also ensure handling content is kept in sync
      storeDB.saveProductHandling({
        productId: req.params.id,
        benefitsSection: newBenefitsSection,
        ...(Array.isArray(benefits) ? { benefits } : {})
      });

      res.json({
        success: true,
        product: updated,
        benefitsSection: newBenefitsSection,
        message: 'Product section texts updated successfully'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update benefits section' });
    }
  });

  // Product Publishing Workflow
  app.post('/api/products/:id/publish', requireAdminAuth, (req, res) => {
    try {
      const result = storeDB.publishProduct(req.params.id);
      res.json({
        success: true,
        message: 'Product published successfully to live catalog.',
        publishedProduct: result.published
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to publish product' });
    }
  });

  // Set as Hero / Featured product
  app.post('/api/products/:id/set-hero', requireAdminAuth, (req, res) => {
    try {
      const heroProduct = storeDB.setHeroProduct(req.params.id);
      res.json({
        success: true,
        message: `"${heroProduct.title}" is now set as the Hero / Featured Product.`,
        heroProduct
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to set product as Hero' });
    }
  });

  app.post('/api/products/:id/unpublish', requireAdminAuth, (req, res) => {
    try {
      const unpublished = storeDB.unpublishProduct(req.params.id);
      if (!unpublished) return res.status(404).json({ error: 'Product not found' });
      res.json({ success: true, product: unpublished });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to unpublish product' });
    }
  });

  app.post('/api/products/:id/archive', requireAdminAuth, (req, res) => {
    try {
      const archived = storeDB.archiveProduct(req.params.id);
      if (!archived) return res.status(404).json({ error: 'Product not found' });
      res.json({ success: true, product: archived });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to archive product' });
    }
  });

  app.post('/api/products/:id/restore', requireAdminAuth, (req, res) => {
    try {
      const restored = storeDB.restoreProduct(req.params.id);
      if (!restored) return res.status(404).json({ error: 'Product not found' });
      res.json({ success: true, product: restored });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to restore product' });
    }
  });

  app.post('/api/products/:id/duplicate', requireAdminAuth, (req, res) => {
    try {
      const duplicate = storeDB.duplicateProduct(req.params.id);
      if (!duplicate) return res.status(404).json({ error: 'Product not found' });
      res.status(201).json({ success: true, product: duplicate });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to duplicate product' });
    }
  });

  app.delete('/api/products/:id', requireAdminAuth, (req, res) => {
    try {
      const permanent = req.query.permanent === 'true' || req.body?.permanent === true;
      const result = storeDB.deleteProduct(req.params.id, permanent);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      res.json({
        success: true,
        trashed: result.trashed,
        deleted: result.deleted,
        message: result.trashed ? 'Product moved to trash' : 'Product permanently deleted'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  app.delete('/api/products/:id/permanent', requireAdminAuth, (req, res) => {
    try {
      const result = storeDB.permanentDeleteProduct(req.params.id);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      res.json({ success: true, message: 'Product permanently deleted from database' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to permanently delete product' });
    }
  });

  app.post('/api/products/:id/trash', requireAdminAuth, (req, res) => {
    try {
      const trashed = storeDB.trashProduct(req.params.id);
      if (!trashed) return res.status(404).json({ error: 'Product not found' });
      res.json({ success: true, product: trashed, message: 'Product moved to trash' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to trash product' });
    }
  });

  // Dedicated Product Handling Content API
  app.get('/api/product-handlings', (req, res) => {
    try {
      const allHandlings = storeDB.getAllProductHandlings();
      res.json({ success: true, handlings: allHandlings });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch product handling contents' });
    }
  });

  app.get('/api/products/:id/handling', (req, res) => {
    try {
      const handling = storeDB.getProductHandling(req.params.id);
      res.json({ success: true, handling });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch product handling content' });
    }
  });

  app.put('/api/products/:id/handling', requireAdminAuth, (req, res) => {
    try {
      const saved = storeDB.saveProductHandling({
        ...req.body,
        productId: req.params.id
      });
      res.json({ success: true, handling: saved, message: 'Product handling content saved successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save product handling content' });
    }
  });

  app.post('/api/products/:id/handling/clear', requireAdminAuth, (req, res) => {
    try {
      storeDB.clearProductHandling(req.params.id);
      res.json({ success: true, message: 'Product handling content cleared successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to clear product handling content' });
    }
  });

  // 5. Orders API
  app.get('/api/orders', requireAdminAuth, (req, res) => {
    try {
      const { status, paymentMethod, paymentStatus, city, search } = req.query;
      const orders = storeDB.getOrders({
        status: status as string,
        paymentMethod: paymentMethod as string,
        paymentStatus: paymentStatus as string,
        city: city as string,
        search: search as string
      });
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.get('/api/orders/:id', requireAdminAuth, (req, res) => {
    const order = storeDB.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  });

  app.post('/api/orders', (req, res) => {
    try {
      const { customer, item, pricing, payment } = req.body;
      if (!customer?.fullName || !customer?.mobileNumber || !customer?.address || !customer?.city) {
        return res.status(400).json({ error: 'Customer details (name, mobile number, city, address) are required' });
      }

      const newOrder = storeDB.createOrder({
        customer,
        item: item || {},
        pricing,
        payment
      });

      res.status(201).json({ success: true, order: newOrder });
    } catch (err: any) {
      console.error('Order creation error:', err);
      res.status(500).json({ error: err.message || 'Failed to place order' });
    }
  });

  app.patch('/api/orders/:id/status', requireAdminAuth, (req, res) => {
    try {
      const { status, note, paymentStatus } = req.body;
      const updated = storeDB.updateOrderStatus(req.params.id, status, note, paymentStatus);
      if (!updated) return res.status(404).json({ error: 'Order not found' });
      res.json({ success: true, order: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  app.post('/api/orders/:id/notes', requireAdminAuth, (req, res) => {
    try {
      const { note } = req.body;
      if (!note) return res.status(400).json({ error: 'Note is required' });
      const updated = storeDB.addOrderNote(req.params.id, note);
      if (!updated) return res.status(404).json({ error: 'Order not found' });
      res.json({ success: true, order: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to add note' });
    }
  });

  app.delete('/api/orders', requireAdminAuth, (req, res) => {
    try {
      const count = storeDB.deleteAllOrders();
      res.json({ success: true, count, message: `Successfully deleted all ${count} orders` });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to clear all orders' });
    }
  });

  app.delete('/api/orders/:id', requireAdminAuth, (req, res) => {
    try {
      const deleted = storeDB.deleteOrder(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Order not found' });
      res.json({ success: true, message: 'Order deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  app.post('/api/orders/test-order', requireAdminAuth, (req, res) => {
    try {
      const sampleCustomers = [
        { name: 'Dr. Faheem Qureshi', phone: '0300-9841256', city: 'Lahore', address: 'House 52, Main Boulevard, Gulberg III', prov: 'Punjab' },
        { name: 'Zainab Bibi', phone: '0321-4567890', city: 'Karachi', address: 'Apartment 304, Block 10, Federal B Area', prov: 'Sindh' },
        { name: 'Hamza Malik', phone: '0345-1234567', city: 'Islamabad', address: 'House 14, Street 9, Sector G-11/3', prov: 'Islamabad Capital' },
        { name: 'Naveed Akhtar', phone: '0333-8765432', city: 'Faisalabad', address: 'Near Rex City, Satiana Road', prov: 'Punjab' },
        { name: 'Rubina Kausar', phone: '0312-3456789', city: 'Rawalpindi', address: 'Street 4, Chaklala Scheme 3', prov: 'Punjab' }
      ];

      const pick = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
      const isJazzCash = Math.random() > 0.4;
      const published = storeDB.getPublishedProduct();

      const newOrder = storeDB.createOrder({
        customer: {
          fullName: pick.name,
          mobileNumber: pick.phone,
          whatsappNumber: pick.phone,
          province: pick.prov,
          city: pick.city,
          address: pick.address,
          nearbyLandmark: 'Main Chowk / Commercial Gate',
          customerNote: 'Please deliver after 3:00 PM'
        },
        item: {
          productId: published.id,
          productTitle: published.title,
          sku: published.sku || 'AE-CHOP-01',
          variant: published.variants[0]?.name || 'Emerald Forest Green',
          quantity: Math.random() > 0.7 ? 2 : 1,
          unitPrice: published.salePrice
        },
        payment: {
          method: isJazzCash ? 'jazzcash' : 'cod',
          status: isJazzCash ? 'pending_verification' : 'pending_confirmation',
          transactionId: isJazzCash ? 'JC' + Math.floor(1000000000 + Math.random() * 9000000000) : '',
          screenshotUrl: isJazzCash ? '/assets/ammi-express-real-jazzcash-qr.png' : ''
        }
      });

      res.status(201).json({ success: true, order: newOrder });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create test order' });
    }
  });

  // 6. Payments API
  app.get('/api/payments', requireAdminAuth, (req, res) => {
    try {
      const orders = storeDB.getOrders();
      const payments = orders.map(o => ({
        id: 'pay-' + o.id,
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer.fullName,
        customerPhone: o.customer.mobileNumber,
        method: o.payment.method,
        status: o.payment.status,
        amount: o.pricing.grandTotal,
        transactionId: o.payment.transactionId,
        screenshotUrl: o.payment.screenshotUrl,
        verifiedAt: o.payment.verifiedAt,
        adminNote: o.payment.adminNote,
        createdAt: o.createdAt
      }));
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  });

  app.patch('/api/payments/:orderId/verify', requireAdminAuth, (req, res) => {
    try {
      const { note } = req.body;
      const verified = storeDB.verifyPayment(req.params.orderId, note);
      if (!verified) return res.status(404).json({ error: 'Order not found' });
      res.json({ success: true, order: verified });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to verify payment' });
    }
  });

  app.patch('/api/payments/:orderId/reject', requireAdminAuth, (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });
      const rejected = storeDB.rejectPayment(req.params.orderId, reason);
      if (!rejected) return res.status(404).json({ error: 'Order not found' });
      res.json({ success: true, order: rejected });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to reject payment' });
    }
  });

  // 7. Customers API
  app.get('/api/customers', requireAdminAuth, (req, res) => {
    try {
      const customers = storeDB.getCustomers();
      res.json(customers);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load customers' });
    }
  });

  // 8. Inventory API
  app.get('/api/inventory', requireAdminAuth, (req, res) => {
    try {
      const inventory = storeDB.getInventory();
      res.json(inventory);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load inventory' });
    }
  });

  app.post('/api/inventory/adjust', requireAdminAuth, (req, res) => {
    try {
      const { productId, quantityChange, reason } = req.body;
      if (!productId || quantityChange === undefined || !reason) {
        return res.status(400).json({ error: 'Product ID, quantity change, and reason are required' });
      }
      const result = storeDB.adjustInventory(productId, Number(quantityChange), String(reason));
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to adjust inventory' });
    }
  });

  // 9. Reviews API
  app.get('/api/reviews', (req, res) => {
    res.json(storeDB.getReviews());
  });

  app.post('/api/reviews', (req, res) => {
    try {
      const { name, city, rating, comment } = req.body;
      if (!name || !rating || !comment) {
        return res.status(400).json({ error: 'Name, rating, and comment are required' });
      }
      const newRev = storeDB.createReview(req.body);
      res.status(201).json({ success: true, review: newRev });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to post review' });
    }
  });

  app.put('/api/reviews/:id', requireAdminAuth, (req, res) => {
    try {
      const updated = storeDB.updateReview(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Review not found' });
      res.json({ success: true, review: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update review' });
    }
  });

  app.put('/api/reviews', requireAdminAuth, (req, res) => {
    try {
      if (Array.isArray(req.body)) {
        req.body.forEach((r: CustomerReview) => {
          storeDB.updateReview(r.id, r);
        });
        res.json({ success: true, reviews: storeDB.getReviews() });
      } else {
        res.status(400).json({ error: 'Expected array of reviews' });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update reviews' });
    }
  });

  app.delete('/api/reviews/:id', requireAdminAuth, (req, res) => {
    try {
      const deleted = storeDB.deleteReview(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Review not found' });
      res.json({ success: true, message: 'Review deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete review' });
    }
  });

  // 10. FAQs API
  app.get('/api/faqs', (req, res) => {
    res.json(storeDB.getFAQs());
  });

  app.put('/api/faqs', requireAdminAuth, (req, res) => {
    try {
      if (Array.isArray(req.body)) {
        const updated = storeDB.updateFAQs(req.body);
        res.json({ success: true, faqs: updated });
      } else {
        res.status(400).json({ error: 'Expected array of FAQs' });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update FAQs' });
    }
  });

  // 11. Settings & Policies API
  app.get('/api/settings', (req, res) => {
    res.json(storeDB.getSettings());
  });

  app.put('/api/settings', requireAdminAuth, (req, res) => {
    try {
      const updated = storeDB.updateSettings(req.body);
      res.json({ success: true, settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.put('/api/settings/logo', requireAdminAuth, (req, res) => {
    try {
      const { logoUrl, logoWidth, logoHeight, logoAlignment, showLogo, logoBg } = req.body;
      const updates: any = {};
      if (logoUrl !== undefined) updates.logoUrl = logoUrl;
      if (logoWidth !== undefined) updates.logoWidth = Number(logoWidth);
      if (logoHeight !== undefined) updates.logoHeight = Number(logoHeight);
      if (logoAlignment !== undefined) updates.logoAlignment = logoAlignment;
      if (showLogo !== undefined) updates.showLogo = Boolean(showLogo);
      if (logoBg !== undefined) updates.logoBg = logoBg;

      const updated = storeDB.updateSettings(updates);
      res.json({ success: true, settings: updated, message: 'Logo settings updated successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update logo settings' });
    }
  });

  app.put('/api/settings/qr', requireAdminAuth, (req, res) => {
    try {
      const current = storeDB.getSettings();
      const qrUrl = req.body.qrImageUrl || req.body.qrCodeImage || (current.jazzCashPayment && (current.jazzCashPayment.qrCodeImage || (current.jazzCashPayment as any).qrImageUrl));
      const updatedJazzCash = {
        ...current.jazzCashPayment,
        ...req.body,
        qrCodeImage: qrUrl,
        qrImageUrl: qrUrl
      };
      const updated = storeDB.updateSettings({ jazzCashPayment: updatedJazzCash });
      res.json({ success: true, jazzCashPayment: updated.jazzCashPayment, settings: updated, message: 'QR Code & JazzCash settings updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update QR code settings' });
    }
  });

  app.put('/api/settings/homepage', requireAdminAuth, (req, res) => {
    try {
      const current = storeDB.getSettings();
      const updates: any = {};
      if (req.body.heroSettings) {
        updates.heroSettings = { ...current.heroSettings, ...req.body.heroSettings };
      }
      if (req.body.visibility) {
        updates.visibility = { ...current.visibility, ...req.body.visibility };
      }
      if (req.body.announcementBar) {
        updates.announcementBar = { ...current.announcementBar, ...req.body.announcementBar };
      }
      const updated = storeDB.updateSettings(updates);
      res.json({ success: true, settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update homepage settings' });
    }
  });

  app.put('/api/settings/footer', requireAdminAuth, (req, res) => {
    try {
      const current = storeDB.getSettings();
      const footerSettings = {
        ...current.footerSettings,
        ...req.body
      };
      const updated = storeDB.updateSettings({ footerSettings });
      res.json({ success: true, footerSettings: updated.footerSettings });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update footer settings' });
    }
  });

  app.put('/api/settings/policies', requireAdminAuth, (req, res) => {
    try {
      const current = storeDB.getSettings();
      const updated = storeDB.updateSettings({
        policies: { ...current.policies, ...req.body }
      });
      res.json({ success: true, policies: updated.policies });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update policies' });
    }
  });

  // 11b. Categories API
  app.get('/api/categories', (req, res) => {
    try {
      res.json(storeDB.getCategories());
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load categories' });
    }
  });

  app.post('/api/categories', requireAdminAuth, (req, res) => {
    try {
      if (!req.body.name) {
        return res.status(400).json({ error: 'Category name is required' });
      }
      const category = storeDB.saveCategory(req.body);
      res.status(201).json({ success: true, category });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create category' });
    }
  });

  app.put('/api/categories/:id', requireAdminAuth, (req, res) => {
    try {
      const category = storeDB.saveCategory({ ...req.body, id: req.params.id });
      res.json({ success: true, category });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update category' });
    }
  });

  app.delete('/api/categories/:id', requireAdminAuth, (req, res) => {
    try {
      const result = storeDB.deleteCategory(req.params.id);
      if (!result.success) return res.status(404).json({ error: result.error });
      res.json({ success: true, message: 'Category deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  app.post('/api/categories/reorder', requireAdminAuth, (req, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });
      const categories = storeDB.reorderCategories(orderedIds);
      res.json({ success: true, categories });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to reorder categories' });
    }
  });

  // 11c. Homepage Sections API
  app.get('/api/homepage-sections', (req, res) => {
    try {
      res.json(storeDB.getHomepageSections());
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load homepage sections' });
    }
  });

  app.post('/api/homepage-sections', requireAdminAuth, (req, res) => {
    try {
      if (!req.body.title) {
        return res.status(400).json({ error: 'Section title is required' });
      }
      const section = storeDB.saveHomepageSection(req.body);
      res.status(201).json({ success: true, section });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create section' });
    }
  });

  app.put('/api/homepage-sections/:id', requireAdminAuth, (req, res) => {
    try {
      const section = storeDB.saveHomepageSection({ ...req.body, id: req.params.id });
      res.json({ success: true, section });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update section' });
    }
  });

  app.delete('/api/homepage-sections/:id', requireAdminAuth, (req, res) => {
    try {
      const result = storeDB.deleteHomepageSection(req.params.id);
      if (!result.success) return res.status(404).json({ error: result.error });
      res.json({ success: true, message: 'Section deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete section' });
    }
  });

  app.post('/api/homepage-sections/reorder', requireAdminAuth, (req, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });
      const sections = storeDB.reorderHomepageSections(orderedIds);
      res.json({ success: true, sections });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to reorder sections' });
    }
  });

  // 11d. Banners API
  app.get('/api/banners', (req, res) => {
    try {
      res.json(storeDB.getBanners());
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load banners' });
    }
  });

  app.post('/api/banners', requireAdminAuth, (req, res) => {
    try {
      if (!req.body.title) return res.status(400).json({ error: 'Banner title is required' });
      const banner = storeDB.saveBanner(req.body);
      res.status(201).json({ success: true, banner });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create banner' });
    }
  });

  app.put('/api/banners/:id', requireAdminAuth, (req, res) => {
    try {
      const banner = storeDB.saveBanner({ ...req.body, id: req.params.id });
      res.json({ success: true, banner });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update banner' });
    }
  });

  app.delete('/api/banners/:id', requireAdminAuth, (req, res) => {
    try {
      const result = storeDB.deleteBanner(req.params.id);
      if (!result.success) return res.status(404).json({ error: result.error });
      res.json({ success: true, message: 'Banner deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete banner' });
    }
  });

  // 11e. Social Links API
  app.get('/api/social-links', (req, res) => {
    try {
      res.json(storeDB.getSocialLinks());
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load social links' });
    }
  });

  app.post('/api/social-links', requireAdminAuth, (req, res) => {
    try {
      if (!req.body.platform || !req.body.url) {
        return res.status(400).json({ error: 'Platform and URL are required' });
      }
      const link = storeDB.saveSocialLink(req.body);
      res.status(201).json({ success: true, link });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create social link' });
    }
  });

  app.put('/api/social-links/:id', requireAdminAuth, (req, res) => {
    try {
      const link = storeDB.saveSocialLink({ ...req.body, id: req.params.id });
      res.json({ success: true, link });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update social link' });
    }
  });

  app.delete('/api/social-links/:id', requireAdminAuth, (req, res) => {
    try {
      const result = storeDB.deleteSocialLink(req.params.id);
      if (!result.success) return res.status(404).json({ error: result.error });
      res.json({ success: true, message: 'Social link deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete social link' });
    }
  });

  app.post('/api/social-links/reorder', requireAdminAuth, (req, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });
      const links = storeDB.reorderSocialLinks(orderedIds);
      res.json({ success: true, links });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to reorder social links' });
    }
  });

  app.get('/api/settings/social', (req, res) => {
    try {
      const settings = storeDB.getSettings();
      res.json(settings.socialLinks || {});
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch social links settings' });
    }
  });

  app.put('/api/settings/social', requireAdminAuth, (req, res) => {
    try {
      const updated = storeDB.updateSocialLinksSettings(req.body);
      res.json({ success: true, socialLinks: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update social links settings' });
    }
  });

  // 12. Notifications API
  app.get('/api/notifications', requireAdminAuth, (req, res) => {
    res.json(storeDB.getNotifications());
  });

  app.patch('/api/notifications/:id/read', requireAdminAuth, (req, res) => {
    const updated = storeDB.markNotificationRead(req.params.id);
    res.json({ success: true, notification: updated });
  });

  app.post('/api/notifications/read-all', requireAdminAuth, (req, res) => {
    storeDB.markAllNotificationsRead();
    res.json({ success: true, message: 'All notifications marked as read' });
  });

  // 13. Analytics API
  app.get('/api/analytics', requireAdminAuth, (req, res) => {
    try {
      const { range, startDate, endDate } = req.query;
      const analytics = storeDB.getAnalytics(range as string, {
        start: startDate as string,
        end: endDate as string
      });
      res.json(analytics);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compute analytics' });
    }
  });

  // 13a. Real-time Live Analytics & Visitor Counter (Free-Host Optimized)
  app.get('/api/analytics/live', (req, res) => {
    try {
      const summary = storeDB.getLiveAnalyticsSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve live analytics' });
    }
  });

  app.post('/api/analytics/track', (req, res) => {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          // ignore
        }
      }
      const { event, action, visitorId } = body || {};
      if (event === 'page_view' || event === 'click') {
        storeDB.recordAnalyticsEvent(event, action, visitorId);
      }
      res.status(200).json({ ok: true });
    } catch (err: any) {
      res.status(200).json({ ok: false });
    }
  });

  // 13b. Performance Monitor Telemetry & Threshold API
  app.get('/api/performance-metrics', (req, res) => {
    try {
      const report = storeDB.getPerformanceReport();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve performance report' });
    }
  });

  app.post('/api/performance-metrics', (req, res) => {
    try {
      const {
        initialLoadTimeMs,
        apiLatencyMs,
        apiPayloadSizeBytes,
        imageLoadTimeMs,
        imageCount,
        slowestImageName,
        slowestImageTimeMs,
        totalImageSizeBytes,
        imagesDetail,
        resourcesSummary,
        ttfbMs,
        domContentLoadedMs,
        dnsTimeMs,
        tcpTimeMs,
        navigationType,
        thresholdMs,
        page
      } = req.body;

      if (initialLoadTimeMs === undefined || initialLoadTimeMs === null) {
        return res.status(400).json({ error: 'initialLoadTimeMs is required' });
      }

      const metric = storeDB.recordPerformanceMetric({
        initialLoadTimeMs: Number(initialLoadTimeMs),
        apiLatencyMs: apiLatencyMs !== undefined ? Number(apiLatencyMs) : undefined,
        apiPayloadSizeBytes: apiPayloadSizeBytes !== undefined ? Number(apiPayloadSizeBytes) : undefined,
        imageLoadTimeMs: imageLoadTimeMs !== undefined ? Number(imageLoadTimeMs) : undefined,
        imageCount: imageCount !== undefined ? Number(imageCount) : undefined,
        slowestImageName: slowestImageName ? String(slowestImageName) : undefined,
        slowestImageTimeMs: slowestImageTimeMs !== undefined ? Number(slowestImageTimeMs) : undefined,
        totalImageSizeBytes: totalImageSizeBytes !== undefined ? Number(totalImageSizeBytes) : undefined,
        imagesDetail: Array.isArray(imagesDetail) ? imagesDetail : undefined,
        resourcesSummary: resourcesSummary ? resourcesSummary : undefined,
        ttfbMs: ttfbMs !== undefined ? Number(ttfbMs) : undefined,
        domContentLoadedMs: domContentLoadedMs !== undefined ? Number(domContentLoadedMs) : undefined,
        dnsTimeMs: dnsTimeMs !== undefined ? Number(dnsTimeMs) : undefined,
        tcpTimeMs: tcpTimeMs !== undefined ? Number(tcpTimeMs) : undefined,
        navigationType: navigationType || 'navigate',
        thresholdMs: thresholdMs ? Number(thresholdMs) : undefined,
        userAgent: (req.headers['user-agent'] as string) || '',
        page: page || 'storefront'
      });

      res.status(201).json({
        success: true,
        metric,
        report: storeDB.getPerformanceReport()
      });
    } catch (err: any) {
      console.error('Failed to record performance metric:', err);
      res.status(500).json({ error: 'Failed to record performance metric' });
    }
  });

  app.put('/api/performance-metrics/settings', requireAdminAuth, (req, res) => {
    try {
      const { thresholdMs, alertEnabled, trackStorefront } = req.body;
      const updates: any = {};
      if (thresholdMs !== undefined) updates.thresholdMs = Math.max(100, Math.round(Number(thresholdMs)));
      if (alertEnabled !== undefined) updates.alertEnabled = Boolean(alertEnabled);
      if (trackStorefront !== undefined) updates.trackStorefront = Boolean(trackStorefront);

      const settings = storeDB.updatePerformanceSettings(updates);
      res.json({
        success: true,
        settings,
        report: storeDB.getPerformanceReport()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update performance settings' });
    }
  });

  app.post('/api/performance-metrics/simulate', requireAdminAuth, (req, res) => {
    try {
      const loadTime = Number(req.body.initialLoadTimeMs) || 2850;
      const settings = storeDB.getPerformanceSettings();
      const metric = storeDB.recordPerformanceMetric({
        initialLoadTimeMs: loadTime,
        apiLatencyMs: Math.round(loadTime * 0.38),
        apiPayloadSizeBytes: 42800,
        imageLoadTimeMs: Math.round(loadTime * 0.52),
        imageCount: 14,
        slowestImageName: '/uploads/chopper-hero-emerald-forest.webp',
        slowestImageTimeMs: Math.round(loadTime * 0.48),
        totalImageSizeBytes: 1420500,
        imagesDetail: [
          { name: 'chopper-hero-emerald-forest.webp', durationMs: Math.round(loadTime * 0.48), transferSizeBytes: 412000, initiatorType: 'img' },
          { name: 'ammi-express-real-jazzcash-qr.png', durationMs: Math.round(loadTime * 0.22), transferSizeBytes: 98400, initiatorType: 'img' },
          { name: 'chopper-specs-diagram.webp', durationMs: Math.round(loadTime * 0.31), transferSizeBytes: 245000, initiatorType: 'img' },
          { name: 'ammi-express-logo-badge.png', durationMs: Math.round(loadTime * 0.15), transferSizeBytes: 45000, initiatorType: 'img' }
        ],
        resourcesSummary: {
          imagesCount: 14,
          scriptsCount: 5,
          stylesheetsCount: 2,
          totalTransferBytes: 1980000
        },
        ttfbMs: Math.round(loadTime * 0.15),
        domContentLoadedMs: Math.round(loadTime * 0.65),
        navigationType: 'simulated_test',
        thresholdMs: req.body.thresholdMs ? Number(req.body.thresholdMs) : settings.thresholdMs,
        page: 'storefront',
        userAgent: 'Simulated Benchmark Test'
      });

      res.status(201).json({
        success: true,
        simulated: true,
        metric,
        report: storeDB.getPerformanceReport()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to simulate performance metric' });
    }
  });

  app.delete('/api/performance-metrics', requireAdminAuth, (req, res) => {
    try {
      storeDB.clearPerformanceMetrics();
      res.json({
        success: true,
        message: 'Performance metrics history cleared',
        report: storeDB.getPerformanceReport()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to clear performance metrics' });
    }
  });

  // 14. Real Secure File/Image Upload (Saves to Firebase Cloud Storage + Disk Cache + Firestore Metadata)
  app.post('/api/upload', requireAdminAuth, async (req, res) => {
    try {
      const { dataUrl, filename, category } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: 'No dataUrl provided' });
      }

      // If already an absolute or relative static URL
      if (typeof dataUrl === 'string' && (dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('/uploads/') || dataUrl.startsWith('/assets/'))) {
        return res.json({ success: true, url: dataUrl });
      }

      // Match base64 Data URL
      const matches = dataUrl.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid image format. Allowed formats: PNG, JPG, JPEG, WebP.' });
      }

      const mimeType = matches[1].toLowerCase();
      // Strict image validation: allow only appropriate image formats (JPG/JPEG, PNG, WEBP)
      if (!mimeType.includes('jpeg') && !mimeType.includes('jpg') && !mimeType.includes('png') && !mimeType.includes('webp')) {
        return res.status(400).json({ error: 'Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP.' });
      }

      let ext = 'jpg';
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';

      const buffer = Buffer.from(matches[2], 'base64');
      // Enforce 15MB file size limit
      if (buffer.length > 15 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size exceeds 15MB limit.' });
      }

      const targetDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Generate safe unique filename (no path traversal, unique entropy)
      const cleanCategory = (category || 'products').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 15) || 'products';
      const randomEntropy = Math.random().toString(36).substring(2, 9);
      const cleanBase = filename
        ? path.basename(filename).toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25)
        : 'media';
      const finalFileName = `${cleanCategory}-${Date.now()}-${randomEntropy}-${cleanBase}.${ext}`;
      const filePath = path.join(targetDir, finalFileName);

      // Write to local disk cache for lightning-fast delivery
      fs.writeFileSync(filePath, buffer);

      // Upload to Firebase Cloud Storage (permanent across restarts and deployments)
      let cloudResult: { imageUrl: string; storagePath: string } | null = null;
      try {
        cloudResult = await storeDB.uploadImageToCloudStorage(finalFileName, buffer, mimeType, cleanCategory);
      } catch (uploadErr) {
        console.warn('Notice: Firebase Cloud Storage upload encountered an issue, saved to local storage:', uploadErr);
      }

      const publicUrl = cloudResult?.imageUrl || `/uploads/${finalFileName}`;
      const storagePath = cloudResult?.storagePath || `uploads/${cleanCategory}/${finalFileName}`;

      // Persist image data and metadata to Google Cloud Firestore permanently (with base64 and chunking support)
      const base64Data = buffer.toString('base64');
      await storeDB.saveImageToFirestore(finalFileName, mimeType, base64Data, buffer.length, {
        imageUrl: publicUrl,
        storagePath,
        category: cleanCategory
      }).catch((err) => {
        console.error(`Failed to sync uploaded image metadata ${finalFileName} to Cloud Firestore:`, err);
      });

      res.json({
        success: true,
        url: publicUrl,
        filename: finalFileName,
        storagePath,
        size: buffer.length,
        mimeType,
        persistent: true
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      res.status(500).json({ error: 'Failed to process file upload' });
    }
  });

  // 14b. Permanent Delete Image from Disk, Firebase Cloud Storage, and Cloud Firestore
  app.delete('/api/images/:filename', requireAdminAuth, async (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
      await storeDB.deleteImageFromFirestore(filename);
      res.json({ success: true, message: `Image ${filename} deleted permanently` });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete image' });
    }
  });

  // 15. Demo Reset API
  app.post('/api/reset-demo', requireAdminAuth, (req, res) => {
    try {
      storeDB.resetToDefaults();
      res.json({ success: true, message: 'Reset to demo defaults' });
    } catch (err: any) {
      res.status(500).json({ error: 'Reset failed' });
    }
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ammi Express Full-Stack Server active on http://0.0.0.0:${PORT}`);

    // Automated background keep-alive ping loop for Render deployment
    // Render free tier sleeps after 15 min of inactivity; this background ping executes every 10 minutes
    const resolvedExternalUrl =
      process.env.RENDER_EXTERNAL_URL ||
      (process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : '') ||
      process.env.APP_URL;

    const pingUrl = resolvedExternalUrl
      ? `${resolvedExternalUrl.replace(/\/$/, '')}/api/health`
      : `http://127.0.0.1:${PORT}/api/health`;

    console.log(`⏱️ Setting up automated Render keep-alive pings to: ${pingUrl} (every 10m)`);

    const triggerPing = async () => {
      try {
        const pingRes = await fetch(pingUrl, {
          headers: { 'User-Agent': 'AmmiExpress-KeepAlive/1.0' }
        });
        if (pingRes.ok) {
          console.log(`[Keep-Alive] Render background ping successful (${new Date().toISOString()})`);
        }
      } catch (pingErr) {
        console.warn('[Keep-Alive] Ping note:', pingErr);
      }
    };

    // Initial ping after 20 seconds to warm up route handlers and DB cache
    setTimeout(triggerPing, 20 * 1000);
    // Recurring keep-alive every 10 minutes
    setInterval(triggerPing, 10 * 60 * 1000);
  });
}

startServer().catch(err => {
  console.error('Server failed to start:', err);
});
