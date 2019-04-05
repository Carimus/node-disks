import { CodedError } from './CodedError';

/**
 * Indicates a disk was not found by name
 */
export class DiskNotFoundError extends CodedError {
    public constructor(diskName: string) {
        super(
            'DiskNotFoundError',
            `Disk not found in disks config: ${diskName}.`,
        );
        Object.setPrototypeOf(this, DiskNotFoundError.prototype);
    }
}
