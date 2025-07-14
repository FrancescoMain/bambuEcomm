# Data Structure Mapping - Static vs Dynamic Content

## Overview
This document maps the current static data in the Cartoleria Bambù platform and proposes dynamic alternatives for better content management.

## Current Data Classification

### ✅ Already Dynamic (Database-Driven)

#### Product Data
- **Source**: Database (Prisma Product model)
- **Management**: Admin dashboard
- **API Endpoints**: `/api/product/*`
- **Components**: ProductCard, ProductDetail, Search
- **Data Fields**:
  - `id`, `titolo`, `descrizione`, `prezzo`, `immagine`, `stock`
  - Related: Categories, Variants, Promotions

#### Category Hierarchy
- **Source**: Database (Prisma Category model)
- **Management**: Admin dashboard
- **API Endpoints**: `/api/category/*`
- **Components**: Navigation, CategoryFilter, Homepage categories
- **Data Fields**:
  - `id`, `name`, `description`, `parentId`, `children`

#### User Management
- **Source**: Database (Prisma User model)
- **Management**: Authentication system
- **API Endpoints**: `/api/auth/*`
- **Components**: Login, Register, Profile
- **Data Fields**:
  - `id`, `email`, `name`, `role`, `addresses`

#### E-commerce Data
- **Source**: Database (Cart, Order, OrderItem models)
- **Management**: Automated through user actions
- **API Endpoints**: `/api/cart/*`, `/api/order/*`
- **Components**: Cart, Checkout, OrderHistory

---

### ❌ Currently Static (Hardcoded)

## 1. Company Information

### Business Details
**Current Location**: Multiple files
**Current Implementation**: Hardcoded strings
**Proposed Solution**: Settings-based dynamic system

| Data Field | Current Value | Current Files | Proposed Key |
|------------|---------------|---------------|--------------|
| Business Name | "Cartoleria Bambù" | layout.tsx, page.tsx, Footer.tsx | `company.name` |
| Legal Name | "Cartoleria Bambù" | SEO metadata | `company.legal_name` |
| Tagline | "La tua cartoleria di fiducia" | Multiple | `company.tagline` |
| Founded Year | "2016" | page.tsx (structured data) | `company.founded_year` |

### Contact Information
| Data Field | Current Value | Current Files | Proposed Key |
|------------|---------------|---------------|--------------|
| Street Address | "Corso Umberto I, 367" | layout.tsx, page.tsx, chi-siamo/page.tsx | `contact.street_address` |
| City | "Torre Annunziata" | Multiple files | `contact.city` |
| Province | "NA" / "Campania" | Multiple files | `contact.province` |
| Postal Code | "80058" | Multiple files | `contact.postal_code` |
| Country | "IT" / "Italia" | Multiple files | `contact.country` |
| Phone | "081 1997 0664" / "+39 08119970664" | Multiple files | `contact.phone` |
| Email | "cartoleriabambu@icloud.com" | page.tsx | `contact.email` |

### Geographic Data
| Data Field | Current Value | Current Files | Proposed Key |
|------------|---------------|---------------|--------------|
| Latitude | "40.7473" | page.tsx (structured data) | `location.latitude` |
| Longitude | "14.4501" | page.tsx (structured data) | `location.longitude` |

## 2. Social Media Links

**Current Location**: `client/src/app/page.tsx`
**Current Implementation**: Hardcoded URLs in component

| Platform | Current URL | Proposed Key |
|----------|-------------|--------------|
| Instagram | `https://www.instagram.com/cartoleriabambu?igsh=M3JneDV5czJ5Z2Rn&utm_source=qr` | `social.instagram_url` |
| TikTok | `https://www.tiktok.com/@cartolibreria_bambu?_t=ZN-8xdxs9P6IAY&_r=1` | `social.tiktok_url` |
| WhatsApp | `https://wa.me/08119970664?text=Ciao!%20Vorrei%20informazioni%20sui%20vostri%20prodotti` | `social.whatsapp_url` |

**Additional Social Data**:
| Data Field | Current Value | Proposed Key |
|------------|---------------|--------------|
| Instagram Handle | "@cartoleriabambu" | `social.instagram_handle` |
| TikTok Handle | "@cartolibreria_bambu" | `social.tiktok_handle` |
| WhatsApp Number | "08119970664" | `social.whatsapp_number` |

## 3. Business Hours

**Current Location**: `client/src/app/page.tsx` (structured data)
**Current Implementation**: Hardcoded in structured data object

```json
{
  "openingHoursSpecification": [
    {
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "07:15",
      "closes": "13:30"
    },
    {
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "16:30",
      "closes": "20:30"
    },
    {
      "dayOfWeek": "Saturday",
      "opens": "07:30",
      "closes": "13:30"
    },
    {
      "dayOfWeek": "Sunday",
      "opens": "08:30",
      "closes": "13:30"
    }
  ]
}
```

**Proposed Dynamic Structure**:
```json
{
  "business_hours": {
    "monday": {"morning": "07:15-13:30", "afternoon": "16:30-20:30"},
    "tuesday": {"morning": "07:15-13:30", "afternoon": "16:30-20:30"},
    "wednesday": {"morning": "07:15-13:30", "afternoon": "16:30-20:30"},
    "thursday": {"morning": "07:15-13:30", "afternoon": "16:30-20:30"},
    "friday": {"morning": "07:15-13:30", "afternoon": "16:30-20:30"},
    "saturday": {"morning": "07:30-13:30", "afternoon": null},
    "sunday": {"morning": "08:30-13:30", "afternoon": null}
  }
}
```

## 4. SEO Metadata

### Global SEO Settings
**Current Location**: `client/src/app/layout.tsx`
**Current Implementation**: Hardcoded metadata object

| Field | Current Value | Proposed Key |
|-------|---------------|--------------|
| Site Title | "Cartoleria Bambù \| Cancelleria Torre Annunziata \| Quaderni Penne Online" | `seo.site_title` |
| Site Description | "Cartoleria Bambù a Torre Annunziata dal 2016..." | `seo.site_description` |
| Keywords | "cartoleria Torre Annunziata, cancelleria online..." | `seo.keywords` |
| Site Name | "Cartoleria Bambù" | `seo.site_name` |
| OpenGraph Title | "Cartoleria Bambù \| La tua cartoleria di fiducia..." | `seo.og_title` |
| OpenGraph Description | "Dal 2016 la migliore cartoleria di Torre Annunziata..." | `seo.og_description` |
| OpenGraph Image | "https://www.xn--cartoleriabamb-jrb.com/bambu-logo.jpg" | `seo.og_image` |

### Page-Specific SEO
**Current Location**: Individual page components
**Current Implementation**: Hardcoded metadata exports

#### Chi Siamo Page
| Field | Current Value | Proposed Structure |
|-------|---------------|------------------|
| Title | "Chi Siamo \| Cartoleria Bambù Torre Annunziata" | `pages.chi_siamo.title` |
| Description | "Scopri la storia di Cartoleria Bambù..." | `pages.chi_siamo.description` |
| Keywords | "cartoleria Torre Annunziata, storia cartoleria bambù..." | `pages.chi_siamo.keywords` |

## 5. Content Sections

### Homepage Content
**Current Location**: `client/src/app/page.tsx`
**Current Implementation**: Hardcoded JSX content

#### Hero Section
| Element | Current Value | Proposed Key |
|---------|---------------|--------------|
| Main Title | "Cartoleria Bambù Torre Annunziata" | `homepage.hero.title` |
| Subtitle | "Dal 2016 la tua cartoleria di fiducia a Torre Annunziata..." | `homepage.hero.subtitle` |
| Search Placeholder | "Cosa stai cercando?" | `homepage.hero.search_placeholder` |
| CTA Primary | "Esplora Prodotti" | `homepage.hero.cta_primary` |
| CTA Secondary | "Chi Siamo" | `homepage.hero.cta_secondary` |

#### Categories Section
| Element | Current Value | Proposed Key |
|---------|---------------|--------------|
| Section Title | "Esplora le Categorie" | `homepage.categories.title` |
| Section Subtitle | "Trova quello che cerchi nelle nostre categorie principali" | `homepage.categories.subtitle` |

#### Featured Products Section
| Element | Current Value | Proposed Key |
|---------|---------------|--------------|
| Section Title | "Prodotti in Evidenza" | `homepage.featured.title` |
| Section Subtitle | "I nostri prodotti più popolari selezionati per te" | `homepage.featured.subtitle` |
| View All Button | "Vedi Tutti →" | `homepage.featured.view_all_text` |

#### Social Media Section
| Element | Current Value | Proposed Key |
|---------|---------------|--------------|
| Section Title | "Seguici sui Social" | `homepage.social.title` |
| Section Subtitle | "Resta connesso con noi e scopri le ultime novità..." | `homepage.social.subtitle` |
| Instagram Label | "Instagram" | `homepage.social.instagram_label` |
| Instagram Description | "Foto, storie e novità quotidiane" | `homepage.social.instagram_description` |
| TikTok Label | "TikTok" | `homepage.social.tiktok_label` |
| TikTok Description | "Video creativi e tutorial" | `homepage.social.tiktok_description` |
| WhatsApp Label | "WhatsApp" | `homepage.social.whatsapp_label` |
| WhatsApp Description | "Assistenza diretta" | `homepage.social.whatsapp_description` |
| WhatsApp CTA | "Contattaci su WhatsApp" | `homepage.social.whatsapp_cta` |
| WhatsApp Helper | "Rispondiamo in pochi minuti durante gli orari di apertura" | `homepage.social.whatsapp_helper` |

### About Page Content
**Current Location**: `client/src/app/chi-siamo/page.tsx`
**Current Implementation**: Hardcoded content components

#### Statistics
| Statistic | Current Value | Proposed Key |
|-----------|---------------|--------------|
| Years Experience | "6+" | `about.stats.years_experience` |
| Satisfied Customers | "8K+" | `about.stats.customers` |
| Products in Catalog | "2.5K+" | `about.stats.products` |
| Orders Delivered | "15K+" | `about.stats.orders` |

#### Company Values
| Value | Current Title | Current Description | Proposed Keys |
|-------|---------------|-------------------|---------------|
| Quality | "Qualità Garantita" | "Selezioniamo solo i migliori prodotti..." | `about.values.quality.title`, `about.values.quality.description` |
| Passion | "Passione" | "La passione per la cartoleria e l'arte..." | `about.values.passion.title`, `about.values.passion.description` |
| Reliability | "Affidabilità" | "Un servizio clienti dedicato..." | `about.values.reliability.title`, `about.values.reliability.description` |
| Fast Delivery | "Consegna Veloce" | "Spedizioni rapide e sicure..." | `about.values.delivery.title`, `about.values.delivery.description` |

## 6. Footer Content

**Current Location**: `client/src/components/layout/Footer.tsx`
**Current Implementation**: Hardcoded content with some dynamic categories

| Element | Current Value | Proposed Key |
|---------|---------------|--------------|
| Company Description | "La tua libreria online di fiducia..." | `footer.company_description` |
| Copyright | "© 2025 Cartoleria Bambù. Tutti i diritti riservati." | `footer.copyright` |
| Privacy Policy Link | "Privacy Policy" | `footer.privacy_policy_text` |
| Terms of Service Link | "Termini di Servizio" | `footer.terms_text` |

---

## Proposed Database Schema

### Settings Table
```prisma
model Setting {
  id          Int         @id @default(autoincrement())
  key         String      @unique
  value       String      @db.Text
  type        SettingType @default(TEXT)
  category    String?
  description String?
  isPublic    Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum SettingType {
  TEXT
  NUMBER
  BOOLEAN
  JSON
  URL
  EMAIL
  PHONE
}
```

### Pages Table (for complex content)
```prisma
model Page {
  id              Int      @id @default(autoincrement())
  slug            String   @unique
  title           String
  content         Json?
  metaTitle       String?
  metaDescription String?
  metaKeywords    String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Initial Settings Data
```sql
-- Company Information
INSERT INTO "Setting" (key, value, type, category, description) VALUES
('company.name', 'Cartoleria Bambù', 'TEXT', 'company', 'Nome dell''azienda'),
('company.legal_name', 'Cartoleria Bambù', 'TEXT', 'company', 'Ragione sociale'),
('company.tagline', 'La tua cartoleria di fiducia', 'TEXT', 'company', 'Slogan aziendale'),
('company.founded_year', '2016', 'NUMBER', 'company', 'Anno di fondazione'),

-- Contact Information
('contact.street_address', 'Corso Umberto I, 367', 'TEXT', 'contact', 'Indirizzo'),
('contact.city', 'Torre Annunziata', 'TEXT', 'contact', 'Città'),
('contact.province', 'NA', 'TEXT', 'contact', 'Provincia'),
('contact.postal_code', '80058', 'TEXT', 'contact', 'CAP'),
('contact.country', 'Italia', 'TEXT', 'contact', 'Paese'),
('contact.phone', '081 1997 0664', 'PHONE', 'contact', 'Telefono'),
('contact.email', 'cartoleriabambu@icloud.com', 'EMAIL', 'contact', 'Email'),

-- Social Media
('social.instagram_url', 'https://www.instagram.com/cartoleriabambu', 'URL', 'social', 'Link Instagram'),
('social.tiktok_url', 'https://www.tiktok.com/@cartolibreria_bambu', 'URL', 'social', 'Link TikTok'),
('social.whatsapp_number', '08119970664', 'PHONE', 'social', 'Numero WhatsApp'),

-- SEO
('seo.site_title', 'Cartoleria Bambù | Cancelleria Torre Annunziata | Quaderni Penne Online', 'TEXT', 'seo', 'Titolo del sito'),
('seo.site_description', 'Cartoleria Bambù a Torre Annunziata dal 2016. Quaderni, penne, cancelleria online. Consegna rapida in Campania. ⭐ La tua cartoleria di fiducia.', 'TEXT', 'seo', 'Descrizione del sito');
```

## Implementation Priority

### Phase 1: Core Settings (High Priority)
- Company information
- Contact details
- Social media links
- Basic SEO metadata

### Phase 2: Content Management (Medium Priority)
- Homepage content sections
- About page content
- Footer content

### Phase 3: Advanced Features (Low Priority)
- Business hours management
- Page-specific SEO
- Complex content blocks
- Multi-language support

## Integration Strategy

### Frontend Changes Required
1. Create settings context/hook for accessing dynamic content
2. Replace hardcoded values with dynamic content calls
3. Add fallback mechanisms for missing settings
4. Implement caching for frequently accessed settings

### Backend Changes Required
1. Add Settings model to Prisma schema
2. Create settings API endpoints
3. Implement admin interface for settings management
4. Add validation and type checking for setting values

### Admin Interface
1. Settings management dashboard
2. Content editor for complex content
3. SEO preview functionality
4. Cache management tools

This mapping provides a comprehensive foundation for transitioning from static to dynamic content management while maintaining system performance and reliability.