// src/services/company.service.ts
import { BaseService, ApiResponse, apiClient } from './api.config';

export interface Company {
  company_id?: string;
  company_name: string;
  owner_name?: string;
  owner_emp_id?: string;
  owner_employee_code?: string;
  employee_number?: string;
  company_code: string;
  address?: string;
  phone?: string;
  phone2?: string;
  whatsapp_number?: string;
  email?: string;
  gst_number?: string;
  logo?: string;
  website?: string;  // ← Added website field
  text_color?: string;
  background_color?: string;
  company_expiry_date?: string;
  is_deleted?: string;
  c_date?: string;
}

export class CompanyService extends BaseService {
  constructor() {
    super('company.php');
  }

  /**
   * Fetch company details
   */
  async getCompany(companyId: string): Promise<ApiResponse<Company>> {
    try {
      const response = await this.post<ApiResponse<Company>>({
        type: 3,
        company_id: companyId
      });
      
      return response;
    } catch (error: any) {
      console.error('Get company error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch company details',
        data: undefined
      };
    }
  }

  /**
   * Fetch all companies (for admin - company_id = 1)
   */
  async getAllCompanies(): Promise<ApiResponse<Company[]>> {
    try {
      const response = await this.post<ApiResponse<Company[]>>({
        type: 4
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get all companies error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch companies',
        data: []
      };
    }
  }

  /**
   * Add a new company (admin only)
   */
  async addCompany(data: FormData): Promise<ApiResponse> {
    try {
      const response = await this.postFormData<ApiResponse>(data);
      return response;
    } catch (error: any) {
      console.error('Add company error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add company'
      };
    }
  }

  /**
   * Update company details with logo
   */
  async updateCompany(data: FormData): Promise<ApiResponse> {
    try {
      const response = await this.postFormData<ApiResponse>(data);
      return response;
    } catch (error: any) {
      console.error('Update company error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update company'
      };
    }
  }

  /**
   * Delete a company (soft delete - admin only)
   */
  async deleteCompany(companyId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 5,
        company_id: companyId
      };
      
      console.log('Delete company payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete company error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete company'
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
export const companyService = new CompanyService();
