import { DiskDriver } from './lib/types';
import * as allErrors from './errors';

export { DiskManager } from './lib/DiskManager';
export { Disk } from './lib/Disk';
export { S3Disk } from './drivers/s3/S3Disk';
export { LocalDisk } from './drivers/local/LocalDisk';
export { MemoryDisk } from './drivers/memory/MemoryDisk';
export const errors = allErrors;

/**
 * An array of available drivers.
 */
export const DRIVERS: DiskDriver[] = [
    DiskDriver.Local,
    DiskDriver.S3,
    DiskDriver.Memory,
];
