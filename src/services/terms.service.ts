// src/services/terms.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface Terms {
  terms_id?: string;
  company_id?: string;
  title: string;
  content?: string;
  sort_order?: number;
  is_deleted?: string;
  c_date?: string;
}

export class TermsService extends BaseService {
  constructor() {
    super('terms.php');
  }

  /**
   * Fetch all terms for a company
   */
  async getTerms(companyId: string): Promise<ApiResponse<Terms[]>> {
    try {
      const response = await this.post<ApiResponse<Terms[]>>({
        type: 3,
        company_id: companyId
      });
      
      if (response.status === 'success' && !response.data) {
        response.data = [];
      }
      
      return response;
    } catch (error: any) {
      console.error('Get terms error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to fetch terms',
        data: []
      };
    }
  }

  /**
   * Add a new term
   */
  async addTerm(data: Partial<Terms>): Promise<ApiResponse> {
    try {
      const payload = {
        type: 1,
        company_id: data.company_id,
        title: data.title,
        content: data.content || '',
        sort_order: data.sort_order || 0
      };
      
      console.log('Adding term payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Add term error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to add term'
      };
    }
  }

  /**
   * Update an existing term
   */
  async updateTerm(data: Terms): Promise<ApiResponse> {
    try {
      const payload = {
        type: 2,
        terms_id: data.terms_id,
        title: data.title,
        content: data.content || '',
        sort_order: data.sort_order || 0
      };
      
      console.log('Update term payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Update term error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to update term'
      };
    }
  }

  /**
   * Delete a term (soft delete)
   */
  async deleteTerm(termsId: string): Promise<ApiResponse> {
    try {
      const payload = {
        type: 4,
        terms_id: termsId
      };
      
      console.log('Delete term payload:', payload);
      
      const response = await this.post<ApiResponse>(payload);
      return response;
    } catch (error: any) {
      console.error('Delete term error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete term'
      };
    }
  }

  /**
   * Search terms by title
   */
  async searchTerms(searchTerm: string, companyId: string): Promise<Terms[]> {
    try {
      const response = await this.getTerms(companyId);
      if (response.status === 'success' && response.data) {
        return response.data.filter(
          term => term.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const termsService = new TermsService();