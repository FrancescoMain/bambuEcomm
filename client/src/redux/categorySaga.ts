import { call, put, takeLatest } from "redux-saga/effects";
import categoryService from "../api/categoryService";
import {
  fetchCategoriesStart,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
} from "./categorySlice";
import { SagaIterator } from "redux-saga";

function* fetchCategoriesSaga(): SagaIterator {
  try {
    const categories = yield call([
      categoryService,
      categoryService.getAllCategories,
    ]);
    yield put(fetchCategoriesSuccess(categories));
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
