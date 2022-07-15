class ErrorResponse extends Error{

    public message: any;
    public statusCode: number = 0;
    public errors: Array<string> | Array<number> | Array<any> = [];
    public errorStack: any;

    constructor(message: any, statusCode: number, errors: Array<string> | Array<number> | Array<any>){
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.errorStack = this.stack;
    }

}

export default ErrorResponse;