import { all } from "redux-saga/effects";
import authSaga from "./authSaga"; // Creeremo questo file dopo

export default function* rootSaga() {
  yield all([
    authSaga(),
    // Aggiungi altri saga qui
  ]);
}
