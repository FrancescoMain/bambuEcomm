# Project Analysis - Cartoleria Bambù E-commerce Platform

## Overview
Cartoleria Bambù is a full-stack e-commerce platform for a stationery store based in Torre Annunziata, Italy. The project implements a modern web application with separate frontend and backend services.

## Technical Architecture

### Technology Stack

#### Frontend (Client)
- **Framework**: Next.js 15.3.3 with App Router
- **React Version**: React 19.0.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: 
  - Redux Toolkit (primary store)
  - Zustand (complementary state)
- **UI Components**: 
  - Heroicons React
  - React Icons
  - Framer Motion (animations)
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Charts**: Recharts
- **Notifications**: React Toastify

#### Backend (Server)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **File Upload**: Cloudinary integration
- **File Processing**: Multer, XLSX, CSV-parse
- **Payment**: Stripe integration
- **Email**: Resend service
- **Security**: CORS, express-validator
- **Utilities**: UUID, Streamifier

#### Development & Deployment
- **Package Manager**: npm
- **Deployment**: Vercel
- **Environment**: Node.js
- **Build Tools**: TypeScript compiler, Next.js build

## Project Structure

### Monorepo Layout
```
bambuEcomm/
├── client/                 # Next.js frontend application
│   ├── public/            # Static assets (images, icons)
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # Reusable React components
│   │   ├── api/           # Frontend API service layer
│   │   ├── redux/         # Redux store, slices, sagas
│   │   ├── store/         # Zustand stores
│   │   ├── hooks/         # Custom React hooks
│   │   └── pages/         # Legacy pages (if any)
│   ├── package.json       # Frontend dependencies
│   ├── next.config.ts     # Next.js configuration
│   ├── tailwind.config.ts # Tailwind CSS configuration
│   └── tsconfig.json      # TypeScript configuration
├── server/                # Express.js backend API
│   ├── src/
│   │   ├── routes/        # API route definitions
│   │   ├── controllers/   # Business logic handlers
│   │   ├── middleware/    # Authentication & validation
│   │   ├── services/      # Service layer (email, etc.)
│   │   ├── utils/         # Utility functions
│   │   └── server.ts      # Main server entry point
│   ├── prisma/            # Database schema and migrations
│   ├── uploads/           # File upload directory
│   ├── package.json       # Backend dependencies
│   └── tsconfig.json      # TypeScript configuration
└── vercel.json            # Deployment configuration
```

### Frontend Component Structure

#### Core Pages (`/client/src/app/`)
- `page.tsx` - Homepage with hero, categories, featured products
- `layout.tsx` - Root layout with global metadata
- `chi-siamo/page.tsx` - About page with company information
- `cart/page.tsx` - Shopping cart management
- `checkout/page.tsx` - Checkout process
- `product/[id]/page.tsx` - Dynamic product detail pages
- `search/page.tsx` - Product search and filtering
- `orders/page.tsx` - User order history
- `login/page.tsx` - User authentication
- `register/page.tsx` - User registration
- `dashboard/` - Admin dashboard pages

#### Component Library (`/client/src/components/`)
- `layout/` - Layout components (Header, Footer, Navigation)
- `ui/` - Reusable UI components
- `admin/` - Admin-specific components
- `seo/` - SEO optimization components
- `analytics/` - Analytics and tracking

#### API Layer (`/client/src/api/`)
- Service pattern implementation with interfaces
- Separate services for each domain (products, auth, cart, etc.)
- Centralized API configuration and error handling

### Backend API Structure

#### Routes (`/server/src/routes/`)
- `auth.routes.ts` - User authentication
- `product.routes.ts` - Product management
- `category.routes.ts` - Category hierarchy
- `cart.routes.ts` - Shopping cart operations
- `order.routes.ts` - Order processing
- `checkout.routes.ts` - Payment processing
- `dashboard.routes.ts` - Admin dashboard APIs
- `email.routes.ts` - Email notifications
- `notification.routes.ts` - User notifications
- `promotion.routes.ts` - Discount management
- `webhook.routes.ts` - External service webhooks

#### Database Schema (Prisma)
**Core Entities:**
- `User` - Customer and admin accounts
- `Product` - Product catalog with variants
- `Category` - Hierarchical product categories
- `Cart` & `CartItem` - Shopping cart management
- `Order` & `OrderItem` - Order processing
- `Address` - Shipping and billing addresses
- `Promotion` - Discount and promotion system
- `Notification` - User notification system

## Current Implementation Status

### Dynamic Features (Already Implemented)
✅ **Product Management**
- Product catalog with database storage
- Category hierarchy system
- Product search and filtering
- Product variants and stock management

✅ **User Management**
- User registration and authentication
- JWT-based session management
- Password reset functionality
- User profile management

✅ **E-commerce Core**
- Shopping cart functionality
- Order processing pipeline
- Payment integration (Stripe)
- Email notifications

✅ **Admin Dashboard**
- Product management interface
- Order management system
- Category administration
- Product import functionality

### Partially Dynamic Features
🔄 **Content Management**
- Categories loaded from database
- Product data fully dynamic
- Some UI text still hardcoded

🔄 **SEO & Metadata**
- Basic SEO structure in place
- Some metadata hardcoded
- Structured data partially implemented

### Static Content Areas (Requires Analysis)

#### 1. Company Information
**Location**: Multiple files
**Current Status**: Hardcoded in components
**Static Data Identified**:
- Business name: "Cartoleria Bambù"
- Address: "Corso Umberto I, 367 - 80058 Torre Annunziata (NA)"
- Phone: "081 1997 0664" / "+39 08119970664"
- Email: "cartoleriabambu@icloud.com"
- Founding year: "2016"
- Business hours (structured data)
- Geographic coordinates

**Files Containing Static Data**:
- `client/src/app/layout.tsx` - Global metadata
- `client/src/app/page.tsx` - Homepage structured data
- `client/src/app/chi-siamo/page.tsx` - About page
- `client/src/components/layout/Footer.tsx` - Footer contact info

#### 2. Social Media Links
**Location**: `client/src/app/page.tsx`
**Current Status**: Hardcoded URLs
**Static Data Identified**:
- Instagram: "https://www.instagram.com/cartoleriabambu?igsh=M3JneDV5czJ5Z2Rn&utm_source=qr"
- TikTok: "https://www.tiktok.com/@cartolibreria_bambu?_t=ZN-8xdxs9P6IAY&_r=1"
- WhatsApp: "https://wa.me/08119970664?text=..."

#### 3. SEO Metadata
**Location**: Multiple page components
**Current Status**: Hardcoded in each page
**Static Data Identified**:
- Page titles and descriptions
- Keywords
- OpenGraph metadata
- Twitter card data
- Canonical URLs

#### 4. Business Content
**Location**: `client/src/app/chi-siamo/page.tsx`
**Current Status**: Hardcoded content
**Static Data Identified**:
- Company story and history
- Values and mission statements
- Statistics (years of experience, customers, products, orders)
- Store images and descriptions

#### 5. Homepage Content
**Location**: `client/src/app/page.tsx`
**Current Status**: Mixed (some dynamic, some static)
**Static Data Identified**:
- Hero section text
- Section headings and descriptions
- Call-to-action button text
- Social media section content

## Dependencies Analysis

### Frontend Dependencies
**Core Framework**:
- Next.js 15.3.3 - Latest stable version with App Router
- React 19.0.0 - Latest React version
- TypeScript 5.x - Type safety

**State Management**:
- @reduxjs/toolkit 2.8.2 - Modern Redux
- react-redux 9.2.0 - React bindings
- redux-saga 1.3.0 - Side effect management
- zustand 5.0.5 - Lightweight state management

**UI & Styling**:
- tailwindcss 3.4.3 - Utility-first CSS
- @tailwindcss/forms 0.5.10 - Form styling
- @tailwindcss/container-queries 0.1.1 - Container queries
- @heroicons/react 2.2.0 - Icon library
- react-icons 5.5.0 - Additional icons
- framer-motion 12.19.1 - Animations

**API & Data**:
- axios 1.9.0 - HTTP client
- @prisma/client 6.8.2 - Database client
- date-fns 4.1.0 - Date utilities

**User Experience**:
- react-toastify 11.0.5 - Notifications
- recharts 3.0.2 - Charts and analytics

### Backend Dependencies
**Core Framework**:
- express 5.1.0 - Web framework
- @types/express 5.0.2 - TypeScript types
- cors 2.8.5 - Cross-origin requests
- dotenv 16.5.0 - Environment variables

**Database & ORM**:
- prisma 6.8.2 - Database toolkit
- @prisma/client 6.8.2 - Database client
- pg 8.16.0 - PostgreSQL client

**Authentication & Security**:
- jsonwebtoken 9.0.2 - JWT handling
- bcryptjs 3.0.2 - Password hashing
- express-validator 7.2.1 - Input validation

**File Handling**:
- multer 2.0.1 - File upload middleware
- cloudinary 2.7.0 - Cloud storage
- streamifier 0.1.1 - Stream utilities

**External Services**:
- stripe 18.2.1 - Payment processing
- resend 4.6.0 - Email service

**Data Processing**:
- csv-parse 5.6.0 - CSV parsing
- xlsx 0.18.5 - Excel file processing

**Development Tools**:
- nodemon 3.1.10 - Development server
- ts-node 10.9.2 - TypeScript execution
- typescript 5.8.3 - TypeScript compiler

## Build & Deployment Configuration

### Frontend Build Process
- **Development**: `npm run dev` with Turbopack
- **Production Build**: `npm run build` (Next.js optimization)
- **Production Server**: `npm run start`
- **Linting**: `npm run lint` (ESLint with Next.js config)

### Backend Build Process
- **Development**: `npm run dev` (nodemon with ts-node)
- **Production Build**: `npm run build` (TypeScript compilation)
- **Production Server**: `npm run start`
- **Vercel Build**: `npm run vercel-build` (includes Prisma generation)

### Deployment Strategy
- **Platform**: Vercel
- **Database**: Managed PostgreSQL
- **CDN**: Cloudinary for images
- **Environment**: Serverless functions

## Recommendations for Dynamic Content Management

### 1. Settings/Configuration System
**Proposed Solution**: Create a settings management system
**Implementation**:
- Add `Settings` model to Prisma schema
- Create admin interface for content management
- Implement caching strategy for frequently accessed settings

### 2. Content Management Structure
**Proposed Models**:
```prisma
model Setting {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String
  type        SettingType
  description String?
  category    String?
  updatedAt   DateTime @updatedAt
}

model Page {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  title       String
  content     Json
  metaTitle   String?
  metaDescription String?
  keywords    String?
  isActive    Boolean  @default(true)
  updatedAt   DateTime @updatedAt
}
```

### 3. API Integration Points
**New Routes Needed**:
- `/api/settings` - Settings management
- `/api/pages` - Page content management
- `/api/seo` - SEO metadata management

### 4. Frontend Integration Strategy
- Create React hooks for dynamic settings
- Implement context providers for global settings
- Add admin interfaces for content management
- Implement fallback mechanisms for static content

This analysis provides a comprehensive foundation for implementing dynamic content management while maintaining the existing functionality.