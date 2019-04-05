import { CodedError } from './CodedError';

/**
 * Indicates that a driver was not understood.
 */
export class BadDriverError extends CodedError {
    public constructor(
        diskName: string = '(not specified)',
        driverName: string | null | undefined,
    ) {
        super(
            'BadDriverError',
            `Unrecognized or unspecified driver '${driverName ||
                '(unknown)'}' for disk '${diskName}'.`,
        );
        Object.setPrototypeOf(this, BadDriverError.prototype);
    }
}
