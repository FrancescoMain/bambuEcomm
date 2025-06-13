import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://bambu-ecomm-in2g.vercel.app/api";

export async function fetchLatestProducts(limit = 10) {
  const res = await axios.get(`${API_URL}/products`, {
    params: {
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
  });
  return res.data.products || res.data;
}
