import { DiskManager } from './DiskManager';
import { DiskDriver } from './types';

test('getDisk returns the same disk instance for the same disk name', () => {
    const diskMan = new DiskManager({
        default: { driver: DiskDriver.Memory },
        foo: { driver: DiskDriver.Memory },
        bar: 'foo',
    });
    const defaultDisk1 = diskMan.getDisk();
    const defaultDisk2 = diskMan.getDisk();
    const fooDisk1 = diskMan.getDisk('foo');
    const fooDisk2 = diskMan.getDisk('foo');
    const barDisk = diskMan.getDisk('bar');

    expect(defaultDisk1).toBe(defaultDisk2);
    expect(fooDisk1).toBe(fooDisk2);
    expect(defaultDisk1).not.toBe(fooDisk1);
    expect(barDisk).toBe(fooDisk1);
});

test('getDisk uses resolved name and not alias for the name of resolved disks', () => {
    const diskMan = new DiskManager({
        default: { driver: DiskDriver.Memory },
        foo: { driver: DiskDriver.Memory },
        bar: 'foo',
    });
    const defaultDisk = diskMan.getDisk();
    const fooDisk = diskMan.getDisk('foo');
    const barDisk = diskMan.getDisk('bar');
    expect(defaultDisk.getName()).toBe('default');
    expect(fooDisk.getName()).toBe('foo');
    expect(barDisk.getName()).toBe('foo');
});
