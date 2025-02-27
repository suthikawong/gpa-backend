import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus: number, error: string, message: string;
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const res = exception.getResponse() as {
        statusCode: number;
        message: string;
        error: string;
      };
      error = res.error ?? res.message;
      message = res.message;
    } else {
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error';
      message = error;
    }

    const responseBody = {
      status: httpStatus,
      error: error,
      message: message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
