import { Readable, Writable } from 'stream';
import toArray = require('stream-to-array');

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
