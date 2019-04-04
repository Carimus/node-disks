import { DiskDriver } from './lib/types';
import * as allErrors from './errors';

export * from './lib/types';
export * from './lib/fs/types';
export * from './lib/DiskManager';
export * from './lib/Disk';
export * from './drivers/s3/S3Disk';
export * from './drivers/s3/types';
export * from './drivers/local/LocalDisk';
export * from './drivers/local/types';
export * from './drivers/memory/MemoryDisk';
export * from './errors'
export * from './'

// Kept around for backwards compatibility.
export const errors = allErrors;

/**
 * An array of available drivers.
 */
export const DRIVERS: DiskDriver[] = [
    DiskDriver.Local,
    DiskDriver.S3,
    DiskDriver.Memory,
];
