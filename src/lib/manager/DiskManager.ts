import { has } from 'ramda';
import { BadDriverError, DiskNotFoundError } from '../../errors';
import { Disk } from '../Disk';
import {
    AnyNamedDiskSpecification,
    DiskDriver,
    DiskManagerConfig,
    DiskManagerDiskRegistry,
    GetDiskOptions,
} from './types';
import {
    DiskConfig,
    LocalDisk,
    LocalDiskConfig,
    MemoryDisk,
    S3Disk,
    S3DiskConfig,
} from '../..';

/**
 * A disk manager
 */
export class DiskManager {
    /**
     * The configuration to pull disks from.
     */
    private config: DiskManagerConfig;

    /**
     * The cache of disks
     *
     * @see getDisk
     */
    private disks: DiskManagerDiskRegistry;

    public constructor(config: DiskManagerConfig) {
        this.config = config;
        this.disks = {};
    }

    /**
     * Obtain the disk specification (its name and config), safely resolving aliases.
     * @param name The name of the disk to lookup in the disk manager config.
     * @param maxLookup The max number of times to recurse to avoid infinite loops when resolving aliases.
     * @returns Null if it couldn't be resolved. Otherwise, the disk's specification along with its resolved name.
     */
    private resolveDiskSpecification = (
        name: string,
        maxLookup: number = 10,
    ): AnyNamedDiskSpecification | null => {
        if (has(name, this.config) && maxLookup > 0) {
            const aliasOrDiskSpec = this.config[name];
            // If the value of the disk in the disk manager config is a string, assume it's an alias.
            return typeof aliasOrDiskSpec === 'string'
                ? this.resolveDiskSpecification(aliasOrDiskSpec, maxLookup - 1)
                : { name, specification: aliasOrDiskSpec };
        }
        return null;
    };

    /**
     * Store a disk in the disk cache by name and return it.
     *
     * @param name
     * @param disk
     */
    private registerDisk = (name: string, disk: Disk): Disk => {
        this.disks[name] = disk;
        return disk;
    };

    /**
     * Get a `Disk` instance for the configured disk.
     *
     * Throws errors if the named disk does not exist in the disk manager config or if the driver specified is not
     * supported.
     *
     * @param name The name of the disk that exists in the disk manager config, supports aliases.
     * @param options Additional options to control how the disk manager behaves.
     */
    public getDisk = (
        name: string = 'default',
        options: GetDiskOptions = {},
    ): Disk => {
        const namedDiskSpec = this.resolveDiskSpecification(name);
        if (namedDiskSpec) {
            const {
                name: resolvedName,
                specification: diskSpec,
            } = namedDiskSpec;
            if (has(resolvedName, this.disks)) {
                return this.disks[resolvedName];
            }
            // Grab the s3Client from the options provided to the manager if any.
            const { s3Client = null } = options;

            // Extract the driver and config from the disk's specification.
            const {
                driver = null,
                config: rawDiskConfig = null,
                ...rest
            } = diskSpec;

            // Backwards compatibility: support taking the non-driver keys from the spec and treating them as the disk
            // config if an explicit config is not provided.
            const diskConfig = rawDiskConfig || (rest as DiskConfig);

            // Register and return a disk based on the driver.
            if (driver === DiskDriver.Local) {
                const disk = new LocalDisk(
                    diskConfig as LocalDiskConfig,
                    resolvedName,
                );
                return this.registerDisk(resolvedName, disk);
            } else if (driver === DiskDriver.Memory) {
                const disk = new MemoryDisk(
                    diskConfig as DiskConfig,
                    resolvedName,
                );
                return this.registerDisk(resolvedName, disk);
            } else if (driver === DiskDriver.S3) {
                const disk = s3Client
                    ? new S3Disk(
                          diskConfig as S3DiskConfig,
                          resolvedName,
                          s3Client,
                      )
                    : new S3Disk(diskConfig as S3DiskConfig, resolvedName);
                return this.registerDisk(resolvedName, disk);
            } else {
                throw new BadDriverError(resolvedName, driver);
            }
        }
        throw new DiskNotFoundError(name);
    };
}
