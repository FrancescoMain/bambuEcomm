/**
 * Interfacce per i servizi API, seguendo il principio di Dependency Inversion (SOLID)
 * Questo permette di dipendere da astrazioni invece che implementazioni concrete
 */

export interface IApiService {
  get<T>(url: string, config?: any): Promise<T>;
  post<T>(url: string, data?: any, config?: any): Promise<T>;
  put<T>(url: string, data?: any, config?: any): Promise<T>;
  delete<T>(url: string, config?: any): Promise<T>;
  getInstance(): any; // Per casi particolari (FormData, ecc.)
}

export interface IAuthService {
  login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: any; token: string }>;
  register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ user: any }>;
  getCurrentUser(): Promise<any>;
  logout(): Promise<void>;
}

export interface IProductService {
  getLatestProducts(limit?: number): Promise<any[]>;
  getProductById(id: number): Promise<any>;
  searchProducts(
    query: string,
    categoryId?: number,
    page?: number,
    limit?: number
  ): Promise<any>;
  createProduct(productData: any): Promise<any>;
  updateProduct(id: number, productData: any): Promise<any>;
  deleteProduct(id: number): Promise<any>;
  uploadProductImage(file: File): Promise<string>;
  getProductsByCategory(
    categoryId: number,
    page?: number,
    limit?: number
  ): Promise<any>;
}

export interface ICartService {
  getCart(): Promise<any>;
  addItem(productId: number, quantity: number): Promise<any>;
  removeItem(itemId: number): Promise<any>;
  updateItemQuantity(itemId: number, quantity: number): Promise<any>;
  clearCart(): Promise<any>;
}

export interface ICartPageService {
  getProductById(id: number): Promise<any>;
  getRelatedProducts(
    category: string,
    excludeProductId?: number
  ): Promise<any[]>;
}

export interface ICategoryService {
  getAllCategories(): Promise<any[]>;
  getCategoryById(id: number): Promise<any>;
  createCategory(categoryData: any): Promise<any>;
  updateCategory(id: number, categoryData: any): Promise<any>;
  deleteCategory(id: number): Promise<any>;
  getSubcategories(parentId: number): Promise<any[]>;
}

export interface ISearchService {
  searchProducts(params: any): Promise<any[]>;
  loadMoreProducts(limit: number): Promise<any[]>;
}

export interface IHeaderService {
  getCart(): Promise<any>;
}

export interface IProductDetailService {
  getProductById(id: string | number): Promise<any>;
  getRelatedProductsByCategory(
    categoryId: number,
    limit?: number,
    excludeProductId?: number
  ): Promise<any[]>;
}

// Altre interfacce possono essere aggiunte in base alle necessità
