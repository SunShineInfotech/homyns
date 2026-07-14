// src/services/lead-status.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface LeadStatus {
  status_id?: string;
  company_id?: string;
  status_name: string;
  font_color?: string;
  background_color?: string;
  is_deleted?: string;
  c_date?: string;
}

export class LeadStatusService extends BaseService {
  constructor() {
    super('lead-status.php');
  }

  /**
   * Fetch all lead statuses for a company
   */
  async getLeadStatuses(companyId: string): Promise<ApiResponse<LeadStatus[]>> {
    try {
      const response = await this.post<ApiResponse<LeadStatus[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get lead statuses error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch lead statuses',
        data: []
      };
    }
  }

  /**
   * Add a new lead status with colors
   */
  async addLeadStatus(data: { 
    company_id: string; 
    status_name: string;
    font_color?: string;
    background_color?: string;
  }): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        status_name: data.status_name,
        font_color: data.font_color || '#ffffff',
        background_color: data.background_color || '#6b7280'
      };
      
      console.log('Adding lead status payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add lead status error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add lead status'
      };
    }
  }

  /**
   * Update an existing lead status with colors
   */
  async updateLeadStatus(data: { 
    status_id: string; 
    status_name: string;
    font_color?: string;
    background_color?: string;
  }): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        status_id: data.status_id,
        status_name: data.status_name,
        font_color: data.font_color || '#ffffff',
        background_color: data.background_color || '#6b7280'
      };
      
      console.log('Update lead status payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update lead status error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update lead status'
      };
    }
  }

  /**
   * Delete a lead status (soft delete)
   */
  async deleteLeadStatus(statusId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        status_id: statusId
      };
      
      console.log('Delete lead status payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete lead status error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete lead status'
      };
    }
  }
}

// Export singleton instance
export const leadStatusService = new LeadStatusService();