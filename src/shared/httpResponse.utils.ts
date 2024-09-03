import { Injectable } from '@nestjs/common';

@Injectable()
export class MakeHttpRespons {
  success<T = unknown>(message: string, data: T, statusCode: number = 200) {
    return {
      message,
      status: "success",
      data,
      statusCode,
    };
  }
  error<T = unknown>(message: string, data: T, statusCode: number = 400) {
    return {
      message,
      status: "error",
      data,
      statusCode,
    };
  }
}
