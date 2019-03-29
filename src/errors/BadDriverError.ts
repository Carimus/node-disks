/**
 * Indicates that a driver was not understood.
 */
export class BadDriverError extends Error {
    public constructor(
        diskName: string = '(not specified)',
        driverName: string | null | undefined,
    ) {
        super(
            `Unrecognized or unspecified driver '${driverName ||
                '(unknown)'}' for disk '${diskName}'.`,
        );
    }
}
