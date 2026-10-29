-- ========================================================
-- AMMI EXPRESS - POSTGRESQL PRODUCTION DATABASE SCHEMA
-- Single-Product E-commerce Management System & Admin Panel
-- ========================================================

-- 1. AdminUsers Table
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(64) UNIQUE NOT NULL,
    headline VARCHAR(255),
    badge VARCHAR(128),
    rating NUMERIC(2, 1) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    short_description TEXT NOT NULL,
    regular_price INTEGER NOT NULL,
    sale_price INTEGER NOT NULL,
    cost_price INTEGER DEFAULT 0,
    currency VARCHAR(16) DEFAULT 'Rs.',
    stock_count INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived', 'unpublished')),
    is_main_storefront BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_main ON products(is_main_storefront);

-- 3. ProductImages Table
CREATE TABLE IF NOT EXISTS product_images (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ProductVariants Table
CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    color_code VARCHAR(32),
    sku_modifier VARCHAR(64),
    price_modifier INTEGER DEFAULT 0,
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ProductFeatures Table
CREATE TABLE IF NOT EXISTS product_features (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    icon VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    highlight BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0
);

-- 6. ProductSpecifications Table
CREATE TABLE IF NOT EXISTS product_specifications (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    label VARCHAR(128) NOT NULL,
    value VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- 7. ProductFAQs Table
CREATE TABLE IF NOT EXISTS product_faqs (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 8. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    city VARCHAR(128) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    date_display VARCHAR(64),
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN DEFAULT TRUE,
    approved BOOLEAN DEFAULT TRUE,
    user_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);

-- 9. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(128) NOT NULL,
    mobile_number VARCHAR(32) UNIQUE NOT NULL,
    whatsapp_number VARCHAR(32),
    email VARCHAR(128),
    province VARCHAR(64),
    city VARCHAR(64) NOT NULL,
    address TEXT NOT NULL,
    landmark VARCHAR(128),
    total_orders INTEGER DEFAULT 1,
    delivered_orders INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    last_order_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(mobile_number);

-- 10. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    order_number VARCHAR(64) UNIQUE NOT NULL,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'dispatched', 'delivered', 'cancelled', 'returned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Customer snapshot at order time
    customer_name VARCHAR(128) NOT NULL,
    customer_mobile VARCHAR(32) NOT NULL,
    customer_whatsapp VARCHAR(32),
    customer_city VARCHAR(64) NOT NULL,
    customer_province VARCHAR(64),
    customer_address TEXT NOT NULL,
    customer_landmark VARCHAR(128),
    customer_note TEXT,
    
    -- Financials
    subtotal INTEGER NOT NULL,
    delivery_charge INTEGER NOT NULL DEFAULT 180,
    discount INTEGER DEFAULT 0,
    grand_total INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- 11. OrderItems Table (Historical Product Snapshot)
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64),
    product_title VARCHAR(255) NOT NULL,
    sku VARCHAR(64),
    variant VARCHAR(128),
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price INTEGER NOT NULL
);

-- 12. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
    method VARCHAR(32) NOT NULL CHECK (method IN ('cod', 'jazzcash')),
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'confirmed', 'rejected', 'refunded')),
    amount INTEGER NOT NULL,
    transaction_id VARCHAR(128),
    screenshot_url TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(64) REFERENCES admin_users(id),
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);

-- 13. OrderStatusHistory Table
CREATE TABLE IF NOT EXISTS order_status_history (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,
    note TEXT,
    created_by VARCHAR(128) DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. InventoryMovements Table
CREATE TABLE IF NOT EXISTS inventory_movements (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    product_title VARCHAR(255) NOT NULL,
    movement_type VARCHAR(32) NOT NULL CHECK (movement_type IN ('order_deduct', 'restock', 'manual_adjust', 'return_restock')),
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT NOT NULL,
    performed_by VARCHAR(128) DEFAULT 'System',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. SocialLinks Table
CREATE TABLE IF NOT EXISTS social_links (
    id VARCHAR(64) PRIMARY KEY,
    platform VARCHAR(32) UNIQUE NOT NULL,
    url VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. PaymentMethods Settings Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL CHECK (code IN ('cod', 'jazzcash')),
    name VARCHAR(128) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    account_title VARCHAR(128),
    till_id VARCHAR(64),
    account_number VARCHAR(64),
    qr_code_image TEXT,
    instructions TEXT,
    verification_notice TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. SiteSettings Table
CREATE TABLE IF NOT EXISTS site_settings (
    id VARCHAR(64) PRIMARY KEY,
    brand_name VARCHAR(128) DEFAULT 'Ammi Express',
    logo_url TEXT,
    currency VARCHAR(16) DEFAULT 'Rs.',
    delivery_charge INTEGER DEFAULT 180,
    announcement_enabled BOOLEAN DEFAULT TRUE,
    announcement_text TEXT,
    whatsapp_number VARCHAR(32) DEFAULT '0308-2494870',
    whatsapp_prefill TEXT,
    privacy_policy TEXT,
    terms_conditions TEXT,
    shipping_policy TEXT,
    return_refund_policy TEXT,
    contact_us TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) NOT NULL CHECK (type IN ('new_order', 'payment_proof', 'low_stock', 'order_cancelled')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_id VARCHAR(64),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
