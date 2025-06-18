import apiService from "./apiService";
import { IProductDetailService } from "./interfaces";

/**
 * Implementazione del servizio per la pagina di dettaglio prodotto
 */
class ProductDetailService implements IProductDetailService {
  /**
   * Ottiene i dettagli di un prodotto specifico
   */
  async getProductById(id: string | number): Promise<any> {
    try {
      return await apiService.get<any>(`/products/${id}`);
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Ottiene prodotti correlati in base alla categoria
   */
  async getRelatedProductsByCategory(
    categoryId: number,
    limit = 10,
    excludeProductId?: number
  ): Promise<any[]> {
    try {
      const response = await apiService.get<any>("/products", {
        params: {
          categoryId,
          limit,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      });

      const products = response.data || response;

      // Filtra il prodotto corrente se è fornito un ID da escludere
      if (excludeProductId) {
        return Array.isArray(products)
          ? products.filter((p: any) => p.id !== excludeProductId)
          : [];
      }

      return Array.isArray(products) ? products : [];
    } catch (error) {
      console.error("Error fetching related products:", error);
      return [];
    }
  }
}

// Esporta un'istanza singleton
const productDetailService = new ProductDetailService();
export default productDetailService;
