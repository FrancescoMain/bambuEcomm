import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./authSlice"; // Corrected: authSlice exports the reducer as default

const rootReducer = combineReducers({
  auth: authReducer,
  // Aggiungi altri reducer qui
});

export default rootReducer;
