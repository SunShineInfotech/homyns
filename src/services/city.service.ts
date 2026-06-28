// src/services/city.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface City {
  city_id?: string;
  company_id?: string;
  state_id?: string;
  city_name: string;
  is_deleted?: string;
  c_date?: string;
}

export class CityService extends BaseService {
  constructor() {
    super('city.php');
  }

  /**
   * Fetch all cities for a company
   */
  async getCities(companyId: string, stateId?: string): Promise<ApiResponse<City[]>> {
    try {
      const response = await this.post<ApiResponse<City[]>>({
        type: 3,
        company_id: companyId,
        state_id: stateId || ''
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get cities error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch cities',
        data: []
      };
    }
  }

  /**
   * Add a new city
   */
  async addCity(data: Partial<City>): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        state_id: data.state_id,
        city_name: data.city_name
      };
      
      console.log('Adding city payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add city error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add city'
      };
    }
  }

  /**
   * Update an existing city
   */
  async updateCity(data: City): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        city_id: data.city_id,
        city_name: data.city_name,
        state_id: data.state_id
      };
      
      console.log('Update city payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update city error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update city'
      };
    }
  }

  /**
   * Delete a city (soft delete)
   */
  async deleteCity(cityId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        city_id: cityId
      };
      
      console.log('Delete city payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete city error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete city'
      };
    }
  }

  /**
   * Get cities by state
   */
  async getCitiesByState(stateId: string, companyId: string): Promise<City[]> {
    try {
      const response = await this.getCities(companyId, stateId);
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Search cities by name
   */
  async searchCities(searchTerm: string, companyId: string): Promise<City[]> {
    try {
      const response = await this.getCities(companyId);
      if (response.status === 'success' && response.data) {
        return response.data.filter(
          city => city.city_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const cityService = new CityService();