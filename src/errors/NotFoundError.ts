import { CodedError } from './CodedError';

/**
 * Indicates an object was not found at the specified path.
 */
export class NotFoundError extends CodedError {
    protected path: string | null;

    public constructor(path: string | null = null) {
        super(
            'NotFoundError',
            `File or directory not found: ${path || '(not specified)'}`,
        );
        Object.setPrototypeOf(this, NotFoundError.prototype);
        this.path = path;
    }
}
