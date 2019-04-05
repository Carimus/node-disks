export class CodedError extends Error {
    public code: string;

    public constructor(code: string, message: string = '') {
        super(message);
        Object.setPrototypeOf(this, CodedError.prototype);
        this.code = code;
        this.name = code;
    }

    /**
     * Get the error code for this error.
     */
    public getCode(): string {
        return this.code;
    }
}
