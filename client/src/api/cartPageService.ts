import apiService from "./apiService";
import { ICartPageService } from "./interfaces";

/**
 * Implementazione del servizio specifico per la pagina carrello
 */
class CartPageService implements ICartPageService {
  /**
   * Ottiene un prodotto specifico per ID
   */
  async getProductById(id: number): Promise<any> {
    try {
      return await apiService.get(`/products/${id}`);
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Ottiene prodotti correlati basati su una categoria
   */
  async getRelatedProducts(
    category: string,
    excludeProductId?: number
  ): Promise<any[]> {
    try {
      const response = await apiService.get<any>("/products", {
        params: {
          category,
          limit: 10,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      });

      const products = response.data || response.products || response;

      // Filtra il prodotto corrente se è fornito un ID da escludere
      if (excludeProductId) {
        return products.filter((p: any) => p.id !== excludeProductId);
      }

      return products;
    } catch (error) {
      console.error("Error fetching related products:", error);
      return [];
    }
  }
}

// Esporta un'istanza singleton
const cartPageService = new CartPageService();
export default cartPageService;
