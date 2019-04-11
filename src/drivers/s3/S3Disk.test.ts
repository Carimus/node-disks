import { S3Disk } from './S3Disk';

function setup(): {
    invalidAgainst: Date;
    validAgainst: Date;
    url: string;
    urlWithBadSignature: string;
} {
    const validAgainst = new Date(1550080786000);

    const invalidAgainst = new Date(1556096786000);

    const url =
        'https://carimus-test-bucket.s3.amazonaws.com' +
        '/node-disks/private/test.txt' +
        '?AWSAccessKeyId=AKIAUXK5GCKCBIZEAQLM&Expires=1555107251&Signature=pDcZdUH6NA4lt3MMUyktNjZcy6k%3D';

    const urlWithBadSignature =
        'https://carimus-test-bucket.s3.amazonaws.com' +
        '/node-disks/private/test.txt' +
        '?AWSAccessKeyId=AKIAUXK5GCKCBIZEAQLM&Expires=1555107251&Signature=n%2F0000000000000000000000000%3D';

    return {
        validAgainst,
        invalidAgainst,
        url,
        urlWithBadSignature,
    };
}

test('S3Disk can properly validate temporary URLs', () => {
    // Don't need to actually access a bucket
    const s3Disk = new S3Disk({ bucket: 'example', root: '/' });

    const { validAgainst, invalidAgainst, url, urlWithBadSignature } = setup();

    expect(s3Disk.isTemporaryUrlValid(url, validAgainst)).toBe(true);
    expect(s3Disk.isTemporaryUrlValid(urlWithBadSignature, validAgainst)).toBe(
        true,
    );
    expect(s3Disk.isTemporaryUrlValid(url, invalidAgainst)).toBe(false);
    expect(
        s3Disk.isTemporaryUrlValid(urlWithBadSignature, invalidAgainst),
    ).toBe(false);
    expect(s3Disk.isTemporaryUrlValid('https://google.com')).toBe(null);
    expect(s3Disk.isTemporaryUrlValid('this is not a url')).toBe(null);
});
