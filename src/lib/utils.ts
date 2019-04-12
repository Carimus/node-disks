import { Readable, Writable } from 'stream';
import toArray = require('stream-to-array');
import tmp = require('tmp');

/**
 * Stream a readable stream into memory.
 * @param stream
 */
export async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const streamParts = await toArray(stream);
    const streamBuffers: Buffer[] = streamParts.map(
        (part: ArrayBuffer | SharedArrayBuffer): Buffer => {
            return Buffer.isBuffer(part) ? part : Buffer.from(part);
        },
    );
    return Buffer.concat(streamBuffers);
}

/**
 * Pipe a readable stream into a writable stream and resolve once it's completely piped or reject if the pipe fails.
 *
 * TODO Implement timeout.
 *
 * @param readable
 * @param writable
 * @param resolveEvents
 * @param rejectEvents
 */
export async function pipeStreams(
    readable: Readable,
    writable: Writable,
    resolveEvents: string[] = ['finish', 'close'],
    rejectEvents: string[] = ['error'],
): Promise<string> {
    return new Promise((resolve, reject) => {
        let fulfilled = false;
        const resultStream = readable.pipe(writable);
        resolveEvents.forEach((resolveEvent: string) => {
            resultStream.on(resolveEvent, () => {
                if (!fulfilled) {
                    resolve(resolveEvent);
                    fulfilled = true;
                }
            });
        });
        rejectEvents.forEach((rejectEvent: string) => {
            resultStream.on(rejectEvent, (error) => {
                if (!fulfilled) {
                    reject(error);
                    fulfilled = true;
                }
            });
        });
    });
}

/**
 * Create a temp file and do something with it.
 *
 * @param execute An optionally async function that will receive the temp file's name (path)
 * @param skipCleanup If true, don't delete the file until process end.
 * @param extraOptions Additional options to pass into `tmp.file`
 * @return The temporary's file path which won't exist after this resolves unless `skipCleanup` was `true`
 */
export async function withTempFile(
    execute: (name: string) => Promise<void> | void,
    skipCleanup: boolean = false,
    extraOptions: import('tmp').FileOptions = {},
): Promise<string> {
    // Receive the temp file's name (path) and cleanup function from `tmp`, throwing if it rejects.
    const {
        name,
        cleanupCallback,
    }: { name: string; cleanupCallback: () => void } = await new Promise(
        (resolve, reject) => {
            tmp.file(
                { discardDescriptor: true, ...extraOptions },
                (err, name, fd, cleanupCallback) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ name, cleanupCallback });
                    }
                },
            );
        },
    );
    // Run the execute callback with the name (path)
    await execute(name);
    // Don't delete the file if requested.
    if (!skipCleanup) {
        await cleanupCallback();
    }
    // Return the temporary file's name (path)
    return name;
}
