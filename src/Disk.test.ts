import { Disk } from './Disk';

test('Disk.sanitizePathOnDisk works with null/undefined values', () => {
    expect(Disk.sanitizePathOnDisk(null)).toBe('');
    // eslint-disable-next-line no-undefined
    expect(Disk.sanitizePathOnDisk(undefined)).toBe('');
});
