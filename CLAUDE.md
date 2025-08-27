# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a full-stack e-commerce application for **Cartoleria Bambù**, an Italian stationery store. The project is split into:

- `client/` - Next.js 15 frontend with TypeScript, Tailwind CSS, and Redux/Zustand state management
- `server/` - Express.js backend API with TypeScript, Prisma ORM, and PostgreSQL database

## Development Commands

### Frontend (client/)
```bash
cd client
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend (server/)
```bash
cd server
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript to dist/
npm start            # Start production server from dist/
npm run vercel-build # Build for Vercel deployment
```

### Database (Prisma)
```bash
cd server
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run database migrations
npx prisma studio      # Open Prisma Studio
```

## Key Architecture Details

### Database Schema
- **Users**: Authentication with role-based access (USER/ADMIN), password reset tokens
- **Products**: Italian e-commerce structure with variants, stock management, categories
- **Orders**: Support for both authenticated and guest checkout, tracking numbers, Italian address fields
- **Cart**: Session-based cart with selected product variants
- **Categories**: Hierarchical category structure with promotions
- **Notifications**: Admin and user notifications system

### State Management
- **Redux Toolkit** + **Redux Saga** for complex async flows (auth, categories)
- **Zustand** for simpler state (auth store)
- **Context API** for cart, loading, and notifications

### API Architecture
The server follows RESTful conventions with organized route modules:
- Controllers handle business logic
- Routes define endpoints and middleware
- Services contain reusable business functions
- Prisma handles database operations

### Authentication
- JWT-based authentication
- Role-based access control (USER/ADMIN)
- Password reset functionality with tokens

### File Uploads
- Cloudinary integration for image management
- Multer for handling multipart uploads
- Product import from CSV/Excel files

### Payment Processing
- Stripe integration for checkout
- Support for guest and authenticated users
- Italian address format support

### Deployment
- **Frontend**: Deployed on Vercel with Next.js
- **Backend**: Serverless functions on Vercel with Express.js
- **Database**: PostgreSQL (likely Supabase based on connection strings)
- **Cron Jobs**: Automated cart cleanup at 3 AM daily

## Italian Localization
The application is localized for Italian market:
- Content and UI in Italian language
- Italian address fields (via, città, cap, stato, etc.)
- Italian business context (cartoleria = stationery store)
- Euro pricing with Decimal precision

## Key Dependencies
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Redux Toolkit, Framer Motion
- **Backend**: Express, Prisma, TypeScript, bcryptjs, JWT, Stripe, Cloudinary, Resend (email)
- **Database**: PostgreSQL with Prisma ORM

## Development Notes
- The project uses TypeScript throughout
- ESLint is configured for code quality
- Turbopack is enabled for faster development builds
- The codebase follows modular architecture patterns
- Both monorepo-style structure with separate package.json files