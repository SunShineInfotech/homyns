// src/services/project-type.service.ts
import { BaseService, ApiResponse } from './api.config';

export interface ProjectType {
    project_type_id?: string;
    company_id?: string;
    project_type_name: string;
    is_deleted?: string;
    c_date?: string;
}

export class ProjectTypeService extends BaseService {
    constructor() {
        super('project-type.php');
    }

    /**
     * Fetch all project types for a company
     */
    async getProjectTypes(companyId: string): Promise<ApiResponse<ProjectType[]>> {
        try {
            const response = await this.post<ApiResponse<ProjectType[]>>({
                type: 3,
                company_id: companyId
            });

            if (response.status === 'success' && !response.data) {
                response.data = [];
            }

            return response;
        } catch (error: any) {
            console.error('Get project types error:', error);
            return {
                status: 'error',
                message: error.response?.data?.message || 'Failed to fetch project types',
                data: []
            };
        }
    }

    /**
     * Add a new project type
     */
    async addProjectType(data: { company_id: string; project_type_name: string }): Promise<ApiResponse> {
        try {
            const payload = {
                type: 1,
                company_id: data.company_id,
                project_type_name: data.project_type_name
            };

            console.log('Adding project type payload:', payload);

            const response = await this.post<ApiResponse>(payload);
            return response;
        } catch (error: any) {
            console.error('Add project type error:', error);
            return {
                status: 'error',
                message: error.response?.data?.message || 'Failed to add project type'
            };
        }
    }

    /**
     * Update an existing project type
     */
    async updateProjectType(data: { project_type_id: string; project_type_name: string }): Promise<ApiResponse> {
        try {
            const payload = {
                type: 2,
                project_type_id: data.project_type_id,
                project_type_name: data.project_type_name
            };

            console.log('Update project type payload:', payload);

            const response = await this.post<ApiResponse>(payload);
            return response;
        } catch (error: any) {
            console.error('Update project type error:', error);
            return {
                status: 'error',
                message: error.response?.data?.message || 'Failed to update project type'
            };
        }
    }

    /**
     * Delete a project type (soft delete)
     */
    async deleteProjectType(projectTypeId: string): Promise<ApiResponse> {
        try {
            const payload = {
                type: 4,
                project_type_id: projectTypeId
            };

            console.log('Delete project type payload:', payload);

            const response = await this.post<ApiResponse>(payload);
            return response;
        } catch (error: any) {
            console.error('Delete project type error:', error);
            return {
                status: 'error',
                message: error.response?.data?.message || 'Failed to delete project type'
            };
        }
    }
}

export const projectTypeService = new ProjectTypeService();