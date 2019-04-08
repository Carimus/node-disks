import * as fs from 'fs';
import * as stream from 'stream';

export interface AsyncFSModule {
    writeFile: (file: string, data: string | Buffer) => Promise<void>;
    readFile: (file: string) => Promise<Buffer>;
    readdir: (path: string) => Promise<string[]>;
    stat: (path: string) => Promise<fs.Stats>;
    createReadStream: (path: string) => stream.Readable;
    createWriteStream: (path: string) => stream.Writable;
    unlink: (file: string) => Promise<void>;
    mkdirp: (dirPath: string) => Promise<void>;
    access: (file: string, mode?: number) => Promise<void>;
}
