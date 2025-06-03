import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  // Aggiungi altri campi utente se necessario
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  clearUser: () => set({ user: null, isLoading: false }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
