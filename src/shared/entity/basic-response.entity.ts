export interface BasicHTTPResponse<T = unknown> {
    status: "success" | "error" | "idle";
    statusCode?: number;
    message: string;
    data?: T;
  }