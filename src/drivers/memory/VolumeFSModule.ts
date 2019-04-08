import * as stream from 'stream';
import * as fs from 'fs';
import { Volume, IError } from 'memfs/lib/volume';
import { TDataOut } from 'memfs/lib/encoding';
import Dirent from 'memfs/lib/Dirent';
import Stats from 'memfs/lib/Stats';
import { AsyncFSModule } from '../..';

/**
 * Convert string to buffer if its read from the memfs volume.
 *
 * @param data
 */
const transformVolumeDataToBuffer = (data?: TDataOut): Buffer => {
    if (data) {
        return typeof data === 'string' ? Buffer.from(data) : data;
    } else {
        return Buffer.alloc(0);
    }
};

/**
 * Convert bugger to string if its read from the memfs volume. Also handles Dirents.
 *
 * @param data
 */
const transformVolumeDataToString = (data?: TDataOut | Dirent): string => {
    if (data) {
        if (typeof data === 'string') {
            return data;
        } else if (Buffer.isBuffer(data)) {
            return data.toString('utf8');
        } else {
            return transformVolumeDataToString(data.name);
        }
    } else {
        return '';
    }
};

/**
 * Have to create a complicated adapter here since memfs's Volume doesn't properly support promsify and
 * their typescript types are malformed as well. So lot's of finagling is required to keep all of those issues
 * (in an otherwise great library) behind a boundary.
 */
export class VolumeFSModule implements AsyncFSModule {
    private volume: Volume;

    public constructor(volume: Volume) {
        this.volume = volume;
    }

    public createReadStream(path: string): stream.Readable {
        return this.volume.createReadStream(path);
    }

    public createWriteStream(path: string): stream.Writable {
        return this.volume.createWriteStream(path);
    }

    public readFile(file: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.volume.readFile(
                file,
                (error?: IError, data?: TDataOut): void => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(transformVolumeDataToBuffer(data));
                    }
                },
            );
        });
    }

    public writeFile(file: string, data: Buffer | string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.volume.writeFile(file, data, (err?: IError) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public readdir(path: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.volume.readdir(
                path,
                (error?: IError, data?: TDataOut[] | Dirent[]) => {
                    if (error) {
                        reject(error);
                    } else if (data && Array.isArray(data)) {
                        // transformVolumeDataToString can handle any TDataOut or Dirent even when mixed
                        const results: string[] = (data as (
                            | TDataOut
                            | Dirent)[]).map(transformVolumeDataToString);
                        resolve(results);
                    } else {
                        resolve([]);
                    }
                },
            );
        });
    }

    public mkdirp(dirPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.volume.mkdirp(dirPath, (error?: IError) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    public unlink(file: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.volume.unlink(file, (error?: IError) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    public stat(path: string): Promise<fs.Stats> {
        return new Promise((resolve, reject) => {
            this.volume.stat(path, (error?: IError, stats?: Stats) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stats as fs.Stats);
                }
            });
        });
    }

    public access(path: string, mode?: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const fulfill = (error?: IError): void => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            };

            if (typeof mode === 'number') {
                this.volume.access(path, mode, fulfill);
            } else {
                this.volume.access(path, fulfill);
            }
        });
    }
}
