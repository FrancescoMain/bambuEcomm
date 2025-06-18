export const config = {
  schedule: "0 * * * *", // ogni ora
};

export default async function handler(req, res) {
  // Chiama il backend Express per svuotare i carrelli vecchi
  const response = await fetch(
    "https://bambu-ecomm-in2g.vercel.app/api/cart/cleanup",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': 'Bearer ...', // se serve
      },
    }
  );
  const data = await response.json();
  res.status(response.status).json(data);
}
