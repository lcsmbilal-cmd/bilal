import {
  Product,
  StoreSettings,
  CustomerReview,
  FAQItem,
  ProductCategory,
  HomepageSection,
  StoreBanner,
  SocialMediaLink,
  ProductHandlingContent
} from '../types';

export const defaultProduct: Product = {
  id: 'prod-ammi-1790844044142',
  title: 'Premium Passport Holder & Travel Wallet – Durable Multi-Compartment Organizer for Passport, Cards, Cash & Travel Essentials | Random Colour',
  slug: 'premium-passport-holder-travel-wallet-durable-multi-compartment-organizer-for-passport-cards-cash-travel-essentials-random-colour',
  sku: 'PTW-001',
  categoryId: 'cat-travel',
  category: 'Travel & Accessories',
  headline: '✈️ Travel Smart, Stay Organized – Keep Your Essentials Secure Wherever You Go!',
  badge: '🔥 Travel Essential',
  rating: 5.0,
  reviewCount: 38,
  shortDescription: '✈️ Keep your passport, cards, cash, and travel essentials organized in one sleek, durable and convenient travel wallet.',
  regularPrice: 1500,
  salePrice: 1099,
  costPrice: 600,
  currency: 'Rs.',
  stockCount: 83,
  lowStockThreshold: 10,
  status: 'published',
  publishedAt: '2026-10-01T08:41:02.972Z',
  createdAt: '2026-10-01T08:40:44.142Z',
  images: [
    '/uploads/products-1790843166241-a7cq3yy-2026-09-25-4b2cf11b580c07.jpg',
    '/uploads/products-1790843167205-xn73gx4-2026-09-25-fe239213f7e3fa.jpg',
    '/uploads/products-1790843412811-7ux3d75-premium-gray-passport-org.jpg'
  ],
  productVideoLink: 'https://youtube.com/shorts/pRhaKgvlrYs?feature=share',
  videoUrl: 'https://youtube.com/shorts/pRhaKgvlrYs?feature=share',
  isFeatured: true,
  benefitsSection: {
    eyebrow: '✨ Premium Travel Organizer',
    heading: '✈️ Everything You Need for Organized & Stress-Free Travel',
    description: 'Keep your passport, cards, cash, SIM cards, and travel documents neatly organized in one compact and durable wallet—perfect for vacations, business trips, and everyday travel.'
  },
  benefits: [
    {
      id: 'ben-1790843498957-275',
      productId: 'prod-ammi-1790844044142',
      text: 'Complete Travel Organization',
      title: 'Complete Travel Organization',
      description: 'Keep your passport, cards, cash, SIM cards, and travel documents neatly organized in one place.',
      icon: 'Zap',
      enabled: true,
      displayOrder: 1
    },
    {
      id: 'ben-1790843525349-342',
      productId: 'prod-ammi-1790844044142',
      text: 'Multiple Compartments',
      title: 'Multiple Compartments',
      description: 'Separate compartments make it easy to store and quickly access your essential travel items.',
      icon: 'Star',
      enabled: true,
      displayOrder: 2
    },
    {
      id: 'ben-1790843566141-770',
      productId: 'prod-ammi-1790844044142',
      text: 'Durable & Stylish Design',
      title: 'Durable & Stylish Design',
      description: 'Made for regular travel with a practical, sleek design that\'s convenient to carry.',
      icon: 'CheckCircle2',
      enabled: true,
      displayOrder: 3
    },
    {
      id: 'ben-1790843601380-887',
      productId: 'prod-ammi-1790844044142',
      text: 'Compact & Travel-Friendly',
      title: 'Compact & Travel-Friendly',
      description: 'Lightweight and easy to carry in your backpack, handbag, or luggage—perfect for vacations and business trips.',
      icon: 'Flame',
      enabled: true,
      displayOrder: 4
    }
  ],
  features: [
    {
      id: 'f1',
      icon: 'Shield',
      title: 'Durable Synthetic Leather',
      description: 'High-quality water-resistant material designed to withstand heavy travel and daily use.',
      highlight: true
    },
    {
      id: 'f2',
      icon: 'Layers',
      title: 'Multi-Compartment Storage',
      description: 'Dedicated passport sleeve, 4 card slots, 2 SIM slots, cash sleeve, and boarding pass holder.'
    },
    {
      id: 'f3',
      icon: 'Lock',
      title: 'Secure Elastic Band Closure',
      description: 'Keeps all your personal documents safely tucked in without falling out during transit.'
    }
  ],
  detailedDescription: {
    intro: 'Keep your passport, cards, cash, and travel essentials organized in one compact and durable wallet. ✈️',
    bulletPoints: [
      'Dedicated Passport & Boarding Pass Compartments',
      '4 Credit / Debit Card Slots & 2 SIM Card Storage Slots',
      'Full-Length Currency Note Section for Cash & Receipts',
      'Elastic Band Closure Keeps Contents Firmly In Place'
    ],
    highlightBox: '⭐ 100% Genuine Quality Guarantee by Ammi Express: Open Parcel Delivery Check Available.',
    sections: []
  },
  howItWorks: [
    {
      step: 1,
      title: 'Place Passport & Cards',
      description: 'Slide your passport into the dedicated pocket and insert credit/debit/ID cards into the slots.'
    },
    {
      step: 2,
      title: 'Store Cash & Boarding Pass',
      description: 'Tuck currency notes and travel tickets into the full-size side sleeve.'
    },
    {
      step: 3,
      title: 'Fasten Elastic Band',
      description: 'Secure the durable elastic band and enjoy stress-free, organized airport & city travel.'
    }
  ],
  specifications: [
    { label: 'Product Type', value: 'Passport Holder & Travel Wallet' },
    { label: 'Material', value: 'Durable Synthetic Leather' },
    { label: 'Design', value: 'Sleek Multi-Compartment Design' },
    { label: 'Passport Slot', value: '1 Dedicated Slot' },
    { label: 'Card Slots', value: '4 Card Slots' },
    { label: 'SIM Card Slots', value: '2 SIM Card Slots' },
    { label: 'Cash / Note Slots', value: 'Multiple Note Compartments' },
    { label: 'Boarding Pass Slot', value: '1 Dedicated Slot' },
    { label: 'Closure', value: 'Elastic Strap Closure' },
    { label: 'Color', value: 'Random Colour' }
  ],
  variants: [
    { id: 'v-1790843964403', name: 'Grey', colorCode: '#707070', inStock: true }
  ]
};

export const defaultStoreSettings: StoreSettings = {
  brandName: 'Ammi Express',
  businessName: 'Ammi Express Pakistan',
  slogan: 'Smart Products. Better Everyday Living.',
  supportPhone: '0308-2494870',
  supportEmail: 'support@ammiexpress.pk',
  logoUrl: '',
  logoWidth: 160,
  logoHeight: 44,
  logoAlignment: 'left',
  showLogo: true,
  logoBg: 'transparent',
  faviconUrl: '',
  announcementBar: {
    enabled: true,
    text: '🚚 Fast Delivery All Over Pakistan | 💵 Cash on Delivery & JazzCash Available | ⚡ Limited Stock Sale',
    linkText: 'Order Now'
  },
  whatsappNumber: '0308-2494870',
  whatsappPrefilledMessage: 'Assalam-o-Alaikum Ammi Express, I need information about {product}.',
  deliveryCharge: 180,
  freeDeliveryAbove: 3500,
  deliveryInfo: {
    timeEstimate: '2 to 4 Business Days',
    citiesCovered: 'Delivering to over 250+ cities, towns, and villages across Pakistan',
    courierPartners: 'TCS, Leopards, Call Courier & Trax Express',
    packagingNotice: 'Bubble-wrapped double reinforced box to ensure zero transit damage.'
  },
  jazzCashPayment: {
    enabled: true,
    accountTitle: 'Ammi Express',
    tillId: '984210573',
    accountNumber: '0308-2494870',
    qrCodeImage: '/assets/ammi-express-real-jazzcash-qr.png',
    qrTitle: 'Ammi Express Official JazzCash / Raast Merchant Stand',
    qrDescription: 'Till ID: 984210573 | Dial *786*10# or Scan with JazzCash / Raast / Any Bank App',
    showQrCode: true,
    instructions: 'Open your JazzCash App > Tap "Scan QR" > Scan our verified Ammi Express merchant QR code or enter Till ID 984210573 (*786*10#) > Enter amount > Take a screenshot and enter the 10-digit Transaction ID below.',
    verificationNotice: 'Your payment will be manually verified by Ammi Express billing team within 30 minutes of order placement.'
  },
  codPayment: {
    enabled: true,
    instructions: 'Pay with physical cash to the courier rider upon package inspection and delivery.'
  },
  socialLinks: {
    facebook: 'https://facebook.com/ammiexpress.pk',
    instagram: 'https://instagram.com/ammiexpress.pk',
    tiktok: 'https://tiktok.com/@ammiexpress.pk',
    email: 'support@ammiexpress.pk',
    whatsapp: 'https://wa.me/923082494870',
    youtube: 'https://youtube.com/@ammiexpresspk',
    pinterest: 'https://pinterest.com/ammiexpresspk',
    twitter: 'https://twitter.com/ammiexpresspk'
  },
  heroSettings: {
    badge: '🔥 2025 Bestseller in Pakistan',
    heading: 'Instant Cooking Made Effortless with',
    headingHighlight: 'Ammi Express Smart Chopper',
    subheading: 'Wireless USB Rechargeable • 4 Stainless Steel Blades • 6-Second Quick Prep',
    description: 'Chop onions, garlic, ginger, green chillies, boneless meat, nuts, and baby food in seconds without burning eyes or messy kitchen counters.',
    buttonText: 'Order Cash On Delivery Now',
    buttonLink: '#order-form',
    saleNotice: 'Flash Sale: 40% OFF + 7-Day Replacement Guarantee'
  },
  footerSettings: {
    aboutText: "Pakistan's trusted store for innovative, high-quality household and kitchen lifestyle gadgets. We bring smart products to improve your everyday living.",
    showLogo: true,
    copyrightText: '© 2025 Ammi Express Pakistan. All Rights Reserved.',
    helplineNumber: '0308-2494870',
    operatingHours: '9:00 AM – 11:00 PM (Mon-Sun)',
    supportEmail: 'support@ammiexpress.pk',
    address: 'Ammi Express Logistics Center, Main Commercial Boulevard, Gulberg, Lahore, Pakistan',
    showSocialLinks: true,
    showNewsletter: true,
    newsletterTitle: 'Subscribe for Exclusive Deals & New Arrivals',
    newsletterDescription: 'Get WhatsApp and email alerts on upcoming seasonal discounts and kitchen essentials.'
  },
  colors: {
    primary: '#F5B800',
    dark: '#171717',
    accent: '#16803D'
  },
  visibility: {
    showAnnouncement: true,
    showHero: true,
    showCategories: true,
    showFeaturedProduct: true,
    showTrendingGrid: true,
    showBenefits: true,
    showDescription: true,
    showFeatures: true,
    showHowItWorks: true,
    showSpecs: true,
    showReviews: true,
    showTrust: true,
    showDelivery: true,
    showOrderForm: true,
    showFaqs: true,
    showFooterSocials: true,
    showHeaderSocials: true
  },
  trustPoints: [
    {
      id: 't1',
      icon: 'ShieldCheck',
      title: '7-Day Return & Replacement',
      description: 'If you receive any damaged or defective item, we replace it instantly with zero hassle.'
    },
    {
      id: 't2',
      icon: 'Truck',
      title: 'Fast Nationwide Delivery',
      description: 'Orders dispatched within 24 hours via premium tracked courier services across Pakistan.'
    },
    {
      id: 't3',
      icon: 'Banknote',
      title: 'Cash On Delivery Available',
      description: 'Pay safely with cash at your doorstep when you physically receive your package.'
    },
    {
      id: 't4',
      icon: 'Headphones',
      title: 'Direct WhatsApp Support',
      description: 'Real customer support on 0308-2494870 available 9:00 AM - 11:00 PM every day.'
    }
  ],
  trustSectionTexts: {
    badge: 'Our Guarantee',
    heading: 'Why Shop With Ammi Express?',
    description: 'Built with trust, reliability, and honest customer service for every Pakistani household.'
  },
  deliverySectionTexts: {
    badge: 'Nationwide Logistics',
    heading: 'Fast, Reliable Delivery Across Pakistan',
    description: "We partner with Pakistan's leading courier networks to ensure your parcel reaches safely."
  },
  reviewsSectionTexts: {
    badge: 'Real Pakistani Feedback',
    heading: 'Trusted by Thousands Across Pakistan',
    description: 'Real experiences from verified buyers in Lahore, Karachi, Islamabad, and across the country.'
  },
  faqSectionTexts: {
    badge: 'Got Questions?',
    heading: 'Frequently Asked Questions',
    description: 'Everything you need to know about placing your order, delivery, and payment.'
  },
  policies: {
    privacyPolicy: 'At Ammi Express, your privacy is strictly protected. We collect your delivery name, contact number, and address strictly for shipping and courier confirmation purposes. We never sell, share, or disclose your personal contact information to third parties.',
    termsConditions: 'All orders placed on Ammi Express are subject to telephone or WhatsApp confirmation before dispatch. Delivery timelines are typically 2 to 4 business days depending on city location. Customers must provide valid contact details to avoid delivery cancellation.',
    shippingPolicy: 'We ship nationwide using courier partners (TCS, Leopards, Trax). A flat delivery fee of Rs. 180 is applied at checkout. Once dispatched, a live tracking code is provided via SMS / WhatsApp.',
    returnRefundPolicy: 'We provide a 7-day hassle-free replacement warranty for manufacturing defects or shipping damages. Simply contact our official WhatsApp at 0308-2494870 with an unboxing video or photos, and our team will arrange a replacement parcel immediately.'
  },
  seo: {
    metaTitle: 'Ammi Express - Smart Products. Better Everyday Living',
    metaDescription: 'Shop premium home and kitchen products on Ammi Express Pakistan. Fast Cash on Delivery and JazzCash QR payment.'
  }
};

export const defaultReviews: CustomerReview[] = [
  {
    id: 'rev-1',
    name: 'Mrs. Farzana Tariq',
    city: 'Lahore (DHA Phase 5)',
    rating: 5,
    date: '3 days ago',
    comment: 'Bohot zabardast product hai! Daily handi banane k liye lehsan, adrak aur piaz 5 second me chop ho jata hai. Sabse achi baat wireless hai so switch board dhoondne ki zaroorat nahi. Parcel 2 din me TCS se mil gaya tha.',
    verifiedPurchase: true,
    approved: true
  },
  {
    id: 'rev-2',
    name: 'Muhammad Usman Sheikh',
    city: 'Karachi (Gulshan-e-Iqbal)',
    rating: 5,
    date: '1 week ago',
    comment: 'Ordered for my mother. She is very happy because unke haath me dard hota tha traditional chopper chalane se. Iska one-touch button bohot smooth hai. JazzCash payment ki thi aur Ammi Express team ne foran confirm kia.',
    verifiedPurchase: true,
    approved: true
  },
  {
    id: 'rev-3',
    name: 'Dr. Ayesha Malik',
    city: 'Islamabad (F-10)',
    rating: 5,
    date: '2 weeks ago',
    comment: 'Quality 10/10! Genuine stainless steel blades hain. Maine chicken boneless ka qeema bhi banaya hai, easily ho jata hai. Battery life is also very solid, still working on first charge. Highly recommended for every Pakistani kitchen.',
    verifiedPurchase: true,
    approved: true
  },
  {
    id: 'rev-4',
    name: 'Kashif Mehmood',
    city: 'Rawalpindi (Bahria Town)',
    rating: 5,
    date: '2 weeks ago',
    comment: 'Alhamdulillah received exact same item as shown in pictures. Packing bohot achi thi double bubble wrap ke sath. Delivery guy was professional and Cash on Delivery service was smooth.',
    verifiedPurchase: true,
    approved: true
  },
  {
    id: 'rev-5',
    name: 'Hina Bilal',
    city: 'Faisalabad (Kohinoor City)',
    rating: 5,
    date: '3 weeks ago',
    comment: 'Green chillies chop karte waqt hathon me jalan hoti thi pehle, but with this chopper it is so easy and clean! Washing is literally just running tap water. 5 stars to Ammi Express!',
    verifiedPurchase: true,
    approved: true
  },
  {
    id: 'rev-6',
    name: 'Syed Hamza Ali',
    city: 'Peshawar (Hayatabad)',
    rating: 4,
    date: '1 month ago',
    comment: 'Good product. Very useful for quick salad and chutney. Delivered on time. Customer support on WhatsApp answered all questions promptly.',
    verifiedPurchase: true,
    approved: true
  }
];

export const defaultFAQs: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I place an order?',
    answer: 'Simply select your desired color and quantity, fill in your delivery details in the order form at the bottom of the page, choose your preferred payment method (Cash on Delivery or JazzCash QR), and click "Complete Order". You will also receive an instant confirmation message.'
  },
  {
    id: 'faq-2',
    question: 'Is Cash on Delivery (COD) available across Pakistan?',
    answer: 'Yes! We provide Cash on Delivery all across Pakistan. You only pay cash to the courier rider when the parcel arrives safely at your doorstep.'
  },
  {
    id: 'faq-3',
    question: 'How do I pay using JazzCash QR?',
    answer: 'Select "JazzCash QR Payment" in the checkout form. You will see our verified Ammi Express QR Code and Till / Account details (0308-2494870). Scan with your JazzCash app, enter the grand total, and upload the screenshot or transaction ID. Your order will be prioritized and verified quickly.'
  },
  {
    id: 'faq-4',
    question: 'How long does delivery take?',
    answer: 'Standard delivery takes 2 to 4 business days. Major cities like Lahore, Karachi, Rawalpindi, and Islamabad usually receive deliveries within 48 to 72 hours via our courier partners (TCS, Leopards, Trax).'
  },
  {
    id: 'faq-5',
    question: 'Can I check the parcel before paying?',
    answer: 'Yes, we pack all items in genuine sealed boxes with our 7-Day Checking and Replacement Guarantee. If there is any fault, damage, or discrepancy, our WhatsApp support team (0308-2494870) resolves it immediately.'
  },
  {
    id: 'faq-6',
    question: 'What is included inside the box?',
    answer: 'The package contains 1x Ammi Express Smart Motor Unit, 1x 250ml Food-grade PC Bowl, 1x 4-Blade 304 Stainless Steel Cyclone Assembly, 1x USB Type-C Fast Charging Cable, and 1x English/Urdu User Instruction Manual.'
  }
];

export const defaultProducts: Product[] = [
  defaultProduct,
  {
    id: 'prod-ammi-02',
    title: 'Ammi Express 4-in-1 Handheld Electric Vegetable Cutter & Slicer',
    slug: 'ammi-express-4-in-1-handheld-vegetable-cutter',
    sku: 'AE-SLICER-02',
    headline: 'Next-Gen Kitchen Efficiency. Slice Directly Into Pot.',
    badge: '✨ Coming Up Next Week',
    rating: 4.8,
    reviewCount: 142,
    shortDescription: 'Convenient directly-in-pot slicing. Includes feeder hole for whole cucumbers, chillies, and celery with continuous slicing, plus cleaning brush attachment.',
    regularPrice: 3200,
    salePrice: 1950,
    costPrice: 950,
    currency: 'Rs.',
    stockCount: 45,
    lowStockThreshold: 10,
    status: 'draft',
    createdAt: '2025-01-05T00:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=1000&q=85'
    ],
    benefits: [
      {
        id: 'b2-1',
        productId: 'prod-ammi-02',
        text: 'Premium Stainless Steel Blades',
        title: 'Premium Stainless Steel',
        description: 'Hardened 304 food-grade stainless steel slicing disc for clean, even cuts.',
        icon: 'Zap',
        enabled: true,
        displayOrder: 1,
        createdAt: '2025-01-05T00:00:00.000Z',
        updatedAt: '2025-01-05T00:00:00.000Z'
      },
      {
        id: 'b2-2',
        productId: 'prod-ammi-02',
        text: '2-Year Replacement Warranty',
        title: '2-Year Warranty',
        description: 'Backed by nationwide Pakistani service and hassle-free warranty claim.',
        icon: 'ShieldCheck',
        enabled: true,
        displayOrder: 2,
        createdAt: '2025-01-05T00:00:00.000Z',
        updatedAt: '2025-01-05T00:00:00.000Z'
      },
      {
        id: 'b2-3',
        productId: 'prod-ammi-02',
        text: 'Wireless Handheld Operation',
        title: 'Wireless Operation',
        description: 'Slice directly over frying pans and woks without messy transfer boards.',
        icon: 'Sparkles',
        enabled: true,
        displayOrder: 3,
        createdAt: '2025-01-05T00:00:00.000Z',
        updatedAt: '2025-01-05T00:00:00.000Z'
      }
    ],
    features: [
      { id: 'f2-1', icon: 'Cpu', title: 'High-Speed Slicing Disc', description: 'Cuts uniform 2mm chips and slices directly over frying pans or salads.', highlight: true }
    ],
    detailedDescription: {
      intro: 'Revolutionary open-mouth slicer for ultra fast vegetable preparation.',
      bulletPoints: ['No pre-cutting needed', 'One-touch water rinse', 'Ergonomic comfortable grip'],
      highlightBox: '⭐ 100% Checking Guarantee by Ammi Express',
      sections: []
    },
    howItWorks: [
      { step: 1, title: 'Insert Veggies', description: 'Slide chillies or cucumbers into the top feeder.' },
      { step: 2, title: 'Slice', description: 'Press the trigger button to slice directly into your skillet.' }
    ],
    specifications: [
      { label: 'Material', value: 'ABS + 304 Stainless Steel' },
      { label: 'Battery', value: '1200mAh USB Rechargeable' }
    ],
    variants: [
      { id: 'v2-1', name: 'Fresh Mint Green', inStock: true }
    ]
  },
  {
    id: 'prod-ammi-03',
    title: 'Ammi Express Wireless Multi-Speed Rechargeable Milk Frother & Whisk',
    slug: 'ammi-express-wireless-rechargeable-milk-frother',
    sku: 'AE-FROTH-03',
    headline: 'Cafe Quality Creamy Foam In 15 Seconds At Home.',
    badge: '☕ Archived Campaign',
    rating: 4.7,
    reviewCount: 219,
    shortDescription: 'Dual whisk heads for fluffy cappuccino foam, whipped eggs, matcha tea, and protein shakes with 3 adjustable speed gears.',
    regularPrice: 1850,
    salePrice: 1199,
    costPrice: 500,
    currency: 'Rs.',
    stockCount: 0,
    lowStockThreshold: 10,
    status: 'archived',
    createdAt: '2024-12-10T00:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=85'
    ],
    benefits: [
      {
        id: 'b3-1',
        productId: 'prod-ammi-03',
        text: 'Fast Delivery Across Pakistan',
        title: 'Fast Courier Delivery',
        description: 'TCS and Leopards cash on delivery tracking right to your doorstep.',
        icon: 'Zap',
        enabled: true,
        displayOrder: 1,
        createdAt: '2024-12-10T00:00:00.000Z',
        updatedAt: '2024-12-10T00:00:00.000Z'
      },
      {
        id: 'b3-2',
        productId: 'prod-ammi-03',
        text: 'Easy Installation & Snap-On Whisks',
        title: 'Easy Installation',
        description: 'Swap between balloon whisk and spiral spring frother in 2 seconds.',
        icon: 'Sparkles',
        enabled: true,
        displayOrder: 2,
        createdAt: '2024-12-10T00:00:00.000Z',
        updatedAt: '2024-12-10T00:00:00.000Z'
      }
    ],
    features: [
      { id: 'f3-1', icon: 'BatteryCharging', title: 'Rechargeable Lithium Battery', description: 'No expensive AA batteries required.' }
    ],
    detailedDescription: {
      intro: 'Make barista-style lattes and hot chocolate effortlessly.',
      bulletPoints: ['Double spring whisk head', 'USB rechargeable base', 'Stainless steel food-grade shaft'],
      highlightBox: 'Archived product campaign',
      sections: []
    },
    howItWorks: [],
    specifications: [
      { label: 'Motor Speed', value: '12,000 RPM' },
      { label: 'Charging', value: 'USB-C Cable Included' }
    ],
    variants: [
      { id: 'v3-1', name: 'Matte Black', inStock: false }
    ]
  }
];

export const defaultCategories: ProductCategory[] = [
  {
    id: 'cat-kitchen',
    name: 'Kitchen Gadgets',
    slug: 'kitchen-gadgets',
    description: 'Smart, wireless, and time-saving cooking accessories for everyday Pakistani households.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    order: 1,
    visible: true,
    productCount: 2
  },
  {
    id: 'cat-home',
    name: 'Home Accessories',
    slug: 'home-accessories',
    description: 'Comfortable, energy-saving, and modern essentials for your living spaces.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    order: 2,
    visible: true,
    productCount: 1
  },
  {
    id: 'cat-lifestyle',
    name: 'Lifestyle & Wellness',
    slug: 'lifestyle-wellness',
    description: 'Practical daily care, rechargeable wellness devices, and travel gadgets.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    order: 3,
    visible: true,
    productCount: 0
  }
];

export const defaultHomepageSections: HomepageSection[] = [
  {
    id: 'sec-hero',
    type: 'hero',
    title: 'Hero Showcase',
    subtitle: 'Flash Sale & Quick Order',
    description: 'Main visual highlight with instant buy-now CTA',
    order: 1,
    enabled: true,
    visible: true
  },
  {
    id: 'sec-categories',
    type: 'categories',
    title: 'Explore Categories',
    subtitle: 'Curated Kitchen & Home Collections',
    description: 'Browse top trending product categories',
    order: 2,
    enabled: true,
    visible: true
  },
  {
    id: 'sec-featured-product',
    type: 'featured_product',
    title: 'Kitchen Gadgets Spotlight',
    subtitle: '2025 Bestseller - 40% Limited Time Offer',
    description: 'Ammi Express Smart Multi-Function Wireless Food Processor & Chopper',
    categoryId: 'cat-kitchen',
    order: 3,
    enabled: true,
    visible: true
  },
  {
    id: 'sec-benefits',
    type: 'benefits',
    title: 'Why Pakistani Homes Love It',
    subtitle: 'Designed for Everyday Speed & Convenience',
    description: 'Key benefits and highlights for daily cooking prep',
    order: 4,
    enabled: true,
    visible: true
  },
  {
    id: 'sec-product-grid',
    type: 'product_grid',
    title: 'Trending & New Arrivals',
    subtitle: 'Customer Favorites Hand-picked for Quality',
    description: 'Top requested appliances and rechargeable kitchen gear',
    order: 5,
    enabled: true,
    visible: true
  },
  {
    id: 'sec-reviews',
    type: 'reviews',
    title: 'Customer Experiences & Feedback',
    subtitle: 'Over 380+ 5-Star Reviews from Verified Buyers Across Pakistan',
    description: 'Read what real homemakers in Karachi, Lahore, and Islamabad have to say',
    order: 6,
    enabled: true,
    visible: true
  },
  {
    id: 'sec-trust',
    type: 'trust',
    title: 'Our Nationwide Promise',
    subtitle: 'Safe Delivery, 7-Day Guarantee & Direct WhatsApp Support',
    description: 'Complete peace of mind with every order',
    order: 7,
    enabled: true,
    visible: true
  },
  {
    id: 'sec-delivery',
    type: 'delivery',
    title: 'Fast Nationwide Delivery',
    subtitle: 'Doorstep Courier Tracking via TCS, Leopards & Trax',
    description: 'Orders dispatched within 24 hours',
    order: 8,
    enabled: true,
    visible: true
  },
  {
    id: 'sec-order-form',
    type: 'order_form',
    title: 'Instant Cash on Delivery & JazzCash Checkout',
    subtitle: 'Fill your address details to confirm your order',
    description: 'No credit card required. Pay cash to the courier or scan JazzCash QR.',
    order: 9,
    enabled: true,
    visible: true
  },
  {
    id: 'sec-faqs',
    type: 'faqs',
    title: 'Frequently Asked Questions',
    subtitle: 'Everything You Need to Know Before Ordering',
    description: 'Answers about delivery times, checks, replacements, and JazzCash payment.',
    order: 10,
    enabled: true,
    visible: true
  }
];

export const defaultBanners: StoreBanner[] = [
  {
    id: 'ban-1',
    title: 'Ramadan & Eid Kitchen Mega Sale',
    subtitle: 'Save up to 40% on wireless choppers & blenders with free warranty',
    badge: 'Special Promo',
    discountText: 'FLAT 40% OFF',
    buttonText: 'Shop Sale Deals',
    buttonLink: '#order-form',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    order: 1,
    enabled: true
  },
  {
    id: 'ban-2',
    title: 'Instant JazzCash & Raast Payment Bonus',
    subtitle: 'Pay via JazzCash Till ID 984210573 for express priority packaging',
    badge: 'Express Dispatch',
    discountText: 'FREE VIP PACKING',
    buttonText: 'Pay With JazzCash',
    buttonLink: '#order-form',
    order: 2,
    enabled: true
  }
];

export const defaultSocialMediaLinks: SocialMediaLink[] = [
  {
    id: 'soc-fb',
    platform: 'facebook',
    name: 'Facebook',
    url: 'https://facebook.com/ammiexpress.pk',
    order: 1,
    enabled: true,
    showInHeader: true,
    showInFooter: true
  },
  {
    id: 'soc-ig',
    platform: 'instagram',
    name: 'Instagram',
    url: 'https://instagram.com/ammiexpress.pk',
    order: 2,
    enabled: true,
    showInHeader: true,
    showInFooter: true
  },
  {
    id: 'soc-tt',
    platform: 'tiktok',
    name: 'TikTok',
    url: 'https://tiktok.com/@ammiexpress.pk',
    order: 3,
    enabled: true,
    showInHeader: true,
    showInFooter: true
  },
  {
    id: 'soc-wa',
    platform: 'whatsapp',
    name: 'WhatsApp Channel',
    url: 'https://wa.me/923082494870',
    order: 4,
    enabled: true,
    showInHeader: true,
    showInFooter: true
  },
  {
    id: 'soc-yt',
    platform: 'youtube',
    name: 'YouTube',
    url: 'https://youtube.com/@ammiexpresspk',
    order: 5,
    enabled: true,
    showInHeader: false,
    showInFooter: true
  },
  {
    id: 'soc-pin',
    platform: 'pinterest',
    name: 'Pinterest',
    url: 'https://pinterest.com/ammiexpresspk',
    order: 6,
    enabled: false,
    showInHeader: false,
    showInFooter: true
  },
  {
    id: 'soc-tw',
    platform: 'twitter',
    name: 'Twitter / X',
    url: 'https://twitter.com/ammiexpresspk',
    order: 7,
    enabled: false,
    showInHeader: false,
    showInFooter: true
  }
];

export const defaultProductHandling: ProductHandlingContent = {
  productId: 'prod-ammi-01',
  sku: 'AE-CHOP-01',
  deepDiveBadge: 'Deep Dive',
  mainHeading: 'Designed for Authentic Pakistani Cooking',
  mainDescription: 'Engineered specifically for daily Pakistani cooking needs, the Ammi Express Smart Wireless Chopper transforms daily prep time with high-torque cyclone chopping.',
  buyerProtectionHeading: 'Ammi Express Buyer Protection',
  buyerProtectionDescription: '100% Checking Guarantee: Open and inspect your parcel before paying courier. 7 Days check & replacement guarantee with direct WhatsApp support.',
  benefitsHeading: 'What You Can Make In Seconds',
  benefits: [
    {
      id: 'phb-1',
      title: 'Tear-Free Onions & Instant Tadka Prep',
      description: 'Chop 4-6 onions uniformly in 6 seconds without a single tear or mess.',
      icon: 'Zap',
      enabled: true,
      displayOrder: 1
    },
    {
      id: 'phb-2',
      title: 'Fresh Ginger, Garlic & Green Chilli Paste',
      description: 'Create smooth aromatics for gravies and salan without burning hands.',
      icon: 'Sparkles',
      enabled: true,
      displayOrder: 2
    },
    {
      id: 'phb-3',
      title: 'Boneless Chicken Mince (Qeema) for Shami & Rolls',
      description: 'Grind tender boneless meat into fresh homemade qeema in under 10 seconds.',
      icon: 'CheckCircle2',
      enabled: true,
      displayOrder: 3
    },
    {
      id: 'phb-4',
      title: 'Mint & Coriander Chutney, Dips & Baby Purees',
      description: 'Blend fresh spicy chutneys and healthy baby food with zero hassle.',
      icon: 'Droplets',
      enabled: true,
      displayOrder: 4
    }
  ],
  storyHeading: 'Crafted for Real Pakistani Kitchens',
  storyDescription: 'Pakistani cuisine requires heavy daily prep — chopping mounds of onions, garlic, and chillies for every handi and biryani. Ammi Express was built to give every homemaker the power of instant prep without manual fatigue.',
  safetyHeading: 'Safety-Locked & Quality Tested',
  safetyDescription: 'Equipped with smart magnetic child-lock sensors. The 304 food-grade stainless steel blades only rotate when the safety lid is securely clicked into place.',
  guaranteeText: '7 Days Check & Replacement Guarantee with direct WhatsApp support.',
  deliveryText: 'Free Express 2-3 Day Delivery Across Pakistan (Cash on Delivery Available)',
  ctaText: 'Get Yours for Rs. 1,699 (Cash on Delivery)',
  customSections: [
    {
      id: 'cs-1',
      heading: 'One-Touch Rechargeable Freedom',
      description: 'No dangling cords or looking for kitchen wall sockets. Charge with any standard USB-C cable and enjoy up to 35+ chopping sessions on a single charge.',
      icon: 'BatteryCharging',
      enabled: true,
      displayOrder: 1
    }
  ],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  deletedAt: null
};

export const defaultProductHandlings: ProductHandlingContent[] = [
  defaultProductHandling
];


