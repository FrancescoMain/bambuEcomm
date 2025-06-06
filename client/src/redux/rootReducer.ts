import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./authSlice"; // Corrected: authSlice exports the reducer as default
import categoryReducer from "./categorySlice";
import cartReducer from "./cartSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  category: categoryReducer,
  cart: cartReducer,
  // Aggiungi altri reducer qui
});

export default rootReducer;
