import {
  call,
  put,
  takeLatest,
  all,
  select,
  SelectEffect,
  CallEffect,
  PutEffect,
} from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import {
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
} from "./authSlice";
import authService from "../api/authService";
import { User } from "./authSlice";
import { RootState } from "./store";

// Tipi per gli effetti saga
type AuthEffect = CallEffect | PutEffect | SelectEffect;

// Interfacce per le risposte delle API
interface LoginResponse {
  user: User;
  token: string;
}

interface RegisterResponse {
  user: User;
}

interface GetCurrentUserResponse {
  user: User;
}

// Selector per ottenere il token dallo stato
const getToken = (state: RootState) => state.auth.token;

// Tipo per la risposta del login
interface LoginResponse {
  user: User;
  token: string;
}

// --- SAGA WORKERS ---
function* handleLogin(
  action: PayloadAction<{ email: string; password: string }>
): Generator<AuthEffect, void, LoginResponse> {
  try {
    // Utilizziamo authService per gestire il login
    const response = yield call(
      [authService, authService.login],
      action.payload
    );

    // Il token e l'utente vengono già gestiti all'interno del servizio authService
    // Qui impostiamo solo lo stato di Redux
    yield put(loginSuccess({ user: response.user, token: response.token }));

    // Reindirizza dopo il login se necessario
    if (typeof window !== "undefined") {
      const redirectPath = localStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        localStorage.removeItem("redirectAfterLogin");
        window.location.href = redirectPath;
      }
    }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || "Login fallito";
    yield put(loginFailure(errorMessage));
  }
}

function* handleRegister(
  action: PayloadAction<{ name: string; email: string; password: string }>
): Generator<AuthEffect, void, RegisterResponse> {
  try {
    // Utilizziamo authService
    const response = yield call(
      [authService, authService.register],
      action.payload
    );

    yield put(registerSuccess({ user: response.user }));
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || "Registrazione fallita";
    yield put(registerFailure(errorMessage));
  }
}

function* handleGetCurrentUser(): Generator<AuthEffect, void, any> {
  try {
    const token: string | null = yield select(getToken);

    if (!token) {
      yield put(
        getCurrentUserFailure("Token non disponibile per recuperare utente.")
      );
      return;
    }

    // Utilizziamo authService invece di apiService
    const user: User = yield call([authService, authService.getCurrentUser]);

    yield put(getCurrentUserSuccess(user));
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Recupero utente fallito";
    yield put(getCurrentUserFailure(errorMessage));

    // Se 401 o 403, potremmo voler cancellare il token
    if (error.response?.status === 401 || error.response?.status === 403) {
      yield put(setToken(null));
    }
  }
}

function* handleLogout(): Generator<AuthEffect, void, void> {
  try {
    // Utilizziamo authService invece di apiService
    yield call([authService, authService.logout]);

    yield put(logoutSuccess());

    // Reindirizza alla home dopo il logout
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || "Logout fallito";
    yield put(logoutFailure(errorMessage));

    // Anche in caso di errore nel logout, facciamo il logout localmente
    yield put(logoutSuccess());
  }
}

// --- SAGA WATCHERS ---
function* watchLoginRequest() {
  yield takeLatest(loginRequest.type, handleLogin);
}

function* watchRegisterRequest() {
  yield takeLatest(registerRequest.type, handleRegister);
}

function* watchGetCurrentUserRequest() {
  yield takeLatest(getCurrentUserRequest.type, handleGetCurrentUser);
}

function* watchLogoutRequest() {
  yield takeLatest(logoutRequest.type, handleLogout);
}

// --- SAGA PRINCIPALE ---
export default function* authSaga() {
  yield all([
    watchLoginRequest(),
    watchRegisterRequest(),
    watchGetCurrentUserRequest(),
    watchLogoutRequest(),
  ]);
}
