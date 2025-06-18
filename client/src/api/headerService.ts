import apiService from "./apiService";
import { IHeaderService } from "./interfaces";

/**
 * Implementazione del servizio per l'header che include funzionalità per il carrello
 */
class HeaderService implements IHeaderService {
  /**
   * Carica il carrello dell'utente dal backend
   */
  async getCart(): Promise<any> {
    try {
      const response = await apiService.get<any>("/cart");
      return response;
    } catch (error) {
      console.error("Error fetching cart:", error);
      return { items: [] };
    }
  }
}

// Esporta un'istanza singleton
const headerService = new HeaderService();
export default headerService;
