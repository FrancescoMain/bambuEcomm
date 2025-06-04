import { RootState } from "./store";

export const selectParentCategories = (state: RootState) =>
  state.category.categories.filter((cat) => !cat.parentId);

export const selectCategoriesLoading = (state: RootState) =>
  state.category.loading;

export const selectCategoriesError = (state: RootState) => state.category.error;
