import { all } from "redux-saga/effects";
import authSaga from "./authSaga"; // Creeremo questo file dopo
import { watchFetchCategories } from "./categorySaga";

export default function* rootSaga() {
  yield all([
    authSaga(),
    watchFetchCategories(),
    // Aggiungi altri saga qui
  ]);
}
