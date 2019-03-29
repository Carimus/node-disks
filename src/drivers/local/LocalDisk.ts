import * as path from 'path';
import * as fs from 'fs';
import * as stream from 'stream';
import { promisify } from 'util';
import { Disk } from '../../Disk';
import {
    NotADirectoryError,
    NotAFileError,
    NotFoundError,
    NotWritableDestinationError,
} from '../../errors';
import { LocalDiskConfig } from './types';
import { DiskListingObject, DiskObjectType } from '../../types';

// Promisify some fs methods that normally take a callback
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readdir);
const stat = promisify(fs.stat);

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
 *
 * Will ignore any filesystem entities that are not directories, files, or symbolic links. Symbolic
 * links will be resolved and if they don't resolve to a file or directory will also be ignored;
 * otherwise, they're left in place as is so they can be read, written to, or navigated through.
 */
export class LocalDisk extends Disk {
    /**
     * The cached calculated root path.
     */
    private [rootPathCacheKey]: string | undefined;

    /**
     * @inheritDoc
     */
    protected config!: LocalDiskConfig;

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
    private getRootPath(): string {
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

    /**
     * Get the absolute path to a file on the local filesystem by resolving it against a theoretical
     * disk root as if the disk were a posix like filesystem and then resolving that absolute path
     * as if it were relative to the disk root. This effectively chroots the callers inside the
     * root specified in the config.
     *
     * Pass in null (default) to get the absolute root path.
     *
     * @param pathOnDisk
     */
    private getFullPath(pathOnDisk: string | null = null): string {
        const rootPath = this.getRootPath();
        if (pathOnDisk) {
            // We use path.posix.resolve since we're treating the virtual paths as posix-y paths.
            const absolutePathOnDisk = path.posix.resolve(Disk.SEP, pathOnDisk);
            /*
             * Now we use the OS-specific path.resolve to resolve that path as an absolute path
             * against the root of the disk.
             */
            return path.resolve(rootPath, `.${absolutePathOnDisk}`);
        }
        return rootPath;
    }

    /**
     * @inheritDoc
     */
    public async createReadStream(
        pathOnDisk: string,
    ): Promise<stream.Readable> {
        const fullPath = this.getFullPath(pathOnDisk);
        // We stat first because createReadStream will create a file if it doesn't already exist.
        let stats = null;
        try {
            stats = await stat(fullPath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new NotFoundError(pathOnDisk);
            } else if (error.code === 'EISDIR') {
                throw new NotAFileError(pathOnDisk);
            }
            throw error;
        }
        if (stats.isFile()) {
            return fs.createReadStream(fullPath);
        }
        throw new NotAFileError(pathOnDisk);
    }

    /**
     * @inheritDoc
     */
    public async createWriteStream(
        pathOnDisk: string,
    ): Promise<stream.Writable> {
        const fullPath = this.getFullPath(pathOnDisk);
        let stats = null;
        try {
            stats = await stat(fullPath);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                // If the file doesn't exists, that's good! Continue. Otherwise throw.
                throw error;
            }
        }
        // If the file exists and it's not a file, fail.
        if (stats && !stats.isFile()) {
            throw new NotWritableDestinationError(pathOnDisk);
        }

        try {
            return fs.createWriteStream(fullPath);
        } catch (error) {
            if (error.code === 'EISDIR') {
                throw new NotWritableDestinationError(pathOnDisk);
            }
            throw error;
        }
    }

    /**
     * @inheritDoc
     */
    public async read(pathOnDisk: string): Promise<Buffer> {
        try {
            return await readFile(this.getFullPath(pathOnDisk));
        } catch (error) {
            if (error.code === 'EISDIR') {
                throw new NotAFileError(pathOnDisk);
            } else if (error.code === 'ENOENT') {
                throw new NotFoundError(pathOnDisk);
            }
            throw error;
        }
    }

    /**
     * @inheritDoc
     */
    public async write(pathOnDisk: string, body: Buffer): Promise<void> {
        try {
            return await writeFile(this.getFullPath(pathOnDisk), body);
        } catch (error) {
            if (error.code === 'EISDIR') {
                throw new NotWritableDestinationError(pathOnDisk);
            }
            throw error;
        }
    }

    /**
     * @inheritDoc
     */
    public async list(
        pathToDirectoryOnDisk: string | null = null,
    ): Promise<DiskListingObject[]> {
        const fullPath = this.getFullPath(pathToDirectoryOnDisk);

        let directoryEntities = null;
        try {
            // Get a full directory listing
            directoryEntities = await readDir(fullPath, {
                withFileTypes: true,
            });
        } catch (error) {
            if (error.code === 'ENOTDIR') {
                throw new NotADirectoryError(pathToDirectoryOnDisk);
            } else if (error.code === 'ENOENT') {
                throw new NotFoundError(pathToDirectoryOnDisk);
            }
            throw error;
        }

        /*
         * We loop through all of the directory listings and replace all of the listing with
         * objects that indicate name and type as long as the listing is a file or directory or
         * a symlink that resolves to a file or directory. Non files/directories we replace with
         * null and just skip over them when we reduce this later. Note also the we append the
         * directory separator onto the end of directories as is the `Disk` standard.
         */
        const rawDirectoryEntitiesOrStats: (DiskListingObject | null)[] = await Promise.all(
            directoryEntities.map(
                async (
                    entity: fs.Dirent,
                ): Promise<DiskListingObject | null> => {
                    if (entity.isSymbolicLink()) {
                        try {
                            const linkStats: fs.Stats = await stat(
                                path.resolve(fullPath, entity.name),
                            );
                            if (linkStats.isFile()) {
                                return {
                                    type: DiskObjectType.File,
                                    name: entity.name,
                                };
                            } else if (linkStats.isDirectory()) {
                                return {
                                    type: DiskObjectType.Directory,
                                    name: `${entity.name}${Disk.SEP}`,
                                };
                            }
                        } catch (error) {
                            if (error.code !== 'ENOENT') {
                                // We simply exclude unresolvable symlinks from the listing.
                                throw error;
                            }
                        }
                    } else if (entity.isDirectory()) {
                        return {
                            type: DiskObjectType.Directory,
                            name: `${entity.name}${Disk.SEP}`,
                        };
                    } else if (entity.isFile()) {
                        return {
                            type: DiskObjectType.Directory,
                            name: entity.name,
                        };
                    }
                    return null;
                },
            ),
        );

        // Next we separate out files from directories so that we can list directories first
        const {
            directories = [],
            files = [],
        } = rawDirectoryEntitiesOrStats.reduce(
            (
                listings: {
                    directories: DiskListingObject[];
                    files: DiskListingObject[];
                },
                listing: DiskListingObject | null,
            ) => {
                if (listing) {
                    const { type = null } = listing;
                    if (type === DiskObjectType.Directory) {
                        listings.directories.push(listing);
                    } else if (type === DiskObjectType.File) {
                        listings.files.push(listing);
                    }
                }

                return listings;
            },
            { directories: [], files: [] },
        );

        return [...directories, ...files];
    }
}
