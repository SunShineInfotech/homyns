// src/services/package.service.ts
import { BaseService, ApiResponse, apiClient } from './api.config';

export interface Package {
  package_id?: string;
  company_id?: string;
  package_name: string;
  details?: string;
  completion_days?: number;
  rooms?: string; // Comma-separated room_ids
  room_names?: string[]; // For display
  created_by?: string;
  created_by_name?: string;
  status?: string;
  is_deleted?: string;
  c_date?: string;
}

export class PackageService extends BaseService {
  constructor() {
    super('package.php');
  }

  /**
   * Fetch all packages for a company
   */
  async getPackages(companyId: string): Promise<ApiResponse<Package[]>> {
    try {
      const response = await this.post<ApiResponse<Package[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get packages error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch packages',
        data: []
      };
    }
  }

  /**
   * Add a new package
   */
  async addPackage(data: Partial<Package>): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        package_name: data.package_name,
        details: data.details || '',
        completion_days: data.completion_days || 0,
        rooms: data.rooms || '',
        created_by: data.created_by || '',
        status: data.status || 'Active'
      };
      
      console.log('Adding package payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add package error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add package'
      };
    }
  }

  /**
   * Update an existing package
   */
  async updatePackage(data: Partial<Package>): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        package_id: data.package_id,
        package_name: data.package_name,
        details: data.details || '',
        completion_days: data.completion_days || 0,
        rooms: data.rooms || '',
        status: data.status || 'Active'
      };
      
      console.log('Update package payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update package error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update package'
      };
    }
  }

  /**
   * Delete a package (soft delete)
   */
  async deletePackage(packageId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        package_id: packageId
      };
      
      console.log('Delete package payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete package error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete package'
      };
    }
  }
}

// Export singleton instance
export const packageService = new PackageService();