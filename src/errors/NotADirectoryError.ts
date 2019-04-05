import { CodedError } from './CodedError';

/**
 * Indicates the path did not resolve to a directory as expected.
 */
export class NotADirectoryError extends CodedError {
    protected path: string | null;

    public constructor(path: string | null = null) {
        super(
            'NotADirectoryError',
            `Not a directory: ${path || '(not specified)'}`,
        );
        Object.setPrototypeOf(this, NotADirectoryError.prototype);
        this.path = path;
    }
}
