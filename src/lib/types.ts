/**
 * The common config options for all disks.
 */
export interface DiskConfig {
    /**
     * A base URL that the contents of the disk should be available at from their path. Different drivers have
     * different defaults but typically if this is not provided, the disk will not support generating URLs.
     */
    url?: string;

    /**
     * How many seconds a temporary URL should by default expire in. Default: 86400 seconds (1 day)
     */
    temporaryUrlExpires?: number;

    /**
     * Whether or not to fallback to permanent URLs when the disk doesn't support temporary URLs. Default: false
     */
    temporaryUrlFallback?: boolean;

    /**
     * Other config options are possible depending on the driver.
     */
    [key: string]: any;
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
