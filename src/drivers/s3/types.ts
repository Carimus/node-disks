import { Body, BucketName, ObjectKey } from 'aws-sdk/clients/s3';
import { DiskConfig } from '../..';

export interface S3DiskConfig extends DiskConfig {
    /**
     * The S3 bucket to use.
     */
    bucket: string;

    /**
     * The prefix to use for object keys.
     *
     * If not provided, object keys will have no prefix and be stored relative to the root of the bucket.
     * Relative paths and absolute paths are treated identically.
     */
    root?: string;

    /**
     * The base url from which objects in the bucket can be accessed with no trailing slash.
     *
     * The root path will not automatically be prepended to object paths when generating URLs so if you override
     * this be sure to include it too: `'https://<bucket>.s3.amazonaws.com/<root>'`.
     *
     * This is useful to override if, for example, you've put CloudFront in front of the bucket.
     */
    url?: string;

    /**
     * S3 listObject results are returned in pages of max 1000 objects. In order to get a listing of all objects
     * in a prefix, you have to page through 1000 at a time (the default). Set this to page through with smaller
     * pages; max is 1000.
     */
    pagingLimit?: number | string;

    /**
     * The number of seconds from the time of upload to set the `Expires` option for `putObject`.
     * Will also automatically set the `Cache-Control`
     */
    expires?: number | string;

    /**
     * An object of additional options to merge into the `putObject` params when uploading
     */
    putParams?: {};

    /**
     * An object of additional config options to pass into the `AWS.S3` client during setup.
     *
     * If you're not using environment variables to authenticate the AWS client, you can provide credentials here.
     */
    clientConfig?: {};
}

/**
 * Contains all information needed to identify a globally unique S3 bucket object.
 */
export interface S3ObjectParams {
    /**
     * The name of the s3 bucket.
     */
    Bucket: BucketName;

    /**
     * The key of the object within the bucket.
     */
    Key: ObjectKey;
}

/**
 * We exclude the Blob type from our consideration since that's only ever returned by the client version of the
 * aws-sdk. On Node it returns a buffer.
 */
export type S3NodeBody = Exclude<Body, Blob>;

export interface S3BucketListing {
    /**
     * An array of object names that are files.
     */
    files: string[];

    /**
     * An array of object names that are directories.
     */
    directories: string[];
}

/**
 * Represents a single page of objects (separate into files and directories) using the listObjectsV2 S3 API.
 */
export interface S3BucketListingPage extends S3BucketListing {
    /**
     * A listObjectsV2 ContinuationToken or null if no next page.
     */
    next: string | null;
}
