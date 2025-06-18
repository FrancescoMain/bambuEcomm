import { ICategoryService } from "./interfaces";
import apiService from "./apiService";

/**
 * Implementazione concreta del servizio categorie che utilizza l'APIService centralizzato
 * Segue il principio Single Responsibility (SOLID) occupandosi solo delle operazioni sulle categorie
 */
class CategoryService implements ICategoryService {
  async getAllCategories(): Promise<any[]> {
    try {
      const response = await apiService.get<any>("/categories");
      return response;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  async getCategoryById(id: number): Promise<any> {
    try {
      return await apiService.get(`/categories/${id}`);
    } catch (error) {
      console.error(`Error fetching category with ID ${id}:`, error);
      throw error;
    }
  }

  async createCategory(categoryData: any): Promise<any> {
    try {
      return await apiService.post("/categories", categoryData);
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  async updateCategory(id: number, categoryData: any): Promise<any> {
    try {
      return await apiService.put(`/categories/${id}`, categoryData);
    } catch (error) {
      console.error(`Error updating category with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<any> {
    try {
      return await apiService.delete(`/categories/${id}`);
    } catch (error) {
      console.error(`Error deleting category with ID ${id}:`, error);
      throw error;
    }
  }

  async getSubcategories(parentId: number): Promise<any[]> {
    try {
      const response = await apiService.get<any>(
        `/categories/${parentId}/subcategories`
      );
      return response;
    } catch (error) {
      console.error(
        `Error fetching subcategories for parent ID ${parentId}:`,
        error
      );
      return [];
    }
  }
}

// Esporta un'istanza singleton
const categoryService = new CategoryService();
export default categoryService;
