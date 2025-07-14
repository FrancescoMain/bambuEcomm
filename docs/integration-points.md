# API Integration Points Documentation

## Overview

This document maps all existing and proposed API integration points in the bambuEcomm platform, providing a comprehensive guide for developers to understand the current API architecture and future integration opportunities.

## Current API Architecture

### Base Configuration
```typescript
// API Base URL Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bambu-ecomm-in2g.vercel.app/api";
```

### Authentication Layer
```typescript
// JWT Authentication Headers
const authHeaders = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

## Existing API Endpoints

### 1. **Authentication & User Management**

#### Auth Controller (`/api/auth/*`)
```typescript
POST   /api/auth/register        # User registration
POST   /api/auth/login           # User login
POST   /api/auth/logout          # User logout
GET    /api/auth/me              # Get current user
POST   /api/auth/refresh         # Refresh JWT token
POST   /api/auth/forgot-password # Password reset request
POST   /api/auth/reset-password  # Password reset confirmation
```

**Frontend Integration:**
```typescript
// Redux Auth Actions
import { getCurrentUserRequest, logoutRequest } from '@/redux/authSlice';

// Auth Service
import authService from '@/api/authService';
```

**Request/Response Examples:**
```typescript
// Login Request
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Login Response
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "user@example.com", "name": "User" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2. **Product Management**

#### Product Controller (`/api/products/*`)
```typescript
GET    /api/products             # Get paginated products
GET    /api/products/:id         # Get single product
POST   /api/products             # Create product (Admin)
PUT    /api/products/:id         # Update product (Admin)
DELETE /api/products/:id         # Delete product (Admin)
GET    /api/products/latest      # Get latest products
GET    /api/products/search      # Search products
```

**Frontend Integration:**
```typescript
import { fetchLatestProducts, Product, PaginatedProductsResponse } from '@/api/productApi';
```

**Query Parameters:**
```typescript
// Products List with Filters
GET /api/products?page=1&limit=10&categoryId=5&minPrice=10&maxPrice=100&search=quaderni&sortBy=prezzo&sortOrder=asc
```

**Response Structure:**
```typescript
interface PaginatedProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}
```

### 3. **Category Management**

#### Category Controller (`/api/categories/*`)
```typescript
GET    /api/categories           # Get all categories
GET    /api/categories/:id       # Get single category
POST   /api/categories           # Create category (Admin)
PUT    /api/categories/:id       # Update category (Admin)
DELETE /api/categories/:id       # Delete category (Admin)
GET    /api/categories/tree      # Get category hierarchy
```

**Frontend Integration:**
```typescript
// Redux Integration
import { selectParentCategories, selectCategoriesLoading } from '@/redux/categorySelectors';
import { fetchCategoriesStart } from '@/redux/categorySlice';
```

### 4. **Shopping Cart Management**

#### Cart Controller (`/api/cart/*`)
```typescript
GET    /api/cart                 # Get user cart
POST   /api/cart/add             # Add item to cart
PUT    /api/cart/update          # Update cart item quantity
DELETE /api/cart/remove/:itemId  # Remove item from cart
DELETE /api/cart/clear           # Clear entire cart
POST   /api/cart/sync            # Sync local cart with server
```

**Frontend Integration:**
```typescript
import { useCartActions } from '@/components/layout/CartProvider';
import { addToCart, removeFromCart, updateQuantity, clearCart } from '@/redux/cartSlice';
```

**Cart Item Structure:**
```typescript
interface CartItem {
  productId: number;
  titolo: string;
  prezzo: number;
  immagine?: string;
  quantity: number;
  cartItemId?: number;
}
```

### 5. **Order Management**

#### Order Controller (`/api/orders/*`)
```typescript
GET    /api/orders               # Get user orders
GET    /api/orders/:id           # Get order details
POST   /api/orders               # Create new order
PUT    /api/orders/:id/status    # Update order status (Admin)
GET    /api/orders/admin         # Get all orders (Admin)
```

**Order Status Flow:**
```typescript
enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED", 
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED"
}
```

### 6. **Admin Dashboard**

#### Dashboard Controller (`/api/dashboard/*`)
```typescript
GET    /api/dashboard/stats      # Get dashboard statistics
GET    /api/dashboard/orders     # Get recent orders
GET    /api/dashboard/products   # Get product metrics
GET    /api/dashboard/users      # Get user metrics
```

**Dashboard Metrics:**
```typescript
interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: Order[];
  topProducts: Product[];
}
```

### 7. **Checkout & Payment**

#### Checkout Controller (`/api/checkout/*`)
```typescript
POST   /api/checkout/create      # Create checkout session
POST   /api/checkout/confirm     # Confirm payment
GET    /api/checkout/session/:id # Get checkout session
```

**Stripe Integration:**
```typescript
import Stripe from 'stripe';

// Create payment intent
POST /api/checkout/create
{
  "items": [{ "productId": 1, "quantity": 2 }],
  "shippingAddress": { "street": "...", "city": "..." }
}
```

### 8. **Address Management**

#### Address Controller (`/api/address/*`)
```typescript
GET    /api/address              # Get user addresses
POST   /api/address              # Create new address
PUT    /api/address/:id          # Update address
DELETE /api/address/:id          # Delete address
```

### 9. **Notification System**

#### Notification Controller (`/api/notifications/*`)
```typescript
GET    /api/notifications        # Get user notifications
PUT    /api/notifications/:id/read # Mark as read
DELETE /api/notifications/:id    # Delete notification
```

### 10. **Email Services**

#### Email Controller (`/api/email/*`)
```typescript
POST   /api/email/contact        # Send contact form
POST   /api/email/order-confirm  # Send order confirmation
POST   /api/email/newsletter     # Newsletter subscription
```

## Proposed New API Endpoints

### 1. **Content Management System**

#### Settings API (`/api/settings/*`)
```typescript
GET    /api/settings             # Get all settings
GET    /api/settings/:key        # Get specific setting
GET    /api/settings/category/:cat # Get settings by category
PUT    /api/settings/:key        # Update setting
POST   /api/settings             # Create new setting
DELETE /api/settings/:key        # Delete setting
```

**Implementation Example:**
```typescript
// Service Layer
class SettingsService {
  async getSettings(category?: string): Promise<Settings[]> {
    const where = category ? { category } : {};
    return await prisma.settings.findMany({ where });
  }

  async updateSetting(key: string, value: string): Promise<Settings> {
    return await prisma.settings.upsert({
      where: { key },
      create: { key, value },
      update: { value, updatedAt: new Date() }
    });
  }
}
```

**Frontend Integration:**
```typescript
// Custom Hook for Settings
export const useSettings = (category?: string) => {
  const { data, error, mutate } = useSWR(
    category ? `/api/settings/category/${category}` : '/api/settings',
    fetcher
  );
  
  const updateSetting = async (key: string, value: string) => {
    await axios.put(`/api/settings/${key}`, { value });
    mutate();
  };

  return { settings: data, error, updateSetting };
};
```

#### Page Content API (`/api/content/*`)
```typescript
GET    /api/content/:page        # Get page content
GET    /api/content/:page/:section # Get section content
PUT    /api/content/:page/:section # Update section content
POST   /api/content              # Create new content section
DELETE /api/content/:id          # Delete content section
```

**Content Structure:**
```typescript
interface PageContent {
  id: number;
  page: string;         // 'home', 'about', 'contact'
  section: string;      // 'hero', 'features', 'stats'
  contentType: string;  // 'text', 'image', 'json'
  content: any;         // Flexible JSON content
  isActive: boolean;
  sortOrder: number;
}
```

#### Social Media API (`/api/social/*`)
```typescript
GET    /api/social               # Get all social links
POST   /api/social               # Create social link
PUT    /api/social/:id           # Update social link
DELETE /api/social/:id           # Delete social link
```

#### Media Library API (`/api/media/*`)
```typescript
GET    /api/media                # Get media assets
POST   /api/media/upload         # Upload new media
PUT    /api/media/:id            # Update media metadata
DELETE /api/media/:id            # Delete media asset
GET    /api/media/search         # Search media assets
```

### 2. **Advanced Analytics**

#### Analytics API (`/api/analytics/*`)
```typescript
GET    /api/analytics/overview   # Site overview metrics
GET    /api/analytics/products   # Product performance
GET    /api/analytics/users      # User behavior analytics
GET    /api/analytics/orders     # Order analytics
GET    /api/analytics/revenue    # Revenue tracking
```

**Analytics Data Structure:**
```typescript
interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: ProductMetric[];
  userActivity: UserActivity[];
}
```

### 3. **SEO Management**

#### SEO API (`/api/seo/*`)
```typescript
GET    /api/seo/meta/:page       # Get page meta data
PUT    /api/seo/meta/:page       # Update page meta data
GET    /api/seo/sitemap          # Generate sitemap
GET    /api/seo/structured-data  # Get structured data
PUT    /api/seo/structured-data  # Update structured data
```

## Integration Patterns

### 1. **Frontend Service Layer Pattern**

```typescript
// Base API Service
class ApiService {
  private baseURL = process.env.NEXT_PUBLIC_API_URL;
  private token: string | null = null;

  setAuthToken(token: string) {
    this.token = token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }
}

// Specific Service Implementation
class ProductService extends ApiService {
  async getProducts(params: ProductQuery): Promise<PaginatedProductsResponse> {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products?${query}`);
  }

  async getProduct(id: number): Promise<Product> {
    return this.request(`/products/${id}`);
  }
}
```

### 2. **Redux Integration Pattern**

```typescript
// Redux Slice for API Integration
const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
    pagination: null
  },
  reducers: {
    fetchProductsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProductsSuccess: (state, action) => {
      state.loading = false;
      state.items = action.payload.data;
      state.pagination = action.payload.pagination;
    },
    fetchProductsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

// Redux Saga for API Calls
function* fetchProductsSaga(action: PayloadAction<ProductQuery>) {
  try {
    yield put(fetchProductsStart());
    const response: PaginatedProductsResponse = yield call(
      productService.getProducts,
      action.payload
    );
    yield put(fetchProductsSuccess(response));
  } catch (error) {
    yield put(fetchProductsFailure(error.message));
  }
}
```

### 3. **React Hook Pattern**

```typescript
// Custom Hook for Data Fetching
export const useProducts = (query: ProductQuery) => {
  const [data, setData] = useState<PaginatedProductsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await productService.getProducts(query);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  return { data, loading, error };
};
```

### 4. **SWR Integration Pattern**

```typescript
// SWR Hook for Caching
export const useProductsSWR = (query: ProductQuery) => {
  const key = query ? `/products?${new URLSearchParams(query)}` : null;
  
  const { data, error, mutate } = useSWR(
    key,
    () => productService.getProducts(query),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    products: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  };
};
```

## Error Handling Strategies

### 1. **API Error Response Format**
```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### 2. **Frontend Error Handling**
```typescript
const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Redirect to login
    router.push('/login');
  } else if (error.response?.status === 403) {
    // Show permission error
    toast.error('Non hai i permessi per questa azione');
  } else if (error.response?.status >= 500) {
    // Server error
    toast.error('Errore del server. Riprova più tardi');
  } else {
    // Generic error
    toast.error(error.message || 'Errore imprevisto');
  }
};
```

## Security Considerations

### 1. **Authentication & Authorization**
```typescript
// JWT Token Management
const tokenManager = {
  get: () => localStorage.getItem('auth_token'),
  set: (token: string) => localStorage.setItem('auth_token', token),
  remove: () => localStorage.removeItem('auth_token'),
  isValid: (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
};
```

### 2. **Request Validation**
```typescript
// Input validation middleware
import { body, validationResult } from 'express-validator';

export const validateProduct = [
  body('titolo').notEmpty().trim().escape(),
  body('prezzo').isDecimal({ decimal_digits: '0,2' }),
  body('stock').isInt({ min: 0 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];
```

## Performance Optimization

### 1. **Caching Strategy**
```typescript
// Redis caching for frequently accessed data
const cacheService = {
  get: async (key: string) => {
    return await redis.get(key);
  },
  set: async (key: string, value: any, ttl: number = 3600) => {
    return await redis.setex(key, ttl, JSON.stringify(value));
  },
  del: async (key: string) => {
    return await redis.del(key);
  }
};
```

### 2. **Database Query Optimization**
```typescript
// Optimized product queries with includes
const getProductsOptimized = async (query: ProductQuery) => {
  return await prisma.product.findMany({
    where: buildWhereClause(query),
    include: {
      categoria: {
        select: { id: true, name: true }
      }
    },
    orderBy: buildOrderBy(query.sortBy, query.sortOrder),
    skip: (query.page - 1) * query.limit,
    take: query.limit
  });
};
```

## Testing Integration Points

### 1. **API Testing**
```typescript
// Jest test for API endpoints
describe('Product API', () => {
  test('GET /api/products returns paginated products', async () => {
    const response = await request(app)
      .get('/api/products?page=1&limit=10')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(10);
    expect(response.body.pagination).toBeDefined();
  });
});
```

### 2. **Frontend Integration Testing**
```typescript
// React Testing Library
test('ProductList component fetches and displays products', async () => {
  render(<ProductList />);
  
  await waitFor(() => {
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });
});
```

## Monitoring & Logging

### 1. **API Monitoring**
```typescript
// Express middleware for API monitoring
const apiMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};
```

### 2. **Error Tracking**
```typescript
// Integration with error tracking service
const errorTracker = {
  logError: (error: Error, context: any) => {
    // Send to error tracking service (e.g., Sentry)
    console.error('API Error:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
};
```

## Conclusion

The bambuEcomm platform has a robust API architecture that supports comprehensive e-commerce functionality. The proposed enhancements for content management, analytics, and SEO would provide additional flexibility and control over site content while maintaining the existing high-quality integration patterns.

The documented integration points serve as a foundation for future development and provide clear guidelines for extending the platform's capabilities.