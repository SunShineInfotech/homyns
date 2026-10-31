// src/services/product.service.ts
import { BaseService, ApiResponse, apiClient } from './api.config';

export interface Product {
  product_id?: string;
  company_id?: string;
  category_id?: string;
  category_name?: string;
  product_name: string;
  qty_type?: string; // 'Fixed', 'ByHWD', 'ByHWL'
  height?: number;
  width?: number;
  depth?: number;
  length?: number;
  dimension_unit_id?: string;
  dimension_unit_name?: string;
  price?: number;
  current_stock?: number;
  gst_percent?: number;
  image?: string;
  description?: string;
  status?: string;
  is_deleted?: string;
  c_date?: string;
  product_details?: ProductDetail[];
}

export interface ProductDetail {
  pd_id?: string;
  product_id?: string;
  rm_id?: string;
  rm_name?: string;
  rm_type_name?: string;
  rm_qty?: number;
  remark?: string;
  is_deleted?: string;
  c_date?: string;
}

export class ProductService extends BaseService {
  constructor() {
    super('product.php');
  }

  /**
   * Fetch all products for a company
   */
  async getProducts(companyId: string): Promise<ApiResponse<Product[]>> {
    try {
      const response = await this.post<ApiResponse<Product[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get products error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch products',
        data: []
      };
    }
  }

  /**
   * Add a new product with image
   */
  async addProduct(data: FormData): Promise<ApiResponse> {
    try {
      const response = await this.postFormData<ApiResponse>(data);
      return response;
    } catch (error: any) {
      console.error('Add product error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add product'
      };
    }
  }

  /**
   * Update an existing product with image
   */
  async updateProduct(data: FormData): Promise<ApiResponse> {
    try {
      const response = await this.postFormData<ApiResponse>(data);
      return response;
    } catch (error: any) {
      console.error('Update product error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update product'
      };
    }
  }

  /**
   * Delete a product (soft delete)
   */
  async deleteProduct(productId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        product_id: productId
      };
      
      console.log('Delete product payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete product error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete product'
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
export const productService = new ProductService();
