// src/services/raw-material.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface RawMaterial {
  rm_id?: string;
  company_id?: string;
  rm_name: string;
  rm_type_id?: string;     // Foreign key to tbl_raw_material_type
  rm_type_name?: string;   // For display
  unit_id?: string;        // Foreign key to tbl_unit
  unit_name?: string;      // For display
  brand_id?: string;       // Foreign key to tbl_brand
  brand_name?: string;     // For display
  color_code?: string;
  description?: string;
  current_stock?: number;
  min_stock_alert?: number;
  cost_price?: number;
  status?: string;
  is_deleted?: string;
  c_date?: string;
}

export class RawMaterialService extends BaseService {
  constructor() {
    super('raw-material.php');
  }

  /**
   * Fetch all raw materials for a company
   */
  async getRawMaterials(companyId: string): Promise<ApiResponse<RawMaterial[]>> {
    try {
      const response = await this.post<ApiResponse<RawMaterial[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get raw materials error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch raw materials',
        data: []
      };
    }
  }

  /**
   * Add a new raw material
   */
  async addRawMaterial(data: Partial<RawMaterial>): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        rm_name: data.rm_name,
        rm_type_id: data.rm_type_id || '',
        unit_id: data.unit_id || '',
        brand_id: data.brand_id || '',
        color_code: data.color_code || '',
        description: data.description || '',
        current_stock: data.current_stock || 0,
        min_stock_alert: data.min_stock_alert || 0,
        cost_price: data.cost_price || 0,
        status: data.status || 'Active'
      };
      
      console.log('Adding raw material payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add raw material error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add raw material'
      };
    }
  }

  /**
   * Update an existing raw material
   */
  async updateRawMaterial(data: RawMaterial): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        rm_id: data.rm_id,
        rm_name: data.rm_name,
        rm_type_id: data.rm_type_id || '',
        unit_id: data.unit_id || '',
        brand_id: data.brand_id || '',
        color_code: data.color_code || '',
        description: data.description || '',
        current_stock: data.current_stock || 0,
        min_stock_alert: data.min_stock_alert || 0,
        cost_price: data.cost_price || 0,
        status: data.status || 'Active'
      };
      
      console.log('Update raw material payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update raw material error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update raw material'
      };
    }
  }

  /**
   * Delete a raw material (soft delete)
   */
  async deleteRawMaterial(rmId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        rm_id: rmId
      };
      
      console.log('Delete raw material payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete raw material error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete raw material'
      };
    }
  }
}

// Export singleton instance
export const rawMaterialService = new RawMaterialService();