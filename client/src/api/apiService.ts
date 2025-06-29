import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import store from "../redux/store";
import { logoutSuccess } from "../redux/authSlice";
import { IApiService } from "./interfaces";

// API URL centralizzato
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://bambu-ecomm-in2g.vercel.app/api";

// Classe per gestire tutte le chiamate API con interceptor per token scaduto
class ApiService implements IApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: any[] = [];

  constructor() {
    // Crea l'istanza di axios
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    }); // Aggiungi interceptor per le richieste
    this.api.interceptors.request.use(
      (config) => {
        // Ottieni il token dal Redux store
        const token = store.getState().auth.token;

        console.log("API Request:", config.url, "Token exists:", !!token);

        // Se esiste un token, aggiungilo all'header Authorization
        if (token && config.headers) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    ); // Aggiungi interceptor per le risposte
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.log("API Error:", error.response?.status, error.response?.data);

        // Gestione token scaduto (401)
        if (error.response?.status === 401) {
          console.log("Autenticazione fallita:", error.response.data);

          // Verifichiamo se è esplicitamente un token scaduto o qualsiasi errore 401
          // Possiamo gestire entrambi i casi facendo logout
          store.dispatch(logoutSuccess());

          // Reindirizza alla pagina di login solo se non siamo già sulla pagina di login
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.includes("/login")
          ) {
            // Salva l'URL corrente per tornare dopo il login
            localStorage.setItem(
              "redirectAfterLogin",
              window.location.pathname
            );

            console.log("Redirecting to login from:", window.location.pathname);
            // Reindirizza alla pagina di login
            window.location.href = "/login";
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Metodi generici per le chiamate API
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  // Ottieni l'istanza axios (se necessario per casi specifici)
  getInstance(): AxiosInstance {
    return this.api;
  }
}

// Esporta un'istanza singleton
const apiService = new ApiService();
export default apiService;
