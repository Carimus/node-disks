import { DiskManager } from './DiskManager';
import { DiskDriver } from './types';

test('getDisk returns the same disk instance for the same disk name', () => {
    const diskMan = new DiskManager({
        default: { driver: DiskDriver.Memory },
        foo: { driver: DiskDriver.Memory },
    });
    const defaultDisk1 = diskMan.getDisk();
    const defaultDisk2 = diskMan.getDisk();
    const fooDisk1 = diskMan.getDisk('foo');
    const fooDisk2 = diskMan.getDisk('foo');

    expect(defaultDisk1).toBe(defaultDisk2);
    expect(fooDisk1).toBe(fooDisk2);
    expect(defaultDisk1).not.toBe(fooDisk1);
});
