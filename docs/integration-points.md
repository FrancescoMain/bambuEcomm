# Integration Points Analysis - API Integration for Dynamic Content

## Overview
This document identifies the specific integration points where API calls should be implemented to replace static content with dynamic content management capabilities.

## Current API Infrastructure

### Existing API Endpoints
The platform already has a robust API structure in place:

```
/api/auth/*          - Authentication and user management
/api/product/*       - Product catalog management
/api/category/*      - Category hierarchy management
/api/cart/*          - Shopping cart operations
/api/order/*         - Order processing and management
/api/checkout/*      - Payment processing
/api/dashboard/*     - Admin dashboard operations
/api/email/*         - Email notification services
/api/notification/*  - User notification system
/api/promotion/*     - Discount and promotion management
/api/webhook/*       - External service webhooks
```

### API Architecture Patterns
- **Service Layer**: Well-structured service pattern in frontend (`/client/src/api/`)
- **Interface-Based**: TypeScript interfaces for API contracts
- **Error Handling**: Centralized error handling with Axios
- **Authentication**: JWT-based authentication system
- **Validation**: Express-validator for input validation

---

## Required New API Endpoints

### 1. Settings Management API

#### Endpoint Structure
```
/api/settings/
├── GET    /           - Get all public settings
├── GET    /:key       - Get specific setting by key
├── GET    /category/:category - Get settings by category
├── POST   /           - Create new setting (admin only)
├── PUT    /:key       - Update setting by key (admin only)
├── DELETE /:key       - Delete setting by key (admin only)
```

#### Backend Implementation Required

**Route Definition** (`/server/src/routes/settings.routes.ts`):
```typescript
import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', SettingsController.getPublicSettings);
router.get('/:key', SettingsController.getSettingByKey);
router.get('/category/:category', SettingsController.getSettingsByCategory);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, SettingsController.createSetting);
router.put('/:key', authMiddleware, adminMiddleware, SettingsController.updateSetting);
router.delete('/:key', authMiddleware, adminMiddleware, SettingsController.deleteSetting);

export default router;
```

**Controller Implementation** (`/server/src/controllers/settings.controller.ts`):
```typescript
import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';

export class SettingsController {
  static async getPublicSettings(req: Request, res: Response) {
    // Get all public settings with caching
  }

  static async getSettingByKey(req: Request, res: Response) {
    // Get specific setting by key
  }

  static async getSettingsByCategory(req: Request, res: Response) {
    // Get settings filtered by category
  }

  static async createSetting(req: Request, res: Response) {
    // Create new setting (admin only)
  }

  static async updateSetting(req: Request, res: Response) {
    // Update existing setting (admin only)
  }

  static async deleteSetting(req: Request, res: Response) {
    // Delete setting (admin only)
  }
}
```

**Service Layer** (`/server/src/services/settings.service.ts`):
```typescript
import { prisma } from '../utils/prisma';
import { Setting, SettingType } from '@prisma/client';

export class SettingsService {
  static async getPublicSettings(): Promise<Setting[]> {
    return await prisma.setting.findMany({
      where: { isPublic: true },
      orderBy: { category: 'asc' }
    });
  }

  static async getSettingByKey(key: string): Promise<Setting | null> {
    return await prisma.setting.findUnique({
      where: { key }
    });
  }

  // Additional service methods...
}
```

#### Frontend Integration Required

**API Service** (`/client/src/api/settingsService.ts`):
```typescript
import { IApiService } from './interfaces';
import apiService from './apiService';

export interface ISetting {
  id: number;
  key: string;
  value: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'URL' | 'EMAIL' | 'PHONE';
  category?: string;
  description?: string;
}

export interface ISettingsService {
  getPublicSettings(): Promise<ISetting[]>;
  getSettingByKey(key: string): Promise<ISetting>;
  getSettingsByCategory(category: string): Promise<ISetting[]>;
  updateSetting(key: string, value: string): Promise<ISetting>;
}

class SettingsService implements ISettingsService {
  async getPublicSettings(): Promise<ISetting[]> {
    return await apiService.get<ISetting[]>('/settings');
  }

  async getSettingByKey(key: string): Promise<ISetting> {
    return await apiService.get<ISetting>(`/settings/${key}`);
  }

  async getSettingsByCategory(category: string): Promise<ISetting[]> {
    return await apiService.get<ISetting[]>(`/settings/category/${category}`);
  }

  async updateSetting(key: string, value: string): Promise<ISetting> {
    return await apiService.put<ISetting>(`/settings/${key}`, { value });
  }
}

export default new SettingsService();
```

### 2. Page Content Management API

#### Endpoint Structure
```
/api/pages/
├── GET    /           - Get all pages
├── GET    /:slug      - Get page by slug
├── POST   /           - Create new page (admin only)
├── PUT    /:slug      - Update page content (admin only)
├── DELETE /:slug      - Delete page (admin only)
```

#### Implementation Required
Similar structure to settings API but for complex page content management.

---

## Frontend Integration Points

### 1. Global Settings Context

**Context Provider** (`/client/src/contexts/SettingsContext.tsx`):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import settingsService, { ISetting } from '../api/settingsService';

interface SettingsContextType {
  settings: Record<string, string>;
  getSetting: (key: string, defaultValue?: string) => string;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsData = await settingsService.getPublicSettings();
      const settingsMap = settingsData.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
      setSettings(settingsMap);
      setError(null);
    } catch (err) {
      setError('Failed to load settings');
      console.error('Settings loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const getSetting = (key: string, defaultValue: string = '') => {
    return settings[key] || defaultValue;
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      getSetting,
      loading,
      error,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
```

### 2. Custom Hook for Settings

**Settings Hook** (`/client/src/hooks/useSettings.ts`):
```typescript
import { useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const useSetting = (key: string, defaultValue: string = '') => {
  const { getSetting } = useSettings();
  return getSetting(key, defaultValue);
};
```

---

## Specific Component Integration Points

### 1. Homepage Modifications

**Current File**: `/client/src/app/page.tsx`

#### Hero Section Integration
```typescript
// Before (static)
<h1 className="text-4xl lg:text-6xl font-bold leading-tight">
  Cartoleria Bambù{" "}
  <span className="text-yellow-300">Torre Annunziata</span>
</h1>

// After (dynamic)
import { useSetting } from '@/hooks/useSettings';

const Hero = () => {
  const companyName = useSetting('company.name', 'Cartoleria Bambù');
  const city = useSetting('contact.city', 'Torre Annunziata');
  const heroTitle = useSetting('homepage.hero.title', `${companyName} ${city}`);
  
  return (
    <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
      {heroTitle}
    </h1>
  );
};
```

#### Structured Data Integration
```typescript
// Before (static structured data)
const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Cartoleria Bambù",
  // ... static data
};

// After (dynamic structured data)
const useStructuredData = () => {
  const { getSetting } = useSettings();
  
  return useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: getSetting('company.name', 'Cartoleria Bambù'),
    description: getSetting('company.description', ''),
    address: {
      "@type": "PostalAddress",
      streetAddress: getSetting('contact.street_address', ''),
      addressLocality: getSetting('contact.city', ''),
      postalCode: getSetting('contact.postal_code', ''),
      addressCountry: getSetting('contact.country', 'IT'),
    },
    telephone: getSetting('contact.phone', ''),
    email: getSetting('contact.email', ''),
    // ... other dynamic fields
  }), [getSetting]);
};
```

### 2. Layout Integration

**Current File**: `/client/src/app/layout.tsx`

#### Global Metadata Integration
```typescript
// Before (static metadata)
export const metadata: Metadata = {
  title: "Cartoleria Bambù | Cancelleria Torre Annunziata | Quaderni Penne Online",
  description: "Cartoleria Bambù a Torre Annunziata dal 2016...",
  // ... static metadata
};

// After (dynamic metadata)
// Note: This requires a different approach since metadata must be static in App Router
// We'll need to use a metadata generation function or dynamic metadata updates
```

### 3. Footer Integration

**Current File**: `/client/src/components/layout/Footer.tsx`

#### Contact Information Integration
```typescript
// Before (static)
<span>📍</span>
<span>Corso Umberto I, 367 - 80058 Torre Annunziata (NA)</span>

// After (dynamic)
const Footer = () => {
  const { getSetting } = useSettings();
  const address = `${getSetting('contact.street_address', '')} - ${getSetting('contact.postal_code', '')} ${getSetting('contact.city', '')} (${getSetting('contact.province', '')})`;
  
  return (
    <div className="flex items-center gap-2">
      <span>📍</span>
      <span>{address}</span>
    </div>
  );
};
```

### 4. Social Media Links Integration

**Current File**: `/client/src/app/page.tsx` (Social Wall Section)

```typescript
// Before (static links)
<a href="https://www.instagram.com/cartoleriabambu?igsh=..." target="_blank">

// After (dynamic links)
const SocialWall = () => {
  const { getSetting } = useSettings();
  
  const socialLinks = {
    instagram: getSetting('social.instagram_url', ''),
    tiktok: getSetting('social.tiktok_url', ''),
    whatsapp: getSetting('social.whatsapp_url', ''),
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {socialLinks.instagram && (
        <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
          {/* Instagram component */}
        </a>
      )}
      {/* Other social links */}
    </div>
  );
};
```

---

## Admin Interface Integration Points

### 1. Settings Management Dashboard

**New File**: `/client/src/app/dashboard/settings/page.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import settingsService, { ISetting } from '@/api/settingsService';

const SettingsManagement = () => {
  const [settings, setSettings] = useState<ISetting[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const data = await settingsService.getPublicSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateSetting = async (key: string, value: string) => {
    try {
      await settingsService.updateSetting(key, value);
      await loadSettings(); // Refresh
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };
  
  // Settings management UI
  return (
    <div className="settings-management">
      {/* Settings form components */}
    </div>
  );
};
```

### 2. Settings Navigation Integration

**Current File**: `/client/src/app/dashboard/layout.tsx` (or similar)

Add new navigation item for settings management:
```typescript
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Prodotti', href: '/dashboard/prodotti', icon: ShoppingBagIcon },
  { name: 'Categorie', href: '/dashboard/categorie', icon: TagIcon },
  { name: 'Ordini', href: '/dashboard/ordini', icon: ClipboardDocumentListIcon },
  // New settings navigation
  { name: 'Impostazioni', href: '/dashboard/settings', icon: CogIcon },
];
```

---

## Caching Strategy

### 1. Frontend Caching
- **Local Storage**: Cache settings for faster subsequent loads
- **Context State**: Keep settings in memory during session
- **Refresh Strategy**: Automatic refresh on admin updates

### 2. Backend Caching
- **Redis/Memory Cache**: Cache frequently accessed settings
- **Cache Invalidation**: Clear cache on setting updates
- **TTL Strategy**: Time-based cache expiration

### 3. Cache Implementation

**Backend Cache Service** (`/server/src/services/cache.service.ts`):
```typescript
class CacheService {
  private cache = new Map<string, { value: any; expires: number }>();
  
  set(key: string, value: any, ttl: number = 3600) {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000)
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  invalidate(pattern: string) {
    // Invalidate cache entries matching pattern
  }
}
```

---

## Error Handling & Fallbacks

### 1. Graceful Degradation
- Always provide default values for settings
- Fall back to hardcoded values if API fails
- Display error states for admin users only

### 2. Loading States
- Show skeleton loaders during settings fetch
- Prevent layout shifts during loading
- Progressive enhancement approach

### 3. Error Boundaries
```typescript
const SettingsErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary fallback={<div>Settings temporarily unavailable</div>}>
      {children}
    </ErrorBoundary>
  );
};
```

---

## Testing Strategy

### 1. Unit Tests
- Test settings service methods
- Test React hooks and context providers
- Test fallback mechanisms

### 2. Integration Tests
- Test API endpoints
- Test frontend-backend integration
- Test cache behavior

### 3. E2E Tests
- Test admin settings management workflow
- Test frontend content updates
- Test error scenarios

---

## Migration Plan

### Phase 1: Infrastructure Setup
1. Add Settings model to Prisma schema
2. Create database migration
3. Implement settings API endpoints
4. Create frontend settings service

### Phase 2: Core Components Migration
1. Implement settings context provider
2. Migrate homepage content
3. Migrate footer and header
4. Migrate SEO metadata

### Phase 3: Admin Interface
1. Create settings management dashboard
2. Implement bulk settings editor
3. Add validation and preview features
4. Implement cache management

### Phase 4: Advanced Features
1. Add page content management
2. Implement content versioning
3. Add multi-language support
4. Implement content scheduling

This integration plan provides a comprehensive roadmap for implementing dynamic content management while maintaining system stability and performance.