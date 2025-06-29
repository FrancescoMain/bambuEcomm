"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import categoryService from "../../../api/categoryService";

interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  parent?: Category;
  _count?: {
    products: number;
    children: number;
  };
}

interface CategoryFormData {
  name: string;
  description: string;
  parentId: string;
  isActive: boolean;
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    parentId: "",
    isActive: true,
  });

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const categories = await categoryService.getAllCategories();
      setCategories(categories || []);
      setFilteredCategories(categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
        isActive: formData.isActive,
      };

      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, payload);
      } else {
        await categoryService.createCategory(payload);
      }

      await fetchCategories();
      resetForm();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Error saving category");
    }
  };

  // Handle delete
  const handleDelete = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await categoryService.deleteCategory(categoryId);
      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error deleting category");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      parentId: "",
      isActive: true,
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  // Handle edit
  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId?.toString() || "",
      isActive: category.isActive,
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  // Toggle category expansion
  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Build hierarchical structure
  const buildHierarchy = (cats: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>();
    const roots: Category[] = [];

    // Create map and initialize children arrays
    cats.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build hierarchy
    cats.forEach((cat) => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!;
        parent.children!.push(category);
      } else {
        roots.push(category);
      }
    });

    return roots;
  };

  // Render category tree
  const renderCategoryTree = (cats: Category[], level = 0) => {
    return cats.map((category) => (
      <div
        key={category.id}
        className="border-b border-gray-100 last:border-b-0"
      >
        <div
          className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
            level > 0 ? `ml-${level * 6}` : ""
          }`}
          style={{ marginLeft: level * 24 }}
        >
          <div className="flex items-center gap-3 flex-1">
            {category.children && category.children.length > 0 && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {expandedCategories.has(category.id) ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
            )}
            {(!category.children || category.children.length === 0) && (
              <div className="w-6"></div>
            )}

            <FolderIcon className="h-5 w-5 text-amber-600" />

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    category.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {category.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {category.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                <span>Products: {category._count?.products || 0}</span>
                <span>Subcategories: {category._count?.children || 0}</span>
                <span>
                  Created: {new Date(category.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(category)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit category"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete category"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {category.children &&
          category.children.length > 0 &&
          expandedCategories.has(category.id) && (
            <div className="bg-gray-25">
              {renderCategoryTree(category.children, level + 1)}
            </div>
          )}
      </div>
    ));
  };

  const hierarchicalCategories = buildHierarchy(filteredCategories);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Category Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your product categories and hierarchy
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCategory ? "Edit Category" : "Add New Category"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) =>
                    setFormData({ ...formData, parentId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">No parent (Root category)</option>
                  {categories
                    .filter((cat) => cat.id !== editingCategory?.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active category
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                {editingCategory ? "Update Category" : "Create Category"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Categories ({filteredCategories.length})
          </h2>
        </div>

        {hierarchicalCategories.length === 0 ? (
          <div className="p-8 text-center">
            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No categories found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "No categories match your search."
                : "Get started by creating your first category."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Create Category
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {renderCategoryTree(hierarchicalCategories)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
