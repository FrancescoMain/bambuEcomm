import { call, put, takeLatest } from "redux-saga/effects";
import axios from "axios";
import {
  fetchCategoriesStart,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
} from "./categorySlice";
import { SagaIterator } from "redux-saga";

function* fetchCategoriesSaga(): SagaIterator {
  try {
    const apiUrl = "https://bambu-ecomm-in2g.vercel.app/api/categories";
    const url = apiUrl.endsWith("/categories")
      ? apiUrl
      : apiUrl.replace(/\/$/, "") + "/categories";
    const response = yield call(axios.get, url);
    yield put(fetchCategoriesSuccess(response.data));
  } catch (error: unknown) {
    yield put(
      fetchCategoriesFailure(
        error instanceof Error
          ? error.message
          : "Errore nel caricamento categorie"
      )
    );
  }
}

export function* watchFetchCategories() {
  yield takeLatest(fetchCategoriesStart.type, fetchCategoriesSaga);
}
