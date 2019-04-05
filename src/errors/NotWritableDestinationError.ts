import { CodedError } from './CodedError';

/**
 * Indicates the path specified is not writable (i.e. is a directory, etc.)
 */
export class NotWritableDestinationError extends CodedError {
    protected path: string | null;

    public constructor(path: string | null = null) {
        super(
            'NotWritableDestinationError',
            `Not a writable destination (i.e. is a directory, etc.): ${path ||
                '(not specified)'}`,
        );
        Object.setPrototypeOf(this, NotWritableDestinationError.prototype);
        this.path = path;
    }
}
