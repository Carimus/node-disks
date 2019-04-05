import { CodedError } from './CodedError';

/**
 * Indicates the path did not resolve to a file as expected.
 */
export class NotAFileError extends CodedError {
    protected path: string | null;

    public constructor(path: string | null = null) {
        super('NotAFileError', `Not a file: ${path || '(not specified)'}`);
        Object.setPrototypeOf(this, NotAFileError.prototype);
        this.path = path;
    }
}
