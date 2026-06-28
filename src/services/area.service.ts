// src/services/area.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface Area {
  area_id?: string;
  company_id?: string;
  city_id?: string;
  area_name: string;
  pincode?: string;
  is_deleted?: string;
  c_date?: string;
}

export interface AreaWithDetails extends Area {
  city_name?: string;
  state_name?: string;
  state_id?: string;
  id?: string;
}

export class AreaService extends BaseService {
  constructor() {
    super('area.php');
  }

  /**
   * Fetch all areas for a company
   */
  async getAreas(companyId: string, cityId?: string): Promise<ApiResponse<Area[]>> {
    try {
      const response = await this.post<ApiResponse<Area[]>>({
        type: 3,
        company_id: companyId,
        city_id: cityId || ''
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get areas error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch areas',
        data: []
      };
    }
  }

  /**
   * Add a new area
   */
  async addArea(data: Partial<Area>): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        city_id: data.city_id,
        area_name: data.area_name,
        pincode: data.pincode || ''
      };
      
      console.log('Adding area payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add area error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add area'
      };
    }
  }

  /**
   * Update an existing area
   */
  async updateArea(data: Area): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        area_id: data.area_id,
        area_name: data.area_name,
        city_id: data.city_id,
        pincode: data.pincode || ''
      };
      
      console.log('Update area payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update area error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update area'
      };
    }
  }

  /**
   * Delete an area (soft delete)
   */
  async deleteArea(areaId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        area_id: areaId
      };
      
      console.log('Delete area payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete area error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete area'
      };
    }
  }

  /**
   * Get areas by city
   */
  async getAreasByCity(cityId: string, companyId: string): Promise<Area[]> {
    try {
      const response = await this.getAreas(companyId, cityId);
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Search areas by name
   */
  async searchAreas(searchTerm: string, companyId: string): Promise<Area[]> {
    try {
      const response = await this.getAreas(companyId);
      if (response.status === 'success' && response.data) {
        return response.data.filter(
          area => area.area_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const areaService = new AreaService();