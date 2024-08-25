import { Injectable } from '@nestjs/common';

@Injectable()
export class MakeHttpRespons {
  success(message: string, data: unknown, statusCode: number = 200) {
    return {
      message,
      status: "success",
      data,
      statusCode,
    };
  }
  error(message: string, data: unknown, statusCode: number = 400) {
    return {
      message,
      status: "error",
      data,
      statusCode,
    };
  }
}
