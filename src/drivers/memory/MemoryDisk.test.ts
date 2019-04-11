import { MemoryDisk } from './MemoryDisk';
import { streamToBuffer } from '../..';

test("memory disk's basic methods work", async () => {
    const disk = new MemoryDisk();
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
    const disk = new MemoryDisk();
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
    const disk1 = new MemoryDisk();
    const disk2 = new MemoryDisk();

    await disk1.write('/test.txt', 'this is a test');
    expect(await disk1.list()).toHaveLength(1);
    expect(await disk2.list()).toHaveLength(0);
});

test('memory disk can generate URLs if one is provided in config', async () => {
    const diskWithoutUrls = new MemoryDisk();
    const diskWithUrls = new MemoryDisk({ url: 'http://localhost:1234' });
    const diskWithUrlsAndTempFallback = new MemoryDisk({
        url: 'http://localhost:1234',
        temporaryUrlFallback: true,
    });

    // A memory disk without a url config should return null permanent and temporary URLs
    expect(diskWithoutUrls.getUrl('test.txt')).toBe(null);
    expect(diskWithoutUrls.getTemporaryUrl('test.txt')).toBe(null);

    // A disk with a url config should return urls that are the paths appended to the base url
    expect(diskWithUrls.getUrl('test.txt')).toBe(
        'http://localhost:1234/test.txt',
    );
    expect(diskWithUrls.getUrl('/test.txt')).toBe(
        'http://localhost:1234/test.txt',
    );
    expect(diskWithUrls.getUrl('/abc/1/2/3/test')).toBe(
        'http://localhost:1234/abc/1/2/3/test',
    );

    // A memory disk with url configured but no temp fallback enabled by default should return null temp URLs unless
    // explicitly instructed to fallback.
    expect(diskWithUrls.getTemporaryUrl('test.txt')).toBe(null);
    expect(diskWithUrls.getTemporaryUrl('test.txt', 1000, false)).toBe(null);
    expect(diskWithUrls.getTemporaryUrl('test.txt', 1000, true)).toBe(
        'http://localhost:1234/test.txt',
    );

    // A memory disk with url configured and temp fallback enabled should return temp URLs unless explicitly
    // instructed not to fallback.
    expect(diskWithUrlsAndTempFallback.getTemporaryUrl('test.txt')).toBe(
        'http://localhost:1234/test.txt',
    );
    expect(
        diskWithUrlsAndTempFallback.getTemporaryUrl('test.txt', 1000, false),
    ).toBe(null);
    expect(
        diskWithUrlsAndTempFallback.getTemporaryUrl('test.txt', 1000, true),
    ).toBe('http://localhost:1234/test.txt');
});
