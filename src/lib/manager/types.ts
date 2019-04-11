import { S3 } from 'aws-sdk';
import { DiskConfig, LocalDiskConfig, S3DiskConfig, Disk } from '../..';

/**
 * Available drivers
 */
export enum DiskDriver {
    Memory = 'memory',
    Local = 'local',
    S3 = 's3',
}

/**
 * Any config object for any driver.
 */
export type AnyDiskConfig = DiskConfig | S3DiskConfig | LocalDiskConfig;

/**
 * Specifies a disk driver and its config
 */
export interface DiskSpecification {
    /**
     * The driver to use for the disk.
     */
    driver: DiskDriver;

    /**
     * The configuration for the disk.
     */
    config?: AnyDiskConfig;
}

/**
 * A specification paired with its name.
 */
export interface AnyNamedDiskSpecification {
    name: string;
    specification: DiskSpecification;
}

/**
 * The type of the internal registry used by the disk manager to remember disks.
 */
export interface DiskManagerDiskRegistry {
    [key: string]: Disk;
}

/**
 * A map/dictionary of disk names to their config objects. If the value is a
 * string, than it's considered an alias and looked up recursively from the
 * root of the config.
 */
export interface DiskManagerConfig {
    /**
     * The "default" alias should always be a string alias. This is enforced at the type level to help ensure disks
     * have meaningful names.
     */
    default: string;

    /**
     * All other config keys are disk names mapped to the name of the disk their an alias for OR an actual
     * DiskSpecification.
     */
    [key: string]: string | DiskSpecification;
}

/**
 * Options that can be passed to the `DiskManager`'s `getDisk` function.
 */
export interface GetDiskOptions {
    /**
     * A pre-initialized s3 client to use instead of creating a new one for S3Disks
     */
    s3Client?: S3;
}
