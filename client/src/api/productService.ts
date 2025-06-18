import { IProductService } from "./interfaces";
import apiService from "./apiService";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  stock: number;
}

/**
 * Implementazione concreta del servizio prodotti che utilizza l'APIService centralizzato
 * Segue il principio Single Responsibility (SOLID) occupandosi solo delle operazioni sui prodotti
 */
class ProductService implements IProductService {
  async getLatestProducts(limit = 10): Promise<any[]> {
    try {
      const response = await apiService.get<any>("/products", {
        params: {
          limit,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      });
      return response.products || response;
    } catch (error) {
      console.error("Error fetching latest products:", error);
      return [];
    }
  }

  async getProductById(id: number): Promise<any> {
    try {
      return await apiService.get(`/products/${id}`);
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  }

  async searchProducts(
    query: string,
    categoryId?: number,
    page = 1,
    limit = 10
  ): Promise<any> {
    try {
      return await apiService.get("/products/search", {
        params: {
          q: query,
          categoryId,
          page,
          limit,
        },
      });
    } catch (error) {
      console.error("Error searching products:", error);
      return { products: [], totalPages: 0, totalItems: 0 };
    }
  }

  async createProduct(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<any> {
    try {
      return await apiService.post("/products", productData);
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<any> {
    try {
      return await apiService.put(`/products/${id}`, productData);
    } catch (error) {
      console.error(`Error updating product with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<any> {
    try {
      return await apiService.delete(`/products/${id}`);
    } catch (error) {
      console.error(`Error deleting product with ID ${id}:`, error);
      throw error;
    }
  }

  async uploadProductImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);

    try {
      // Utilizziamo l'istanza di axios direttamente per gestire il FormData
      const response = await apiService
        .getInstance()
        .post("/products/upload-image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

      return response.data.url;
    } catch (error) {
      console.error("Error uploading product image:", error);
      throw error;
    }
  }

  async getProductsByCategory(
    categoryId: number,
    page = 1,
    limit = 10
  ): Promise<any> {
    try {
      return await apiService.get(`/products/category/${categoryId}`, {
        params: {
          page,
          limit,
        },
      });
    } catch (error) {
      console.error(
        `Error fetching products for category ${categoryId}:`,
        error
      );
      return { products: [], totalPages: 0, totalItems: 0 };
    }
  }
}

// Esporta un'istanza singleton
const productService = new ProductService();
export default productService;
