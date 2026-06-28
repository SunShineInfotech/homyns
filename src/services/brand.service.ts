// src/services/brand.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface Brand {
  brand_id?: string;
  company_id?: string;
  brand_name: string;
  brand_code?: string;
  is_deleted?: string;
  c_date?: string;
}

export class BrandService extends BaseService {
  constructor() {
    super('brand.php');
  }

  /**
   * Fetch all brands for a company
   */
  async getBrands(companyId: string): Promise<ApiResponse<Brand[]>> {
    try {
      const response = await this.post<ApiResponse<Brand[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get brands error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch brands',
        data: []
      };
    }
  }

  /**
   * Add a new brand
   */
  async addBrand(data: Partial<Brand>): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        brand_name: data.brand_name,
        brand_code: data.brand_code || ''
      };
      
      console.log('Adding brand payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add brand error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add brand'
      };
    }
  }

  /**
   * Update an existing brand
   */
  async updateBrand(data: Brand): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        brand_id: data.brand_id,
        brand_name: data.brand_name,
        brand_code: data.brand_code || ''
      };
      
      console.log('Update brand payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update brand error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update brand'
      };
    }
  }

  /**
   * Delete a brand (soft delete)
   */
  async deleteBrand(brandId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        brand_id: brandId
      };
      
      console.log('Delete brand payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete brand error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete brand'
      };
    }
  }

  /**
   * Search brands by name or code
   */
  async searchBrands(searchTerm: string, companyId: string): Promise<Brand[]> {
    try {
      const response = await this.getBrands(companyId);
      if (response.status === 'success' && response.data) {
        return response.data.filter(
          brand => 
            brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (brand.brand_code && brand.brand_code.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      return [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const brandService = new BrandService();