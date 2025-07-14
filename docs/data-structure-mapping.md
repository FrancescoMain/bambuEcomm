# Data Structure Mapping - Static vs Dynamic

## Overview

This document provides a comprehensive mapping of data structures in the bambuEcomm project, categorizing content as **Static** (hardcoded) vs **Dynamic** (database-driven), and identifying opportunities for converting static data to dynamic management.

## Current Dynamic Data Structures

### ✅ Fully Dynamic - Database Driven

#### 1. **Product Data**
```typescript
// Database Model (Prisma)
model Product {
  id          Int                  @id @default(autoincrement())
  titolo      String              // Product title
  descrizione String?             // Product description
  immagine    String?             // Product image URL
  prezzo      Decimal             // Product price
  stock       Int                 // Inventory count
  categoria   Category[]          // Product categories (many-to-many)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}
```
**Status:** ✅ Fully implemented with CRUD operations
**API Endpoints:** `/api/products/*`
**Frontend Integration:** Redux state management

#### 2. **Category Data**
```typescript
model Category {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  products Product[] @relation("ProductCategories")
}
```
**Status:** ✅ Fully implemented
**API Endpoints:** `/api/categories/*`
**Frontend Integration:** Redux selectors, dynamic navigation

#### 3. **User Management**
```typescript
model User {
  id            Int                  @id @default(autoincrement())
  email         String               @unique
  password      String
  name          String?
  role          Role                 @default(USER)
  addresses     Address[]
  cart          Cart?
  orders        Order[]
}
```
**Status:** ✅ Complete authentication system
**API Endpoints:** `/api/auth/*`

#### 4. **Shopping Cart**
```typescript
model Cart {
  id     Int        @id @default(autoincrement())
  userId Int        @unique
  user   User       @relation(fields: [userId], references: [id])
  items  CartItem[]
}

model CartItem {
  id        Int     @id @default(autoincrement())
  cartId    Int
  productId Int
  quantity  Int
  cart      Cart    @relation(fields: [cartId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
}
```
**Status:** ✅ Real-time cart management
**API Endpoints:** `/api/cart/*`

#### 5. **Order Management**
```typescript
model Order {
  id          Int         @id @default(autoincrement())
  userId      Int
  status      OrderStatus @default(PENDING)
  total       Decimal
  items       OrderItem[]
  user        User        @relation(fields: [userId], references: [id])
  createdAt   DateTime    @default(now())
}
```
**Status:** ✅ Complete order lifecycle
**API Endpoints:** `/api/orders/*`

## Static Data Areas (Hardcoded Content)

### 🔴 Static - Needs Dynamic Implementation

#### 1. **Business Information**
**Location:** `/client/src/app/page.tsx` (Lines 20-73)

```typescript
// Currently hardcoded structured data
const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Cartoleria Bambù",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Corso Umberto I, 367",
    addressLocality: "Torre Annunziata",
    postalCode: "80058"
  },
  telephone: "+39 08119970664",
  email: "cartoleriabambu@icloud.com",
  foundingDate: "2016",
  // ... opening hours, etc.
}
```

**Recommendation:** Create `BusinessSettings` model
```typescript
model BusinessSettings {
  id              Int     @id @default(autoincrement())
  name            String
  streetAddress   String
  city            String
  postalCode      String
  phone           String
  email           String
  foundingYear    String
  openingHours    Json    // Store opening hours as JSON
  socialMedia     Json    // Store social links as JSON
  updatedAt       DateTime @updatedAt
}
```

#### 2. **Hero Section Content**
**Location:** `/client/src/app/page.tsx` (Lines 254-261)

```typescript
// Currently hardcoded
<h1 className="text-4xl lg:text-6xl font-bold leading-tight">
  Cartoleria Bambù{" "}
  <span className="text-yellow-300">Torre Annunziata</span>
</h1>
<p className="text-xl lg:text-2xl text-gray-100">
  Dal 2016 la tua cartoleria di fiducia a Torre Annunziata.
  Quaderni, penne, cancelleria e materiale scolastico online.
</p>
```

**Recommendation:** Create `HeroContent` model
```typescript
model HeroContent {
  id              Int     @id @default(autoincrement())
  title           String
  subtitle        String
  description     String
  ctaButtonText   String
  backgroundImage String?
  isActive        Boolean @default(true)
  updatedAt       DateTime @updatedAt
}
```

#### 3. **Social Media Links**
**Location:** `/client/src/app/page.tsx` (Lines 494-563)

```typescript
// Currently hardcoded social links
const socialLinks = [
  {
    href: "https://www.instagram.com/cartoleriabambu?igsh=M3JneDV5czJ5Z2Rn&utm_source=qr",
    platform: "Instagram"
  },
  {
    href: "https://www.tiktok.com/@cartolibreria_bambu?_t=ZN-8xdxs9P6IAY&_r=1",
    platform: "TikTok"
  }
  // ...
];
```

**Recommendation:** Create `SocialMedia` model
```typescript
model SocialMedia {
  id          Int     @id @default(autoincrement())
  platform    String  // Instagram, TikTok, WhatsApp, etc.
  url         String
  icon        String  // Icon identifier
  description String?
  isActive    Boolean @default(true)
  sortOrder   Int     @default(0)
}
```

#### 4. **About Us Content**
**Location:** `/client/src/app/chi-siamo/page.tsx` (Lines 37-86)

```typescript
// Static values and stats
const stats = [
  { label: "Anni di Esperienza", value: "6+" },
  { label: "Clienti Soddisfatti", value: "8K+" },
  { label: "Prodotti in Catalogo", value: "2.5K+" },
  { label: "Ordini Consegnati", value: "15K+" },
];

const values = [
  {
    title: "Qualità Garantita",
    description: "Selezioniamo solo i migliori prodotti per ufficio, scuola e creatività."
  }
  // ...
];
```

**Recommendation:** Create `AboutContent` model
```typescript
model AboutContent {
  id          Int     @id @default(autoincrement())
  sectionType String  // 'stats', 'values', 'story', etc.
  title       String
  description String?
  value       String? // For stats
  icon        String?
  sortOrder   Int     @default(0)
  isActive    Boolean @default(true)
}
```

#### 5. **Footer Content**
**Location:** `/client/src/components/layout/Footer.tsx` (Lines 35-48)

```typescript
// Static footer content
<p className="text-green-100 mb-6 leading-relaxed">
  La tua libreria online di fiducia. Scopri un mondo di cultura,
  creatività e apprendimento.
</p>
<div className="space-y-2 text-sm text-green-100">
  <div className="flex items-center gap-2">
    <span>📍</span>
    <span>Corso Umberto I, 367 - 80058 Torre Annunziata (NA)</span>
  </div>
  <div className="flex items-center gap-2">
    <span>📞</span>
    <span>081 1997 0664</span>
  </div>
</div>
```

**Recommendation:** Reuse `BusinessSettings` model for footer data

### 🟡 Semi-Dynamic - Partially Configurable

#### 1. **Category Icons and Colors**
**Location:** `/client/src/app/page.tsx` (Lines 179-227)

```typescript
// Currently hardcoded but could be made dynamic
const getCategoryIcon = (categoryName: string) => {
  if (categoryName.toLowerCase().includes("quadern")) {
    return <svg>...</svg>; // Hardcoded SVG
  }
  // ...
};

const getCategoryColor = (index: number) => {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    // ...
  ];
  return colors[index % colors.length];
};
```

**Current Status:** Categories are dynamic but styling is static
**Recommendation:** Extend `Category` model
```typescript
model Category {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  icon        String?   // Icon identifier or SVG
  colorFrom   String?   // Gradient start color
  colorTo     String?   // Gradient end color
  products    Product[] @relation("ProductCategories")
}
```

#### 2. **SEO Meta Data**
**Location:** Various page components

```typescript
// Static metadata in each page
export const metadata: Metadata = {
  title: "Chi Siamo | Cartoleria Bambù Torre Annunziata",
  description: "Scopri la storia di Cartoleria Bambù...",
  keywords: "cartoleria Torre Annunziata, storia cartoleria bambù..."
};
```

**Recommendation:** Create `SEOSettings` model
```typescript
model SEOSettings {
  id          Int     @id @default(autoincrement())
  page        String  @unique // 'home', 'about', 'products', etc.
  title       String
  description String
  keywords    String?
  ogImage     String?
  canonical   String?
}
```

## Proposed Dynamic Data Models

### New Models for Content Management

#### 1. **Settings Model** (Global Configuration)
```typescript
model Settings {
  id        Int     @id @default(autoincrement())
  key       String  @unique // 'site_name', 'contact_email', etc.
  value     String
  type      String  // 'text', 'json', 'boolean', 'number'
  category  String  // 'business', 'seo', 'social', etc.
  updatedAt DateTime @updatedAt
}
```

#### 2. **Page Content Model** (Dynamic Page Content)
```typescript
model PageContent {
  id          Int     @id @default(autoincrement())
  page        String  // 'home', 'about', 'contact'
  section     String  // 'hero', 'features', 'stats'
  contentType String  // 'text', 'image', 'json'
  content     Json    // Flexible content storage
  isActive    Boolean @default(true)
  sortOrder   Int     @default(0)
  updatedAt   DateTime @updatedAt
}
```

#### 3. **Media Library Model**
```typescript
model MediaAsset {
  id          Int     @id @default(autoincrement())
  filename    String
  originalName String
  mimeType    String
  size        Int
  url         String
  cloudinaryId String?
  alt         String?
  caption     String?
  tags        String[]
  uploadedAt  DateTime @default(now())
}
```

## Implementation Priority Matrix

### High Priority (Immediate Impact)
1. **Business Settings** - Contact info, hours, location
2. **Social Media Links** - Easy to manage and update
3. **Hero Content** - High visibility marketing content

### Medium Priority (Operational Efficiency)
1. **About Us Content** - Company story and values
2. **SEO Settings** - Search engine optimization
3. **Footer Content** - Site-wide information

### Low Priority (Future Enhancement)
1. **Media Library** - Advanced asset management
2. **Advanced Analytics** - Dynamic dashboard content
3. **Multi-language Content** - International expansion

## API Endpoints to Implement

### Settings Management
```
GET    /api/settings              # Get all settings
GET    /api/settings/:key         # Get specific setting
PUT    /api/settings/:key         # Update setting
POST   /api/settings              # Create new setting
```

### Content Management
```
GET    /api/content/:page         # Get page content
PUT    /api/content/:page/:section # Update section content
POST   /api/content               # Create new content section
DELETE /api/content/:id           # Delete content section
```

### Social Media Management
```
GET    /api/social-media          # Get all social links
POST   /api/social-media          # Create new social link
PUT    /api/social-media/:id      # Update social link
DELETE /api/social-media/:id      # Delete social link
```

## Frontend Integration Strategy

### 1. **Context Providers**
```typescript
// Settings Context
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  // Load settings from API
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};
```

### 2. **Custom Hooks**
```typescript
export const useBusinessSettings = () => {
  const { data, error, loading } = useSWR('/api/settings?category=business');
  return { businessSettings: data, error, loading };
};

export const useHeroContent = () => {
  const { data, error, loading } = useSWR('/api/content/home/hero');
  return { heroContent: data, error, loading };
};
```

### 3. **Admin Interface Components**
```typescript
// Settings management component
const SettingsEditor = ({ category }) => {
  // CRUD operations for settings
};

// Content editor component
const ContentEditor = ({ page, section }) => {
  // Rich text editor for content management
};
```

## Data Migration Strategy

### Phase 1: Extract Static Data
1. Identify all hardcoded content
2. Create data extraction scripts
3. Populate database with current static values

### Phase 2: API Implementation
1. Create new database models
2. Implement API endpoints
3. Add admin interfaces for content management

### Phase 3: Frontend Integration
1. Replace hardcoded content with API calls
2. Implement caching strategies
3. Add loading states and error handling

### Phase 4: Testing and Optimization
1. Test dynamic content loading
2. Optimize performance
3. Add content versioning if needed

## Conclusion

The current bambuEcomm project has excellent dynamic data implementation for core e-commerce functionality. The identified static content areas represent opportunities to enhance content management capabilities and provide business users with greater control over site content without requiring developer intervention.

The proposed models and implementation strategy would transform the platform from a developer-managed site to a fully self-service content management system while maintaining the existing robust e-commerce functionality.