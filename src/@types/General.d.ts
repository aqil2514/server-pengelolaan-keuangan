
export interface ErrorResponse{
    message: string;
}

export interface ErrorValidationResponse extends ErrorResponse{
    notifMessage: string;
    path: string;
}

export interface HttpResponse{
    data: null | any,
    error: null | any,
    message: string
}