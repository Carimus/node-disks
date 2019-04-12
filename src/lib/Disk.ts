import * as stream from 'stream';
import * as fs from 'fs';
import { DiskConfig, DiskListingObject, DiskObjectType } from './types';
import { pipeStreams, withTempFile } from './utils';
import joinUrl = require('url-join');

/**
 * All available disk object types.
 */
export const DISK_OBJECT_TYPES: DiskObjectType[] = [
    DiskObjectType.File,
    DiskObjectType.Directory,
];

/**
 * Represents a disk that can store things in a model similar to a standard
 * unix filesystem.
 */
export abstract class Disk {
    /**
     * The separator used regardless of runtime OS for paths on the disk. Will
     * be automatically handled and converted to the proper separator when
     * resolving legit paths on the filesystem thanks to `path.resolve`
     *
     * @see path.resolve
     * @see path.sep
     */
    public static SEP: string = '/';

    /**
     * Sanitize a path to an item on the disk by treating all paths (absolute or relative) as
     * paths relative to the root of the disk (whatever that means to the driver).
     *
     * @param {string|*} pathOnDisk
     */
    public static sanitizePathOnDisk(
        pathOnDisk: string | null | undefined,
    ): string {
        return pathOnDisk
            ? `${pathOnDisk}`.trim().replace(new RegExp(`^${Disk.SEP}`), '')
            : '';
    }

    /**
     * The configuration for the disk.
     */
    protected config: DiskConfig;

    /**
     * The optional name of the disk for organizational use.
     */
    protected name: string | null;

    /**
     * @param config The disk's configuration.
     * @param name The optional name of the disk for organizational use.
     */
    protected constructor(config: DiskConfig = {}, name?: string) {
        this.config = config;
        this.name = name || null;
    }

    /**
     * Get the default disk URL. By default `null` meaning the disk doesn't support generating urls.
     */
    public getDefaultDiskUrl(): string | null {
        return this.config.url || null;
    }

    /**
     * Get the number of seconds in which a temporary URL should expire by default based on the config.
     */
    protected getDefaultTemporaryUrlExpires(): number {
        return this.config.temporaryUrlExpires || 86400;
    }

    /**
     * Determine whether or not a temporary URL should fallback to a non temporary URL by default based on the config.
     */
    protected shouldTemporaryUrlsFallbackByDefault(): boolean {
        return typeof this.config.temporaryUrlFallback === 'undefined' ||
            this.config.temporaryUrlFallback === null
            ? false
            : !!(this.config.temporaryUrlFallback as any);
    }

    /**
     * Get the optional name of the disk.
     */
    public getName(): string | null {
        return this.name;
    }

    /**
     * Read a file from the disk into memory in a Buffer.
     *
     * @param path
     * @throws NotFoundError if the path does not exist on the disk.
     * @throws NotAFileError if the path does exist on the disk but points to a non-file, e.g. a
     *      directory.
     */
    abstract async read(path: string): Promise<Buffer>;

    /**
     * Obtain a readable stream for a file on the disk.
     *
     * @param path
     * @throws NotFoundError if the path does not exist on the disk.
     * @throws NotAFileError if the path does exist on the disk but points to a non-file, e.g. a
     *      directory.
     */
    abstract async createReadStream(path: string): Promise<stream.Readable>;

    /**
     * Write to a path on the disk.
     *
     * @param path
     * @param body The file data to write to the provided path. Can
     *      be a readable stream which will be uploaded to the destination in its entirety.
     * @throws NotWritableDestinationError if the path points to a destination that is not
     *      writable, i.e. a directory.
     */
    abstract async write(
        path: string,
        body: string | Buffer | stream.Readable,
    ): Promise<void>;

    /**
     * Obtain a writable stream for a file on the disk.
     *
     * @param path
     * @throws NotWritableDestinationError if the path points to a destination that is not
     *      writable, i.e. a directory.
     */
    abstract async createWriteStream(path: string): Promise<stream.Writable>;

    /**
     * Delete a file on the disk.
     *
     * @param path
     */
    abstract async delete(path: string): Promise<void>;

    /**
     * List the files and directories in a specific directory on the disk (or the root if not
     * specified).
     *
     * @param pathToDirectory The directory to list out relative to the root. Don't  specify to list the root contents.
     * @return An array of objects that specify the name and type of all the objects in the specified directory.
     * @throws NotFoundError if the indicated path doesn't exist on the disk.
     * @throws NotADirectoryError if the indicated path exists on the disk but is not a directory.
     */
    abstract async list(
        pathToDirectory: string | null,
    ): Promise<DiskListingObject[]>;

    /**
     * Get a URL to a file on the disk if the disk supports it, otherwise return null.
     *
     * Default behaviour is to simply concatenate the path of the file on the disk to the `url` config option.
     *
     * @param path
     */
    public getUrl(path: string): string | null {
        const diskUrl = this.getDefaultDiskUrl();
        return diskUrl ? joinUrl(diskUrl, path) : null;
    }

    /**
     * Get an indirect temporary URL for a file on the disk if the disk supports it, optionally falling back to
     * generating a non-temporary URL.
     *
     * Default behaviour is to fallback if possible, i.e. assuming the disk doesn't support temporary URLs. If the
     * disk does, it should override this method.
     *
     * @see isTemporaryUrlValid which is used to determine if a temporary URL returned by the disk is valid (unexpired)
     *
     * @param path
     * @param expires The number of seconds that the URL should expire in. Defaults to the config value.
     * @param fallback Whether or not its safe to fall back to a permanent URL if the disk doesn't support temporary
     *      URLs. Defaults to the config value.
     */
    public getTemporaryUrl(
        path: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        expires: number = this.getDefaultTemporaryUrlExpires(),
        fallback: boolean = this.shouldTemporaryUrlsFallbackByDefault(),
    ): string | null {
        return fallback ? this.getUrl(path) : null;
    }

    /**
     * Determine if a temporary URL generated with `getTemporaryUrl` is still valid (i.e. unexpired) at the time
     * the function is called (by default)
     *
     * Will return null if the disk is unable to tell (i.e. doesn't support temporary URLs). If this method explicitly
     * returns `true` the URL should be considered valid at this moment in time.
     *
     * Default behaviour is to return null (indeterminate)
     *
     * @see getTemporaryUrl
     *
     * @param temporaryUrl The temporary url generated by `getTemporaryUrl` to check
     * @param against The current unix epoch time (in milliseconds) or a Date instance to check validity again.
     *      Defaults to the moment the function is called.
     */
    public isTemporaryUrlValid(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        temporaryUrl: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        against: number | Date = Date.now(),
    ): boolean | null {
        return null;
    }

    /**
     * Download the file to the local disk as a temporary file for operations that require local data manipulation
     * and which can't handle Buffers, i.e. operations expected to be performed on large files where it's easier to
     * deal with the data in chunks off of the disk or something instead of keeping them in a Buffer in memory in their
     * entirety.
     *
     * This methods streams the data directly to the local filesystem so large files shouldn't cause any memory issues.
     *
     * If an `execute` callback is not provided, the cleanup step will be skipped and the path that this resolves to
     * will exist and can be manipulated directly. IMPORTANT: in such a scenario, the caller is responsible for
     * deleting the file when they're done with it.
     *
     * @param path
     * @param execute
     * @param extraOptions
     */
    public async withTempFile(
        path: string,
        execute: ((path: string) => Promise<void> | void) | null = null,
        extraOptions?: import('tmp').FileOptions,
    ): Promise<string> {
        // Create a temp file, write the disk file's data to it, and pass its path to
        return withTempFile(
            async (tmpFilePath: string) => {
                // Create a write stream to the temp file that will auto close once the stream is fully piped.
                const tempFileWriteStream = fs.createWriteStream(tmpFilePath, {
                    autoClose: true,
                });
                // Create a read stream for the file on the disk.
                const diskFileReadStream = await this.createReadStream(path);
                // Pipe the disk read stream to the temp file write stream.
                await pipeStreams(diskFileReadStream, tempFileWriteStream);
                // Run the caller callback if it was provided.
                if (execute) {
                    await execute(tmpFilePath);
                }
            },
            // Skip clean up if no execute callback is provided.
            !execute,
            extraOptions,
        );
    }
}
