import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r.message as string) || message;
        if (Array.isArray(r.message)) {
          errors = r.message as string[];
          message = 'Validation failed';
        }
      }
    }

    response.status(status).json({
      success: false,
      message,
      code: exception instanceof HttpException ? 'HTTP_ERROR' : 'INTERNAL_ERROR',
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
