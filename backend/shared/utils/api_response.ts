export class ApiResponse {
    static success(data: any, statusCode: number = 200) {
      return {
        statusCode,
        body: JSON.stringify({ success: true, data }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
  
    static error(message: string, statusCode: number, details?: any) {
      return {
        statusCode,
        body: JSON.stringify({ success: false, message, details }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
  
    static badRequest(message: string = 'Bad Request', details?: any) {
      return this.error(message, 400, details);
    }
  
    static unauthorized(message: string = 'Unauthorized', details?: any) {
      return this.error(message, 401, details);
    }
  
    static forbidden(message: string = 'Forbidden', details?: any) {
      return this.error(message, 403, details);
    }
  
    static notFound(message: string = 'Not Found', details?: any) {
      return this.error(message, 404, details);
    }
  
    static internalServerError(message: string = 'Internal Server Error', details?: any) {
      return this.error(message, 500, details);
    }
  }
  