import { S3 } from 'aws-sdk';

/**
 * Available drivers
 */
export enum DiskDriver {
    Local = 'local',
    S3 = 's3',
}

/**
 * The common config options for all disks.
 */
export interface DiskConfig {
    /**
     * The driver to use.
     */
    driver: DiskDriver;
}

/**
 * A map/dictionary of disk names to their config objects. If the value is a
 * string, than it's considered an alias and looked up recursively from the
 * root of the config.
 */
export interface DiskManagerConfig {
    default: string | DiskConfig;
    [key: string]: string | DiskConfig;
}

/**
 * Options that can be passed to the DiskManager
 */
export interface DiskManagerOptions {
    /**
     * A pre-initialized s3 client to use instead of creating a new one.
     */
    s3Client?: S3;
}

/**
 * Describes the type of an object on the disk.
 */
export enum DiskObjectType {
    File = 'file',
    Directory = 'directory',
}

/**
 * Represents an object in a directory listing.
 */
export interface DiskListingObject {
    /**
     * The name of the object in the directory.
     *
     * Note: this is not the full path to the object.
     */
    name: string;

    /**
     * The type of the object.
     */
    type: DiskObjectType;
}
