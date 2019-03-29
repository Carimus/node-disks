/**
 * Indicates the path did not resolve to a file as expected.
 */
export class NotAFileError extends Error {
    protected path: string | null;

    public constructor(path: string | null = null) {
        super(`Not a file: ${path || '(not specified)'}`);
        this.path = path;
    }
}
