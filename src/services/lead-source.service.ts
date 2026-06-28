// src/services/lead-source.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface LeadSource {
  source_id?: string;
  company_id?: string;
  source_name: string;
  is_deleted?: string;
  c_date?: string;
}

export class LeadSourceService extends BaseService {
  constructor() {
    super('lead-source.php');
  }

  /**
   * Fetch all lead sources for a company
   */
  async getLeadSources(companyId: string): Promise<ApiResponse<LeadSource[]>> {
    try {
      const response = await this.post<ApiResponse<LeadSource[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get lead sources error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch lead sources',
        data: []
      };
    }
  }

  /**
   * Add a new lead source
   */
  async addLeadSource(data: { company_id: string; source_name: string }): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        source_name: data.source_name
      };
      
      console.log('Adding lead source payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add lead source error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add lead source'
      };
    }
  }

  /**
   * Update an existing lead source
   */
  async updateLeadSource(data: { source_id: string; source_name: string }): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        source_id: data.source_id,
        source_name: data.source_name
      };
      
      console.log('Update lead source payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update lead source error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update lead source'
      };
    }
  }

  /**
   * Delete a lead source (soft delete)
   */
  async deleteLeadSource(sourceId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        source_id: sourceId
      };
      
      console.log('Delete lead source payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete lead source error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete lead source'
      };
    }
  }
}

// Export singleton instance
export const leadSourceService = new LeadSourceService();