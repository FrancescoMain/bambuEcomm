import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const addCartItemApi = async (
  productId: number,
  quantity: number,
  token: string
) => {
  return axios.post(
    `${API_URL}/cart/items`, // <-- fix endpoint
    { productId, quantity },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const removeCartItemApi = async (cartItemId: number, token: string) => {
  return axios.delete(`${API_URL}/cart/items/${cartItemId}`, {
    // <-- fix endpoint
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateCartItemQuantityApi = async (
  cartItemId: number,
  quantity: number,
  token: string
) => {
  return axios.put(
    `${API_URL}/cart/items/${cartItemId}`, // <-- fix endpoint
    { quantity },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
