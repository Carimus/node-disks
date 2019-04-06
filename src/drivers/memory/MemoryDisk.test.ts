import { MemoryDisk } from './MemoryDisk';
import { DiskDriver } from '../..';
import { streamToBuffer } from '../../lib/utils';

test("memory disk's basic methods work", async () => {
    const disk = new MemoryDisk({ driver: DiskDriver.Memory });
    expect(await disk.list()).toHaveLength(0);
    await disk.write('/test.txt', 'this is a test');
    expect((await disk.read('/test.txt')).toString('utf8')).toBe(
        'this is a test',
    );
    expect(await disk.list()).toHaveLength(1);
    await disk.delete('test.txt');
    expect(await disk.list()).toHaveLength(0);
});

test("memory disk's stream methods work", async () => {
    const disk = new MemoryDisk({ driver: DiskDriver.Memory });
    expect(await disk.list()).toHaveLength(0);

    // Create a write stream, write to it, and wait for it to close.
    const writeStream = await disk.createWriteStream('test.txt');
    writeStream.end(Buffer.from('this is a test', 'utf8'));
    await new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (error) => reject(error));
    });

    // Check dir listing
    expect(await disk.list()).toHaveLength(1);

    // Create a read stream, read from it to a buffer, and then check its contents.
    const readStream = await disk.createReadStream('test.txt');
    const data = await streamToBuffer(readStream);
    expect(data.toString('utf8')).toBe('this is a test');
});

test('memory disks use isolated filesystems', async () => {
    const disk1 = new MemoryDisk({ driver: DiskDriver.Memory });
    const disk2 = new MemoryDisk({ driver: DiskDriver.Memory });

    await disk1.write('/test.txt', 'this is a test');
    expect(await disk1.list()).toHaveLength(1);
    expect(await disk2.list()).toHaveLength(0);
});
