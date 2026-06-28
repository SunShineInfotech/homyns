// src/services/employee.service.ts
import { BaseService, ApiResponse, apiClient } from './api.config';

export interface Employee {
  emp_id?: string;
  company_id?: string;
  login_code: string;
  password?: string;
  name: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  gender?: string;
  aadhar_card?: string;
  pan_card?: string;
  address?: string;
  joining_date?: string;
  birth_date?: string;
  profile_image?: string;
  access_pages?: string; // Comma-separated page names
  access_pages_list?: string[]; // For UI
  otp?: string;
  status?: string;
  is_deleted?: string;
  c_date?: string;
}

export class EmployeeService extends BaseService {
  constructor() {
    super('employee.php');
  }

  /**
   * Fetch all employees for a company
   */
  async getEmployees(companyId: string): Promise<ApiResponse<Employee[]>> {
    try {
      const response = await this.post<ApiResponse<Employee[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get employees error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch employees',
        data: []
      };
    }
  }

  /**
   * Add a new employee with image
   */
  async addEmployee(data: FormData): Promise<ApiResponse> {
    try {
      const response = await this.postFormData<ApiResponse>(data);
      return response;
    } catch (error: any) {
      console.error('Add employee error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add employee'
      };
    }
  }

  /**
   * Update an existing employee with image
   */
  async updateEmployee(data: FormData): Promise<ApiResponse> {
    try {
      const response = await this.postFormData<ApiResponse>(data);
      return response;
    } catch (error: any) {
      console.error('Update employee error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update employee'
      };
    }
  }

  /**
   * Delete an employee (soft delete)
   */
  async deleteEmployee(empId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        emp_id: empId
      };
      
      console.log('Delete employee payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete employee error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete employee'
      };
    }
  }

  /**
   * Change employee password
   */
  async changePassword(empId: string, newPassword: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 5,
        emp_id: empId,
        password: newPassword
      };
      
      console.log('Change password payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Change password error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to change password'
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
export const employeeService = new EmployeeService();