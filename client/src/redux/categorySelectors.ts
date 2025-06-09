import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./store";

export const selectParentCategories = createSelector(
  (state: RootState) => state.category.categories,
  (categories) => categories.filter((cat) => !cat.parentId)
);

export const selectCategoriesLoading = (state: RootState) =>
  state.category.loading;

export const selectCategoriesError = (state: RootState) => state.category.error;
