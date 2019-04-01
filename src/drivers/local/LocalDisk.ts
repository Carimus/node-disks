import * as path from 'path';
import * as fs from 'fs';
import { LocalDiskConfig } from './types';
import { FSDisk } from '../../lib/fs/FSDisk';
import { FSModule } from '../../lib/fs/types';

/**
 * Used to cache the calculated root path without conflicts.
 */
export const rootPathCacheKey: unique symbol = Symbol(
    'localDiskCachedRootPath',
);

/**
 * Represents a local filesystem to be used as a disk.
 *
 * This implementation is OS-independent and always takes posix-like absolute and relative paths
 * in all of its public method arguments to refer to directories and files on the disk.
 *
 * The only OS-dependent care that needs to be taken is in the `root` config option which must be
 * a path in the form that the OS expects (i.e. using backslashes and drive letters on windows).
 */
export class LocalDisk extends FSDisk {
    /**
     * The cached calculated root path.
     */
    private [rootPathCacheKey]: string | undefined;

    /**
     * @inheritDoc
     */
    protected config!: LocalDiskConfig;

    /**
     * Use the built-in node `fs` module for the local disk
     */
    protected getFSModule(): FSModule {
        return fs;
    }

    /**
     * Get the absolute root path on the local filesystem based on the `root` config option.
     *
     * Note that this expects the `root` option in the config to be accurate to the local
     * filesystem's OS. For example if you specify `'/foo/bar'` as the `root` config option,
     * the absolute root used on POSIX (mac and linux) systems will be `/foo/bar` but on windows
     * systems will be (`<cwd>/foo/bar`) since absolute paths on windows must start with the drive
     * letter, a colon, and a backslash.
     *
     * @see path.isAbsolute
     * @see https://nodejs.org/docs/latest/api/path.html#path_windows_vs_posix
     */
    public getRootPath(): string {
        /*
         * We memoize essentially by caching the calculated root path on the class instance.
         * This assumes the config of the instance never changes.
         */
        if (typeof this[rootPathCacheKey] !== 'string') {
            const { root: rawRoot = null } = this.config;
            if (rawRoot) {
                const root = `${rawRoot}`.trim().replace(/[/\\]*$/, '');
                // `path.resolve` automatically resolve non-absolute paths from the CWD.
                this[rootPathCacheKey] = path.resolve(root);
            } else {
                // If not root was provided we use the server process current working directory.
                this[rootPathCacheKey] = path.resolve('.');
            }
        }

        return this[rootPathCacheKey] as string;
    }
}
