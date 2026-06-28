// src/services/customer.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface Customer {
  client_id?: string;
  company_id?: string;
  client_name: string;
  client_email?: string; // ADDED
  gender?: string;
  phone1?: string;
  phone2?: string;
  whatsapp_number?: string;
  address?: string;
  state_id?: string;
  state_name?: string;
  city_id?: string;
  city_name?: string;
  area_id?: string;
  area_name?: string;
  wallet?: number;
  status?: string;
  is_deleted?: string;
  c_date?: string;
}

export class CustomerService extends BaseService {
  constructor() {
    super('customer.php');
  }

  /**
   * Fetch all customers for a company
   */
  async getCustomers(companyId: string): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await this.post<ApiResponse<Customer[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get customers error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch customers',
        data: []
      };
    }
  }

  /**
   * Add a new customer
   */
  async addCustomer(data: Partial<Customer>): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        client_name: data.client_name,
        client_email: data.client_email || '', // ADDED
        gender: data.gender || '',
        phone1: data.phone1 || '',
        phone2: data.phone2 || '',
        whatsapp_number: data.whatsapp_number || '',
        address: data.address || '',
        state_id: data.state_id || '',
        city_id: data.city_id || '',
        area_id: data.area_id || '',
        wallet: data.wallet || 0,
        status: data.status || 'Active'
      };
      
      console.log('Adding customer payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add customer error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add customer'
      };
    }
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(data: Customer): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        client_id: data.client_id,
        client_name: data.client_name,
        client_email: data.client_email || '', // ADDED
        gender: data.gender || '',
        phone1: data.phone1 || '',
        phone2: data.phone2 || '',
        whatsapp_number: data.whatsapp_number || '',
        address: data.address || '',
        state_id: data.state_id || '',
        city_id: data.city_id || '',
        area_id: data.area_id || '',
        wallet: data.wallet || 0,
        status: data.status || 'Active'
      };
      
      console.log('Update customer payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update customer error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update customer'
      };
    }
  }

  /**
   * Delete a customer (soft delete)
   */
  async deleteCustomer(clientId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        client_id: clientId
      };
      
      console.log('Delete customer payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete customer error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete customer'
      };
    }
  }
}

// Export singleton instance
export const customerService = new CustomerService();