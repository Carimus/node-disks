/**
 * Indicates the path specified is not writable (i.e. is a directory, etc.)
 */
export class NotWritableDestinationError extends Error {
    protected path: string | null;

    public constructor(path: string | null = null) {
        super(
            `Not a writable destination (i.e. is a directory, etc.): ${path ||
                '(not specified)'}`,
        );
        this.path = path;
    }
}
