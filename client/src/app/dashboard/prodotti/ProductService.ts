"use client";
import apiService from "@/api/apiService";
import { Product, ProductFormData, API_URL } from "./types";

export class ProductService {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private getHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : undefined;
  }
  async fetchProducts(params: {
    limit: number;
    page: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
    categoryId?: string;
  }) {
    try {
      const response = await apiService.get<any>("/products", {
        params: {
          ...params,
          search: params.search || undefined,
          categoryId: params.categoryId || undefined,
        },
      });

      return {
        products: response.data || response.products || response,
        totalPages: response.totalPages || 1,
        error: null,
      };
    } catch (err) {
      return {
        products: [],
        totalPages: 1,
        error: "Errore nel recupero prodotti",
      };
    }
  }  async fetchProductById(id: number) {
    try {
      const response = await apiService.get<any>(`/products/${id}`);
      console.log("API complete response for product details:", JSON.stringify(response, null, 2));
      
      // Ristrutturiamo esplicitamente la risposta per garantire la struttura corretta
      let product;
      
      // Verifica se la risposta ha il formato corretto
      if (response.product) {
        product = response.product;
      } else {
        product = response;
      }
      
      // Assicuriamoci che le varianti siano un array
      if (!product.varianti) {
        console.log("WARNING: product.varianti is undefined, initializing as empty array");
        product.varianti = [];
      }
      
      console.log("Structured product data:", product);
      console.log("Structured product variants:", product.varianti);
      
      return product;
    } catch (err) {
      console.error(`Error fetching product with ID ${id}:`, err);
      throw new Error("Errore nel recupero del prodotto");
    }
  }
  async deleteProduct(id: number) {
    try {
      await apiService.delete(`/products/${id}`);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: "Errore durante l'eliminazione" };
    }
  }

  async toggleProductAvailability(id: number) {
    try {
      const response = await apiService.patch(`/products/${id}/availability`);
      return { success: true, product: response.product, error: null };
    } catch (error) {
      return { success: false, error: "Errore durante il cambio di disponibilità" };
    }
  }
  async uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("image", file);
    try {
      // Utilizziamo l'istanza di axios direttamente per gestire il FormData
      const response = await apiService
        .getInstance()
        .post(`/products/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      return response.data.url;
    } catch {
      return null;
    }
  }

  async saveProduct(data: ProductFormData, productId?: number) {
    try {
      let imageUrl = data.immagine;
      if (data.imageFile) {
        imageUrl = (await this.uploadImage(data.imageFile)) || undefined;
      }

      // Copia le varianti per poterle modificare
      const variantiCopy = data.varianti ? [...data.varianti] : [];

      // Carica tutte le immagini delle varianti
      if (data.variantImageFiles) {
        const uploadPromises = Object.entries(data.variantImageFiles).map(
          async ([key, file]) => {
            const [typeIndex, valueIndex] = key.split("-").map(Number);
            const imageUrl = await this.uploadImage(file);
            return { key, imageUrl };
          }
        );

        const results = await Promise.all(uploadPromises);

        // Aggiorna le URL delle immagini nelle varianti
        results.forEach(({ key, imageUrl }) => {
          if (imageUrl) {
            const [typeIndex, valueIndex] = key.split("-").map(Number);
            if (
              variantiCopy[typeIndex] &&
              variantiCopy[typeIndex].valori[valueIndex]
            ) {
              variantiCopy[typeIndex].valori[valueIndex].immagine = imageUrl;
            }
          }
        });
      }

      const payload = {
        titolo: data.titolo,
        prezzo: Number(data.prezzo),
        descrizione: data.descrizione,
        immagine: imageUrl,
        categoriaId: data.categoriaId ? Number(data.categoriaId) : undefined,
        stock: data.stock !== undefined ? Number(data.stock) : 0,
        varianti: variantiCopy,
      };
      if (productId) {
        await apiService.put(`/products/${productId}`, payload);
      } else {
        await apiService.post(`/products`, payload);
      }
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: "Errore durante il salvataggio" };
    }
  }
}
