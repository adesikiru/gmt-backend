export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: string[];
}

export function successResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { success: true, data, message };
}

export function errorResponse(message: string, code?: string, errors?: string[]): ApiResponse {
  return { success: false, message, code, errors };
}
