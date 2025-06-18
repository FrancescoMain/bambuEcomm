import { ICartService } from "./interfaces";
import apiService from "./apiService";

/**
 * Implementazione concreta del servizio carrello che utilizza l'APIService centralizzato
 * Segue il principio Single Responsibility (SOLID) occupandosi solo delle operazioni sul carrello
 */
class CartService implements ICartService {
  async getCart(): Promise<any> {
    try {
      const response = await apiService.get<any>("/cart");
      return response;
    } catch (error) {
      console.error("Error fetching cart:", error);
      throw error;
    }
  }

  async addItem(productId: number, quantity: number): Promise<any> {
    try {
      return await apiService.post("/cart/items", { productId, quantity });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      throw error;
    }
  }

  async removeItem(itemId: number): Promise<any> {
    try {
      return await apiService.delete(`/cart/items/${itemId}`);
    } catch (error) {
      console.error(`Error removing item with ID ${itemId} from cart:`, error);
      throw error;
    }
  }

  async updateItemQuantity(itemId: number, quantity: number): Promise<any> {
    try {
      return await apiService.put(`/cart/items/${itemId}`, { quantity });
    } catch (error) {
      console.error(
        `Error updating quantity for item with ID ${itemId}:`,
        error
      );
      throw error;
    }
  }

  async clearCart(): Promise<any> {
    try {
      return await apiService.delete("/cart");
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  }
}

// Esporta un'istanza singleton
const cartService = new CartService();
export default cartService;
