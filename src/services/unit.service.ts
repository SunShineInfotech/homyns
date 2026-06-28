// src/services/unit.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface Unit {
  unit_id?: string;
  company_id?: string;
  unit_name: string;
  is_deleted?: string;
  c_date?: string;
}

export class UnitService extends BaseService {
  constructor() {
    super('unit.php');
  }

  /**
   * Fetch all units for a company
   */
  async getUnits(companyId: string): Promise<ApiResponse<Unit[]>> {
    try {
      const response = await this.post<ApiResponse<Unit[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get units error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch units',
        data: []
      };
    }
  }

  /**
   * Add a new unit
   */
  async addUnit(data: Partial<Unit>): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        unit_name: data.unit_name
      };
      
      console.log('Adding unit payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add unit error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add unit'
      };
    }
  }

  /**
   * Update an existing unit
   */
  async updateUnit(data: Unit): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        unit_id: data.unit_id,
        unit_name: data.unit_name
      };
      
      console.log('Update unit payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update unit error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update unit'
      };
    }
  }

  /**
   * Delete a unit (soft delete)
   */
  async deleteUnit(unitId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        unit_id: unitId
      };
      
      console.log('Delete unit payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete unit error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete unit'
      };
    }
  }

  /**
   * Search units by name
   */
  async searchUnits(searchTerm: string, companyId: string): Promise<Unit[]> {
    try {
      const response = await this.getUnits(companyId);
      if (response.status === 'success' && response.data) {
        return response.data.filter(
          unit => unit.unit_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const unitService = new UnitService();