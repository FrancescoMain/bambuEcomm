import { call, put, takeLatest } from "redux-saga/effects";
import axios from "axios";
import {
  fetchCategoriesStart,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
} from "./categorySlice";

function* fetchCategoriesSaga(): any {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/categories";
    const url = apiUrl.endsWith("/categories")
      ? apiUrl
      : apiUrl.replace(/\/$/, "") + "/categories";
    const response = yield call(axios.get, url);
    yield put(fetchCategoriesSuccess(response.data));
  } catch (error: any) {
    yield put(
      fetchCategoriesFailure(
        error.message || "Errore nel caricamento categorie"
      )
    );
  }
}

export function* watchFetchCategories() {
  yield takeLatest(fetchCategoriesStart.type, fetchCategoriesSaga);
}
