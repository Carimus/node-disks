import { DiskDriver } from './types';
import * as allErrors from './errors';

export { DiskManager } from './DiskManager';
export { Disk } from './Disk';
export { S3Disk } from './drivers/s3/S3Disk';
export { LocalDisk } from './drivers/local/LocalDisk';
export const errors = allErrors;

/**
 * An array of available drivers.
 */
export const DRIVERS: DiskDriver[] = [DiskDriver.Local, DiskDriver.S3];
