import { IAuthService } from "./interfaces";
import apiService from "./apiService";
import store from "../redux/store";
import { loginSuccess, logoutSuccess } from "../redux/authSlice";

/**
 * Implementazione concreta del servizio di autenticazione che utilizza l'APIService centralizzato
 * Segue il principio Single Responsibility (SOLID) occupandosi solo delle operazioni di autenticazione
 */
class AuthService implements IAuthService {
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: any; token: string }> {
    try {
      const response = await apiService.post<any>("/auth/login", credentials);

      // Memorizza token e utente
      if (response.token && response.user) {
        // Utilizziamo Redux per gestire lo stato di autenticazione
        store.dispatch(
          loginSuccess({
            user: response.user,
            token: response.token,
          })
        );

        // Salviamo anche nel localStorage per persistenza
        if (typeof window !== "undefined") {
          localStorage.setItem("token", response.token);
        }
      }

      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ user: any }> {
    try {
      return await apiService.post<any>("/auth/register", userData);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      return await apiService.get<any>("/auth/me");
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  }
  async logout(): Promise<void> {
    try {
      await apiService.post("/auth/logout");

      // Pulizia locale
      store.dispatch(logoutSuccess());

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        // Reindirizza alla homepage dopo il logout
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);

      // Anche in caso di errore, eseguiamo il logout locale
      store.dispatch(logoutSuccess());

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }

      throw error;
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      return await apiService.post<{ message: string }>(
        "/auth/request-password-reset",
        { email }
      );
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    try {
      return await apiService.post<{ message: string }>(
        "/auth/reset-password",
        {
          token,
          newPassword,
        }
      );
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }
}

// Esporta un'istanza singleton
const authService = new AuthService();
export default authService;
