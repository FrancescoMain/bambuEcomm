import apiService from "./apiService";

export const addCartItemApi = async (
  productId: number,
  quantity: number,
  selectedVariants?: Record<
    number,
    { id: number; nome: string; immagine?: string }
  >
) => {
  return apiService.post("/cart/items", {
    productId,
    quantity,
    selectedVariants,
  });
};

export const removeCartItemApi = async (cartItemId: number) => {
  return apiService.delete(`/cart/items/${cartItemId}`);
};

export const updateCartItemQuantityApi = async (
  cartItemId: number,
  quantity: number
) => {
  return apiService.put(`/cart/items/${cartItemId}`, { quantity });
};
