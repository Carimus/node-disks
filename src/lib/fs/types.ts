import * as fs from 'fs';

export interface FSModule {
    writeFile: typeof fs.writeFile;
    readFile: typeof fs.readFile;
    readdir: typeof fs.readdir;
    stat: typeof fs.stat;
    createReadStream: typeof fs.createReadStream;
    createWriteStream: typeof fs.createWriteStream;
    unlink: typeof fs.unlink;
}
