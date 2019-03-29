/**
 * Indicates an object was not found at the specified path.
 */
export class NotFoundError extends Error {
    protected path: string | null;

    public constructor(path: string | null = null) {
        super(`File or directory not found: ${path || '(not specified)'}`);
        this.path = path;
    }
}
