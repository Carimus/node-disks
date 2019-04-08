import * as path from 'path';
import { Stats } from 'fs';
import { Readable, Writable } from 'stream';
import { Disk } from '../Disk';
import {
    NotADirectoryError,
    NotAFileError,
    NotFoundError,
    NotWritableDestinationError,
} from '../../errors';
import { DiskConfig, DiskListingObject, DiskObjectType } from '../types';
import { AsyncFSModule } from './types';
import { pipeStreams } from '../utils';

/**
 * Represents a disk that uses a traditional filesystem. Expects an `AsyncFSModule` which is essentially just
 * a subset `fs` core functions but simplified and promisified.
 *
 * Will ignore any filesystem entities that are not directories, files, or symbolic links. Symbolic
 * links will be resolved and if they don't resolve to a file or directory will also be ignored;
 * otherwise, they're left in place as is so they can be read, written to, or navigated through.
 */
export abstract class FSDisk extends Disk {
    /**
     * The async fs module implementation to use which includes the already promisified fs methods.
     */
    protected fs: AsyncFSModule;

    public constructor(config: DiskConfig) {
        super(config);
        // Set the fs module to use internally
        this.fs = this.getAsyncFsModule();
    }

    /**
     * Should return the FS module to use. Must implement the same public API as the node `fs` module.
     */
    protected abstract getAsyncFsModule(): AsyncFSModule;

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
    public async read(pathOnDisk: string): Promise<Buffer> {
        try {
            return await this.fs.readFile(this.getFullPath(pathOnDisk));
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
    public async createReadStream(pathOnDisk: string): Promise<Readable> {
        const fullPath = this.getFullPath(pathOnDisk);
        // We stat first because createReadStream will create a file if it doesn't already exist.
        let stats = null;
        try {
            stats = await this.fs.stat(fullPath);
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
     * Perform a write operation which involves some prep (creating the leading directory) and the transformation of
     * certain "expected" errors into more understandable errors for the consumer of the library.
     *
     * @param pathOnDisk
     * @param execute
     */
    private async prepareAndExecuteWrite<T>(
        pathOnDisk: string,
        execute: (fullPath: string) => Promise<T>,
    ): Promise<T> {
        const fullPath = this.getFullPath(pathOnDisk);
        try {
            // Ensure the path leading up to the file exists as a directory.
            await this.fs.mkdirp(path.dirname(fullPath));
        } catch (error) {
            // EEXIST is what node `fs` and `fs-extra` will throw if the leading path exists as a non-directory.
            // ENOTDIR is what `memfs` throws if the leading path exists as a non-directory.
            // Both of these will catch trying to write to `/foo/bar.txt` where `/foo` is a file.
            if (error.code === 'EEXIST' || error.code === 'ENOTDIR') {
                throw new NotWritableDestinationError(pathOnDisk);
            }
            throw error;
        }
        try {
            // Execute the write, capturing and wrapping important errors as necessary.
            return await execute(fullPath);
        } catch (error) {
            if (error.code === 'EISDIR' || error.code === 'EACCES') {
                throw new NotWritableDestinationError(pathOnDisk);
            }
            throw error;
        }
    }

    /**
     * @inheritDoc
     */
    public async write(
        pathOnDisk: string,
        body: Buffer | string | Readable,
    ): Promise<void> {
        return this.prepareAndExecuteWrite(
            pathOnDisk,
            async (fullPath: string): Promise<void> => {
                if (typeof body === 'object' && body instanceof Readable) {
                    // If we were provided with a stream, we'll open up a stream and pipe to it.
                    const writeStream = await this.fs.createWriteStream(
                        fullPath,
                    );
                    await pipeStreams(body, writeStream);
                } else {
                    // Otherwise we have a string or a buffer so we can just write the contents using writeFile
                    await this.fs.writeFile(fullPath, body);
                }
            },
        );
    }

    /**
     * Create a write stream to a file on the disk. Note that errors like EISDIR aren't thrown by the createWriteStream
     * function and instead are emitted as errors on the stream so those will be raw unwrapped errors.
     * @inheritDoc
     */
    public async createWriteStream(pathOnDisk: string): Promise<Writable> {
        return this.prepareAndExecuteWrite(
            pathOnDisk,
            async (fullPath: string): Promise<Writable> => {
                return this.fs.createWriteStream(fullPath);
            },
        );
    }

    /**
     * @inheritDoc
     */
    public async delete(path: string): Promise<void> {
        const fullPath = this.getFullPath(path);
        try {
            await this.fs.unlink(fullPath);
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

        let directoryFilenames = null;
        try {
            // Get a full directory listing
            directoryFilenames = await this.fs.readdir(fullPath);
        } catch (error) {
            if (error.code === 'ENOTDIR') {
                throw new NotADirectoryError(pathToDirectoryOnDisk);
            } else if (error.code === 'ENOENT') {
                throw new NotFoundError(pathToDirectoryOnDisk);
            }
            throw error;
        }

        // Resolve the filenames in the listing down to stats about each file.
        const pendingListings: ([
            string,
            Promise<Stats>
        ])[] = directoryFilenames.reduce(
            (promises: ([string, Promise<Stats>])[], filename: string) => {
                try {
                    promises.push([
                        filename,
                        this.fs.stat(path.resolve(fullPath, filename)),
                    ]);
                } catch (error) {
                    if (error.code !== 'ENOENT') {
                        // We simply exclude unresolvable symlinks from the listing.
                        throw error;
                    }
                }
                return promises;
            },
            [],
        );

        /*
         * We loop through all of the directory listings and replace all of the listing with
         * objects that indicate name and type as long as the listing is a file or directory or
         * a symlink that resolves to a file or directory. Non files/directories we replace with
         * null and just skip over them when we reduce this later. Note also the we append the
         * directory separator onto the end of directories as is the `Disk` standard.
         */
        const rawListings: (DiskListingObject | null)[] = await Promise.all(
            pendingListings.map(
                async (
                    pendingListing: [string, Promise<Stats>],
                ): Promise<DiskListingObject | null> => {
                    const [name, fileStatsPromise] = pendingListing;
                    const stats: Stats = await fileStatsPromise;

                    if (stats.isDirectory()) {
                        return {
                            type: DiskObjectType.Directory,
                            name: `${name}${Disk.SEP}`,
                        };
                    } else if (stats.isFile()) {
                        return {
                            type: DiskObjectType.File,
                            name,
                        };
                    }

                    return null;
                },
            ),
        );

        // Next we separate out files from directories so that we can list directories first
        const { directories = [], files = [] } = rawListings.reduce(
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
