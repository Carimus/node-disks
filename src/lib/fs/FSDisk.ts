import * as path from 'path';
import { Dirent, Stats } from 'fs';
import { Readable, Writable } from 'stream';
import { promisify } from 'util';
import { Disk } from '../Disk';
import {
    NotADirectoryError,
    NotAFileError,
    NotFoundError,
    NotWritableDestinationError,
} from '../../errors';
import { DiskConfig, DiskListingObject, DiskObjectType } from '../types';
import { FSModule } from './types';

/**
 * Represents a disk that uses a traditional filesystem. Expects an `fs` module to be provided that implements
 * node's `fs` module's API. In practice this either _is_ the node `fs` module or it's the `memfs`' `fs` module.
 *
 * Will ignore any filesystem entities that are not directories, files, or symbolic links. Symbolic
 * links will be resolved and if they don't resolve to a file or directory will also be ignored;
 * otherwise, they're left in place as is so they can be read, written to, or navigated through.
 */
export abstract class FSDisk extends Disk {
    /**
     * The fs module implementation to use.
     */
    protected fs: FSModule;

    protected writeFile: (path: string, body: Buffer) => Promise<void>;

    protected readFile: (path: string) => Promise<Buffer>;

    protected readDir: (path: string) => Promise<Dirent[]>;

    protected stat: (path: string) => Promise<Stats>;

    protected unlink: (path: string) => Promise<void>;

    public constructor(config: DiskConfig) {
        super(config);
        // Set the fs module to use internally
        this.fs = this.getFSModule();
        // Promisify the fs module methods that don't return promises or streams
        this.writeFile = promisify(this.fs.writeFile);
        this.readFile = promisify(this.fs.readFile);
        const readdir = promisify(this.fs.readdir);
        // Our copy of readdir -> readDir will automatically use Node 10.10+ withFileTypes.
        this.readDir = (path: string): Promise<Dirent[]> => {
            return readdir(path, {
                withFileTypes: true,
            });
        };
        this.stat = promisify(this.fs.stat);
        this.unlink = promisify(this.fs.unlink);
    }

    /**
     * Should return the FS module to use. Must implement the same public API as the node `fs` module.
     */
    protected abstract getFSModule(): FSModule;

    /**
     * Get the absolute root path on the filesystem. By default this is literally the root of the filesystem.
     */
    public abstract getRootPath(): string;

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
    public async createReadStream(pathOnDisk: string): Promise<Readable> {
        const fullPath = this.getFullPath(pathOnDisk);
        // We stat first because createReadStream will create a file if it doesn't already exist.
        let stats = null;
        try {
            stats = await this.stat(fullPath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new NotFoundError(pathOnDisk);
            } else if (error.code === 'EISDIR') {
                throw new NotAFileError(pathOnDisk);
            }
            throw error;
        }
        if (stats.isFile()) {
            return this.fs.createReadStream(fullPath);
        }
        throw new NotAFileError(pathOnDisk);
    }

    /**
     * @inheritDoc
     */
    public async createWriteStream(pathOnDisk: string): Promise<Writable> {
        const fullPath = this.getFullPath(pathOnDisk);
        let stats = null;
        try {
            stats = await this.stat(fullPath);
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
            return this.fs.createWriteStream(fullPath);
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
            return await this.readFile(this.getFullPath(pathOnDisk));
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
            return await this.writeFile(this.getFullPath(pathOnDisk), body);
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
    public async delete(path: string): Promise<void> {
        try {
            await this.unlink(path);
        } catch (error) {
            if (error.code === 'EISDIR' || error.code === 'EPERM') {
                throw new NotAFileError(path);
            } else if (error.code === 'ENOENT') {
                throw new NotFoundError(path);
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
            directoryEntities = await this.readDir(fullPath);
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
                async (entity: Dirent): Promise<DiskListingObject | null> => {
                    if (entity.isSymbolicLink()) {
                        try {
                            const linkStats: Stats = await this.stat(
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
