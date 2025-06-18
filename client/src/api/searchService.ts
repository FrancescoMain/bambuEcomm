import apiService from "./apiService";
import { ISearchService } from "./interfaces";

/**
 * Interfaccia per i parametri di ricerca prodotti
 */
export interface ProductQueryParams {
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  categoryId?: number | number[];
  minPrice?: string;
  maxPrice?: string;
}

/**
 * Implementazione concreta del servizio di ricerca che utilizza l'APIService centralizzato
 * Segue il principio Single Responsibility (SOLID) occupandosi solo delle operazioni di ricerca
 */
class SearchService implements ISearchService {
  /**
   * Cerca prodotti con vari filtri
   * @param params Parametri di ricerca
   */
  async searchProducts(params: ProductQueryParams): Promise<any> {
    try {
      // Utilizziamo l'istanza axios direttamente per personalizzare la serializzazione dei parametri
      const response = await apiService.getInstance().get(`/products`, {
        params,
        paramsSerializer: (params: any) => {
          // Serializza array come categoryId=1&categoryId=2
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((v) => searchParams.append(key, v.toString()));
            } else if (value !== undefined && value !== null) {
              searchParams.append(key, value.toString());
            }
          });
          return searchParams.toString();
        },
      });

      // Normalizza il formato della risposta
      const products = Array.isArray(response.data.data)
        ? response.data.data
        : response.data.data.data;

      return products;
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  }

  /**
   * Carica più prodotti per paginazione infinita
   * @param limit Numero di prodotti da caricare
   */
  async loadMoreProducts(limit: number): Promise<any> {
    try {
      const params = {
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      const response = await apiService
        .getInstance()
        .get(`/products`, { params });

      // Normalizza il formato della risposta
      const products = Array.isArray(response.data.data)
        ? response.data.data
        : response.data.data.data;

      return products;
    } catch (error) {
      console.error("Error loading more products:", error);
      return [];
    }
  }
}

// Esporta un'istanza singleton
const searchService = new SearchService();
export default searchService;
