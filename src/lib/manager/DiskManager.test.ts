import { DiskManager } from './DiskManager';
import { DiskDriver, LocalDisk } from '../..';
import * as path from 'path';

test('getDisk returns the same disk instance for the same disk name', () => {
    const diskMan = new DiskManager({
        default: 'foo',
        foo: { driver: DiskDriver.Memory },
        bar: { driver: DiskDriver.Memory },
    });
    const defaultDisk1 = diskMan.getDisk();
    const defaultDisk2 = diskMan.getDisk();
    const fooDisk1 = diskMan.getDisk('foo');
    const fooDisk2 = diskMan.getDisk('foo');
    const barDisk = diskMan.getDisk('bar');

    expect(defaultDisk1).toBe(defaultDisk2);
    expect(fooDisk1).toBe(fooDisk2);
    expect(defaultDisk1).toBe(fooDisk1);
    expect(barDisk).not.toBe(fooDisk1);
});

test('getDisk uses resolved name and not alias for the name of resolved disks', () => {
    const diskMan = new DiskManager({
        default: 'foo',
        foo: { driver: DiskDriver.Memory },
        bar: 'foo',
    });
    const defaultDisk = diskMan.getDisk();
    const fooDisk = diskMan.getDisk('foo');
    const barDisk = diskMan.getDisk('bar');
    expect(defaultDisk.getName()).toBe('foo');
    expect(fooDisk.getName()).toBe('foo');
    expect(barDisk.getName()).toBe('foo');
});

test('DiskManager is backwards compatible with the old config style', () => {
    const diskMan = new DiskManager({
        default: 'foo',
        // @ts-ignore since we're explicitly using an old unsupported type.
        foo: { driver: DiskDriver.Local, root: '/tmp' },
    });

    const disk = diskMan.getDisk() as LocalDisk;
    expect(disk.getRootPath()).toBe(path.resolve('/tmp'));
});
