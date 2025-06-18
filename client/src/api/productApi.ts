import apiService from "./apiService";

// Tipologia dei prodotti
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

// API per ottenere i prodotti più recenti
export async function fetchLatestProducts(limit = 10) {
  return apiService.get("/products", {
    params: {
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
  });
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
