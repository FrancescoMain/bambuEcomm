import { call, put, takeLatest, all, select } from "redux-saga/effects";
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
  User, // Import User interface from authSlice
} from "./authSlice";
import { RootState } from "./store"; // To get token from state

// Define your API base URL
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Adjust if your server runs elsewhere
const API_BASE_URL = "http://localhost:5000/api"; // Replace 5000 with your actual backend port if different

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message: string;
}

// Helper to get the token from the state
const getToken = (state: RootState) => state.auth.token;

// --- API Call Functions ---
async function apiLogin(credentials: { username: string; password: string }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json(); // Expected: { message: string, token: string, user: User }
}

async function apiRegister(userData: {
  username: string;
  password: string;
  email: string;
}) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json(); // Expected: { message: string, user: User (without password) }
}

async function apiGetCurrentUser(token: string | null) {
  if (!token) throw new Error("No token provided for getCurrentUser");
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json(); // Expected: User object
}

async function apiLogout(token: string | null) {
  // Logout might not need a token if it just clears client side
  // If your backend invalidates tokens, send it.
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers,
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json(); // Expected: { message: string }
}

// --- SAGA WORKERS ---
function* handleLogin(action: ReturnType<typeof loginRequest>) {
  try {
    // Map email to username for API compatibility
    const { email, password } = action.payload;
    const response: { user: User; token: string; message: string } = yield call(
      apiLogin,
      { username: email, password }
    );
    yield put(loginSuccess({ user: response.user, token: response.token }));
  } catch (e) {
    const error = e as ApiError;
    yield put(loginFailure(error.message || "Login fallito"));
  }
}

function* handleRegister(action: ReturnType<typeof registerRequest>) {
  try {
    // Map name to username for API compatibility
    const { name, email, password } = action.payload;
    const response: { user: User; message: string } = yield call(apiRegister, {
      username: name,
      email,
      password,
    });
    yield put(registerSuccess({ user: response.user }));
    // Optional: dispatch loginRequest if registration implies login
    // Or show a message to check email / login manually
  } catch (e) {
    const error = e as ApiError;
    yield put(registerFailure(error.message || "Registrazione fallita"));
  }
}

function* handleGetCurrentUser() {
  try {
    const token: string | null = yield select(getToken); // Get token from state first

    // The logic to extract token from action.payload has been removed.
    // The saga now relies on the token being present in the Redux state,
    // which should have been initialized from localStorage by authSlice.initialState.

    if (!token) {
      yield put(
        getCurrentUserFailure("Token non disponibile per recuperare utente.")
      );
      return;
    }
    const user: User = yield call(apiGetCurrentUser, token);
    yield put(getCurrentUserSuccess(user));
  } catch (e) {
    const error = e as ApiError;
    yield put(
      getCurrentUserFailure(error.message || "Recupero utente fallito")
    );
    // If 401 or 403, might want to clear token from localStorage via another action
    if (error.response?.status === 401 || error.response?.status === 403) {
      yield put(setToken(null)); // Clears token from state and localStorage via authSlice
    }
  }
}

function* handleLogout() {
  try {
    const token: string | null = yield select(getToken);
    yield call(apiLogout, token); // Pass token if your backend uses it for logout
    yield put(logoutSuccess());
  } catch (e) {
    const error = e as ApiError;
    yield put(logoutFailure(error.message || "Logout fallito"));
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

export default function* authSaga() {
  yield all([
    watchLoginRequest(),
    watchRegisterRequest(),
    watchGetCurrentUserRequest(),
    watchLogoutRequest(),
  ]);
}
