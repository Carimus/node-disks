import * as AWS from 'aws-sdk';
import { Readable, Writable } from 'stream';
import { Disk, DiskListingObject, DiskObjectType } from '../..';
import {
    NotAFileError,
    NotFoundError,
    NotWritableDestinationError,
} from '../../errors';
import {
    S3BucketListing,
    S3BucketListingPage,
    S3DiskConfig,
    S3NodeBody,
    S3ObjectParams,
} from './types';
import { streamToBuffer } from '../../lib/utils';

/**
 * Represents a remote AWS S3 disk.
 *
 * Important note: this implementation of an S3 Disk assumes you're using `/` as the delimiter
 * character. I.e. objects that end in `/` are "directories" and all other objects are files. This
 * is the standard used by the S3 management interface and emulates the way a local filesystem
 * works.
 */
export class S3Disk extends Disk {
    /**
     * @inheritDoc
     */
    protected config!: S3DiskConfig;

    /**
     * The s3 client to use for interacting with S3.
     */
    private s3Client: AWS.S3;

    /**
     * Create the disk, optionally using an existing S3 client
     * @param config
     * @param name
     * @param s3Client
     */
    public constructor(config: S3DiskConfig, name?: string, s3Client?: AWS.S3) {
        super(config, name);
        const { clientConfig = {}, bucket = null } = config;
        if (!bucket) {
            throw new Error('Missing config value `bucket` for `s3` disk.');
        }
        this.s3Client = s3Client || new AWS.S3(clientConfig || {});
    }

    /**
     * Set the AWS S3 client to use.
     * @param client
     */
    public setS3Client(client: AWS.S3): void {
        this.s3Client = client;
    }

    /**
     * Given a raw, possibly falsy key prefix, return a valid key prefix for both the root key
     * prefix of the disk or prefixes that can be passed as a Prefix param wherever the S3 client
     * accepts it.
     *
     * @param raw
     * @return The sanitized prefix.
     */
    private static sanitizeKeyPrefix(
        raw: string | false | null = null,
    ): string {
        // Trim off all whitespace and `/` characters from the beginning and end of the prefix.
        const prefix: string | null = raw
            ? `${raw}`.replace(/(^\s*\/?)|(\/?\s*$)?/g, '')
            : null;
        // S3 key prefixes must not start with a `/` but must end with one if non-empty.
        return prefix ? `${prefix}/` : '';
    }

    /**
     * Get the prefix of object keys based on the `root` config option.
     */
    private getKeyPrefix(): string {
        return S3Disk.sanitizeKeyPrefix(this.config.root);
    }

    /**
     * Get the `getObject`/`putObject` params that identify a unique object in the bucket based
     * on a disk path.
     *
     * @param path
     */
    private getObjectParams(path: string): S3ObjectParams {
        const { bucket } = this.config;
        return {
            Bucket: bucket,
            Key: this.getKeyPrefix() + Disk.sanitizePathOnDisk(path),
        };
    }

    /**
     * Get the putObject params for putting a file to a specific object path on the disk.
     *
     * @param path
     */
    private getPutObjectParams(path: string): AWS.S3.PutObjectRequest {
        const {
            putParams: extraPutParams = null,
            expires: rawExpires = null,
        } = this.config;
        const objectParams = this.getObjectParams(path);
        const expires = rawExpires ? parseInt(rawExpires as string, 10) : null;
        const expiresParams =
            expires && !isNaN(expires)
                ? {
                      Expires: new Date(Date.now() + expires * 1000),
                      CacheControl: `max-age=${expires}`,
                  }
                : {};
        return {
            ...expiresParams,
            ...(extraPutParams || {}),
            ...objectParams,
        };
    }

    /**
     * @inheritDoc
     */
    public async read(path: string): Promise<Buffer> {
        let body = null;
        const params = this.getObjectParams(path);
        try {
            body = (await this.s3Client.getObject(params).promise())
                .Body as S3NodeBody;
        } catch (error) {
            if (error.code === 'NoSuchKey') {
                throw new NotFoundError(path);
            }
        }
        /*
         * We wait to check the key until after the getObject so we can throw NotFoundError if it's
         * not valid first because that's a more meaningful error. If the key ends in a `/` it means
         * the successfully read object is actually just a marker for a directory.
         */
        if (params.Key.endsWith('/')) {
            throw new NotAFileError(path);
        }

        if (body) {
            if (typeof body === 'string') {
                return Buffer.from(body);
            } else if (body instanceof Buffer) {
                return body;
            } else if (body instanceof Readable) {
                // If AWS returned a Readable stream for whatever reason, read it into a buffer and then return that.
                return streamToBuffer(body);
            }
        }

        // If for some reason S3 gave us back a null or undefined body, we return an empty buffer.
        return Buffer.alloc(0);
    }

    /**
     * @inheritDoc
     */
    public async createReadStream(path: string): Promise<Readable> {
        const params = this.getObjectParams(path);
        try {
            await this.s3Client.headObject(params).promise();
        } catch (error) {
            if (error.code === 'NotFound') {
                throw new NotFoundError(path);
            }
            throw error;
        }
        if (params.Key.endsWith('/')) {
            throw new NotAFileError(path);
        }
        return this.s3Client.getObject(params).createReadStream();
    }

    /**
     * Determines if a provided object in a bucket is a directory explicitly (ends in a `/`) or
     * a directory object already exists with the same name excluding the `/`.
     *
     * @param params
     */
    private async doObjectParamsMatchDirectoryObject(
        params: S3ObjectParams,
    ): Promise<boolean> {
        if (params.Key.endsWith('/')) {
            return true;
        }
        /*
         * We also want to check to see if a key with the same name exists with a `/` at the end
         * and disallow that as well since it would be equivelant on a normal filesystem (whereas
         * it's acceptable in S3 since the `/` is part of the object key and thus `foo` and `foo/`
         * are considered separate objects.
         */
        try {
            await this.s3Client
                .headObject({
                    Bucket: params.Bucket,
                    Key: `${params.Key}/`,
                })
                .promise();
            /*
             * If we get to this point without throwing, it means a directory object exists so
             * we indicate as much.
             */
            return true;
        } catch (error) {
            if (error.code !== 'NotFound') {
                /*
                 * NotFound error is good! It means a directory object doesn't exist with the same
                 * name as the provided key. We re-throw on any other error.
                 */
                throw error;
            }
        }
        /*
         * If we get to this point, it means the headObject threw but it was just an expected
         * NotFound error. So that means we can consider the provided key a writable path.
         */
        return false;
    }

    /**
     * @inheritDoc
     */
    public async write(
        path: string,
        body: string | Buffer | Readable,
    ): Promise<void> {
        const params = this.getPutObjectParams(path);
        if (await this.doObjectParamsMatchDirectoryObject(params)) {
            throw new NotWritableDestinationError(path);
        }
        await this.s3Client
            .putObject({
                ...params,
                Body: body,
            })
            .promise();
    }

    /**
     * @inheritDoc
     */
    public async createWriteStream(): Promise<Writable> {
        // TODO Fudge this by returning a Stream wrapper around the putObject stream functionality.
        throw new Error(
            'The s3 driver does not support direct write streams. ' +
                'Instead pass a ReadableStream as the body to `write`.',
        );
    }

    /**
     * @inheritDoc
     */
    public async delete(path: string): Promise<void> {
        const params = this.getObjectParams(path);
        // Don't allow the deletion of directory markers.
        if (params.Key.endsWith('/')) {
            throw new NotAFileError(path);
        }
        try {
            // HEAD the object which will fail if the object doesn't exist.
            await this.s3Client.headObject(params).promise();
            // It does exist so we delete it.
            await this.s3Client.deleteObject(params).promise();
        } catch (error) {
            if (error.code === 'NotFound') {
                throw new NotFoundError(path);
            }
            throw error;
        }
    }

    /**
     * Get a single "page" of a bucket "directory's" contents by using the V2 listObjects API
     * to grab all objects that match a given prefix ending in `/` separating objects that start
     * with that prefix and don't contain any more slashes (i.e. leaves/files) from ones that do
     * contain further `/`s after the prefix (i.e. subtrees/directories).
     *
     * @param prefix
     * @param limit
     * @param continuationToken The continuation token provided by the previous call to this function.
     */
    private async listSomeObjects(
        prefix: string,
        limit: number = 1000,
        continuationToken: string | null = null,
    ): Promise<S3BucketListingPage> {
        // Gather the params for the call to get a "page" of objects
        const params: AWS.S3.ListObjectsV2Request = {
            Bucket: this.config.bucket,
            MaxKeys: limit,
            Prefix: prefix,
            Delimiter: '/',
        };
        if (continuationToken) {
            params.ContinuationToken = continuationToken;
        }
        const {
            Contents: contents = [],
            CommonPrefixes: commonPrefixes = [],
            IsTruncated: isTruncated = false,
            NextContinuationToken: nextContinuationToken = null,
        } = await this.s3Client.listObjectsV2(params).promise();

        /**
         * A function that will trim the provided prefix from the beginning of a string.
         * @param nameWithPrefix
         * @return
         */
        const trimPrefix = (nameWithPrefix: string): string => {
            return nameWithPrefix.replace(new RegExp(`^${prefix}`), '');
        };

        return {
            next: isTruncated ? nextContinuationToken : null,
            /*
             * Trim the prefixes off the keys in the contents and filter out empty strings (since
             * the prefix itself is included in the first page of results).
             */
            files: contents
                .map(({ Key: name }) => {
                    return name ? trimPrefix(name) : '';
                })
                .filter((name): boolean => !!name),
            /**
             * The common prefixes just need to have the prefix trimmed off of them since they won't
             * include the prefix itself and only deeper prefixes.
             */
            directories: commonPrefixes
                .map(({ Prefix: name }) => {
                    return name ? trimPrefix(name) : '';
                })
                .filter((name): boolean => !!name),
        };
    }

    /**
     * Get all objects in a prefix according to the logic of `listSomeObjects` above by recursively
     * calling that function and gathering all of the results from it appended together in order.
     *
     * Note that the returned arrays of directories and files may contain duplicates, particularly
     * the directories. Regardless the returned arrays are guaranteed to contain all objects within
     * the provided prefix at least once.
     *
     * @param prefix
     * @param limit
     * @param continuationToken
     */
    private async rawListAllObjects(
        prefix: string,
        limit: number = 1000,
        continuationToken: string | null = null,
    ): Promise<S3BucketListing> {
        const { files, directories, next } = await this.listSomeObjects(
            prefix,
            limit,
            continuationToken,
        );

        if (next) {
            const {
                files: restFiles = [],
                directories: restDirectories = [],
            } = await this.rawListAllObjects(prefix, limit, next);
            return {
                files: [...files, ...restFiles],
                directories: [...directories, ...restDirectories],
            };
        }

        return { files, directories };
    }

    /**
     * Important Note: `list` will never throw or reject with NotFoundError or NotADirectoryError
     * since objects can exist within a given prefix without a directory object existing with a
     * Key that matches the prefix and vice-versa.
     *
     * @inheritDoc
     */
    public async list(
        pathToDirectory: string | null = null,
    ): Promise<DiskListingObject[]> {
        const prefix: string =
            this.getKeyPrefix() + S3Disk.sanitizeKeyPrefix(pathToDirectory);
        const rawLimit: number | null = this.config.pagingLimit
            ? parseInt(this.config.pagingLimit as string)
            : null;

        const {
            files: rawFiles = [],
            directories: rawDirectories = [],
        } = await (rawLimit && !isNaN(rawLimit)
            ? this.rawListAllObjects(prefix, rawLimit)
            : this.rawListAllObjects(prefix));

        // Ensure all files and directories are unique
        const files: string[] = [...new Set(rawFiles)];
        const directories: string[] = [...new Set(rawDirectories)];

        // Return all files and directories converted to name+type objects and merged.
        return [
            ...directories.map((name) => ({
                name,
                type: DiskObjectType.Directory,
            })),
            ...files.map((name) => ({ name, type: DiskObjectType.File })),
        ];
    }
}
