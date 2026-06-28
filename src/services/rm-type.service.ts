// src/services/rm-type.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface RawMaterialType {
  rm_type_id?: string;
  company_id?: string;
  rm_type_name: string;
  is_deleted?: string;
  c_date?: string;
}

export class RawMaterialTypeService extends BaseService {
  constructor() {
    super('rm-type.php');
  }

  /**
   * Fetch all raw material types for a company
   */
  async getRawMaterialTypes(companyId: string): Promise<ApiResponse<RawMaterialType[]>> {
    try {
      const response = await this.post<ApiResponse<RawMaterialType[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get raw material types error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch raw material types',
        data: []
      };
    }
  }

  /**
   * Add a new raw material type
   */
  async addRawMaterialType(data: Partial<RawMaterialType>): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        rm_type_name: data.rm_type_name
      };
      
      console.log('Adding raw material type payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add raw material type error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add raw material type'
      };
    }
  }

  /**
   * Update an existing raw material type
   */
  async updateRawMaterialType(data: RawMaterialType): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        rm_type_id: data.rm_type_id,
        rm_type_name: data.rm_type_name
      };
      
      console.log('Update raw material type payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update raw material type error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update raw material type'
      };
    }
  }

  /**
   * Delete a raw material type (soft delete)
   */
  async deleteRawMaterialType(rmTypeId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        rm_type_id: rmTypeId
      };
      
      console.log('Delete raw material type payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete raw material type error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete raw material type'
      };
    }
  }

  /**
   * Search raw material types by name
   */
  async searchRawMaterialTypes(searchTerm: string, companyId: string): Promise<RawMaterialType[]> {
    try {
      const response = await this.getRawMaterialTypes(companyId);
      if (response.status === 'success' && response.data) {
        return response.data.filter(
          type => type.rm_type_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const rmTypeService = new RawMaterialTypeService();