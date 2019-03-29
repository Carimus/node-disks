/**
 * Indicates a disk was not found by name
 */
export class DiskNotFoundError extends Error {
    public constructor(diskName: string) {
        super(`Disk not found in disks config: ${diskName}.`);
    }
}
