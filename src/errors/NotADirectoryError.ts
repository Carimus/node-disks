/**
 * Indicates the path did not resolve to a directory as expected.
 */
export class NotADirectoryError extends Error {
    protected path: string | null;

    public constructor(path: string | null = null) {
        super(`Not a directory: ${path || '(not specified)'}`);
        this.path = path;
    }
}
