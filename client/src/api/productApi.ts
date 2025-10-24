import apiService from "./apiService";

// Tipologia dei prodotti dalla API (struttura reale)
export interface Product {
  id: number;
  titolo: string; // nome del prodotto
  descrizione: string; // descrizione
  prezzo: string; // prezzo come stringa
  stock: number;
  immagine: string; // singola immagine come stringa
  createdAt: string;
  updatedAt: string;
  available?: boolean; // disponibilità del prodotto
  categoria: {
    // array di categorie
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    parentId: number | null;
  }[];
  varianti?: {
    // struttura varianti
    id: number;
    nome: string;
    productId: number;
    valori: {
      id: number;
      nome: string;
      immagine: string;
      typeId: number;
    }[];
  }[];
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  stock: number;
}

// Tipo per la risposta paginata dell'API
export interface PaginatedProductsResponse {
  data: Product[];
  totalPages: number;
  currentPage: number;
  totalProducts: number;
}

// API per ottenere i prodotti più recenti
export async function fetchLatestProducts(
  limit = 10
): Promise<PaginatedProductsResponse> {
  console.log("🌐 ProductAPI: Chiamata fetchLatestProducts con limit:", limit);
  try {
    const result = await apiService.get<PaginatedProductsResponse>(
      "/products",
      {
        params: {
          limit,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      }
    );
    console.log("✅ ProductAPI: Risposta ricevuta:", result);
    return result;
  } catch (error) {
    console.error("❌ ProductAPI: Errore in fetchLatestProducts:", error);
    throw error;
  }
}

// API per ottenere un singolo prodotto
export async function fetchProductById(id: number) {
  return apiService.get(`/products/${id}`);
}

// API per cercare prodotti
export async function searchProducts(
  query: string,
  categoryId?: number,
  page = 1,
  limit = 10
) {
  return apiService.get("/products/search", {
    params: {
      q: query,
      categoryId,
      page,
      limit,
    },
  });
}

// API per creare un nuovo prodotto (admin)
export async function createProduct(
  productData: Omit<Product, "id" | "createdAt" | "updatedAt">
) {
  return apiService.post("/products", productData);
}

// API per aggiornare un prodotto esistente (admin)
export async function updateProduct(id: number, productData: Partial<Product>) {
  return apiService.put(`/products/${id}`, productData);
}

// API per eliminare un prodotto (admin)
export async function deleteProduct(id: number) {
  return apiService.delete(`/products/${id}`);
}

// API per caricare un'immagine del prodotto
export async function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  // Utilizziamo l'istanza di axios direttamente per gestire il FormData
  const response = await apiService
    .getInstance()
    .post("/products/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

  return response.data;
}

// API per ottenere prodotti per categoria
export async function fetchProductsByCategory(
  categoryId: number,
  page = 1,
  limit = 10
) {
  return apiService.get(`/products/category/${categoryId}`, {
    params: {
      page,
      limit,
    },
  });
}

// API per gestire le varianti dei prodotti
export async function addProductVariant(
  productId: number,
  variant: Omit<ProductVariant, "id" | "productId">
) {
  return apiService.post(`/products/${productId}/variants`, variant);
}

export async function updateProductVariant(
  productId: number,
  variantId: number,
  variant: Partial<ProductVariant>
) {
  return apiService.put(
    `/products/${productId}/variants/${variantId}`,
    variant
  );
}

export async function deleteProductVariant(
  productId: number,
  variantId: number
) {
  return apiService.delete(`/products/${productId}/variants/${variantId}`);
}
