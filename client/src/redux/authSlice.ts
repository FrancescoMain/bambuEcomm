import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Interfaccia basata sulla risposta di getCurrentUserProfile e loginUser
export interface User {
  id: string;
  email: string;
  name: string;
  role?: string; // Aggiunto ruolo, presente nel token e nel profilo
  // addresses?: any[]; // Esempio, decommenta e tipizza se necessario
  // cart?: any;      // Esempio, decommenta e tipizza se necessario
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null, // Carica il token da localStorage se presente
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Login Actions
    loginRequest(state) {
      state.isLoading = true;
      state.error = null;
      state.token = null;
      state.user = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload.token);
      }
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
      state.token = null;
      state.user = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    },

    // Register Actions
    registerRequest(state) {
      state.isLoading = true;
      state.error = null;
    },
    registerSuccess(state, action: PayloadAction<{ user: User }>) {
      state.isLoading = false;
      // Generalmente la registrazione non logga l'utente automaticamente,
      // ma potrebbe reindirizzare al login o fornire un messaggio.
      // Se il backend logga l'utente e restituisce un token, gestire come loginSuccess.
      // state.user = action.payload.user;
      state.error = null;
    },
    registerFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Get Current User Actions
    getCurrentUserRequest(state) {
      state.isLoading = true;
      state.error = null;
      // Token is expected to be in state, loaded by initialState or set by login/setToken.
    },
    getCurrentUserSuccess(state, action: PayloadAction<User>) {
      state.isLoading = false;
      state.user = action.payload;
      state.error = null;
    },
    getCurrentUserFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
      state.user = null; // Pulisce l'utente in caso di fallimento
      state.token = null; // Pulisce il token
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    },

    // Logout Actions
    logoutRequest(state) {
      state.isLoading = true;
    },
    logoutSuccess(state) {
      state.user = null;
      state.token = null;
      state.isLoading = false;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    },
    logoutFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
      // Nonostante il fallimento del logout API, si potrebbe voler pulire lo stato localmente
      // state.user = null;
      // state.token = null;
      // localStorage.removeItem('token');
    },

    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      if (action.payload && typeof window !== "undefined") {
        localStorage.setItem("token", action.payload);
      } else if (!action.payload && typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  registerRequest,
  registerSuccess,
  registerFailure,
  getCurrentUserRequest,
  getCurrentUserSuccess,
  getCurrentUserFailure,
  logoutRequest,
  logoutSuccess,
  logoutFailure,
  setToken,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;
