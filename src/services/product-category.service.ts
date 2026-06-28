// src/services/product-category.service.ts
import { BaseService, ApiResponse, apiClient } from './api.config';

export interface ProductCategory {
  category_id?: string;
  company_id?: string;
  category_name: string;
  category_image?: string;
  description?: string;
  sort_order?: number;
  is_deleted?: string;
  c_date?: string;
}

export class ProductCategoryService extends BaseService {
  constructor() {
    super('product-category.php');
  }

  /**
   * Fetch all product categories for a company
   */
  async getCategories(companyId: string): Promise<ApiResponse<ProductCategory[]>> {
    try {
      const response = await this.post<ApiResponse<ProductCategory[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get categories error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch categories',
        data: []
      };
    }
  }

  /**
   * Add a new product category with image
   */
  async addCategory(data: FormData): Promise<ApiResponse> {
    try {
      const response = await this.postFormData<ApiResponse>(data);
      return response;
    } catch (error: any) {
      console.error('Add category error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add category'
      };
    }
  }

  /**
   * Update an existing product category with image
   */
  async updateCategory(data: FormData): Promise<ApiResponse> {
    try {
      const response = await this.postFormData<ApiResponse>(data);
      return response;
    } catch (error: any) {
      console.error('Update category error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update category'
      };
    }
  }

  /**
   * Delete a product category (soft delete)
   */
  async deleteCategory(categoryId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        category_id: categoryId
      };
      
      console.log('Delete category payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete category error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete category'
      };
    }
  }

  /**
   * Helper method for FormData POST
   */
  private async postFormData<T>(data: FormData): Promise<T> {
    try {
      const response = await apiClient.post(this.apiEndpoint, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error(`API Error (${this.apiEndpoint}):`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const productCategoryService = new ProductCategoryService();