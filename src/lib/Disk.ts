import * as stream from 'stream';
import { DiskConfig, DiskListingObject, DiskObjectType } from './types';

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
     * @param config The disk's configuration.
     */
    public constructor(config: DiskConfig) {
        this.config = config;
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
}
