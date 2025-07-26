export interface AppResponse<T> {
  data: T;
  total?: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  status: number;
}
