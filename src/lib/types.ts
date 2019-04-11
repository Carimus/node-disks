/**
 * The common config options for all disks.
 */
export interface DiskConfig {
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
