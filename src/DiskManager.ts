import { has } from 'ramda';
import { S3Disk } from './drivers/s3/S3Disk';
import { LocalDisk } from './drivers/local/LocalDisk';
import { BadDriverError, DiskNotFoundError } from './errors';
import { Disk } from './Disk';
import {
    DiskConfig,
    DiskDriver,
    DiskManagerConfig,
    DiskManagerOptions,
} from './types';
import { S3DiskConfig } from './drivers/s3/types';
import { LocalDiskConfig } from './drivers/local/types';

export type AnyDiskConfig = DiskConfig | S3DiskConfig | LocalDiskConfig | null;

/**
 * A disk manager
 */
export class DiskManager {
    /**
     * The configuration to pull disks from.
     */
    private config: DiskManagerConfig;

    public constructor(config: DiskManagerConfig) {
        this.config = config;
    }

    /**
     * Obtain the disk config, safely resolving aliases.
     * @param name The name of the disk to lookup in the config.
     * @param maxLookup The max number of times to recurse to avoid infinite
     *      loops when resolving aliases.
     * @returns The disk config or null if it couldn't be resolved.
     */
    public resolveDiskConfig = (
        name: string,
        maxLookup: number = 10,
    ): AnyDiskConfig => {
        if (has(name, this.config) && maxLookup > 0) {
            // If the value of the disk in config is a string, assume it's an alias.
            return typeof this.config[name] === 'string'
                ? this.resolveDiskConfig(
                      this.config[name] as string,
                      maxLookup - 1,
                  )
                : (this.config[name] as DiskConfig);
        }
        return null;
    };

    /**
     * Get a `Disk` instance for the configured disk.
     *
     * Throws errors if the named disk does not exist in the config or if the
     * driver specified is not supported.
     *
     * @param name The name of the disk that exists in the disk config, supports aliases.
     * @param options
     */
    public getDisk = (
        name: string = 'default',
        options: DiskManagerOptions = {},
    ): Disk => {
        const { s3Client = null } = options;
        const diskConfig: AnyDiskConfig = this.resolveDiskConfig(name);
        if (diskConfig) {
            const { driver = null } = diskConfig;
            switch (driver) {
                case DiskDriver.Local:
                    return new LocalDisk(diskConfig as LocalDiskConfig);
                case DiskDriver.S3:
                    return new S3Disk(diskConfig as S3DiskConfig, s3Client);
                default:
                    throw new BadDriverError(name, driver);
            }
        }
        throw new DiskNotFoundError(name);
    };
}
