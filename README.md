# Node Disks

An abstraction for local/remote disks for node inspired by The League of Extraordinary Packages's
FlySystem.

## Prerequisites

-   Node >= 10

## Getting Started

Install the package in your project:

```
yarn add @carimus/node-disks
```

Or if you're using `npm`:

```
npm install --save @carimus/node-disks
```

## Usage

There's two way to utilize the abstract disk implementations that this library supports.

### Option A: Use Disks Directly

You can create new instances of any of the exported `*Disk` classes directly and use their
available `Disk` methods to perform operations.

For example (in typescript):

```typescript
import { Disk, LocalDisk, S3Disk, DiskDriver } from '@carimus/node-disks';

const foo: Disk = new LocalDisk({ driver: DiskDriver.Local, root: '/tmp' });
const bar: Disk = new S3Disk({ driver: DiskDriver.S3, bucket: 'test' });

// Wrap everything in a self-executing async function.
(async () => {
    // Write a file to the foo disk
    await foo.write('foo.txt', 'This is a foo file');

    // Stream the file from the foo disk to the bar disk as bar.txt
    const fooReadStream = await foo.createReadStream('foo.txt');
    const barWriteStream = await bar.createWriteStream('bar.txt');

    // Initiate the piping and wait for it to finish
    fooReadStream.pipe(barWriteStream);
    await new Promise((resolve, reject) => {
        barWriteStream.on('end', () => resolve('end'));
        barWriteStream.on('finish', () => resolve('finish'));
        barWriteStream.on('error', (error) => reject(error));
    });

    // Get a listing of the bar disk contents and store it on the foo disk.
    const s3Listing = await bar.list();
    await foo.write('s3listing.json', JSON.stringify(s3Listing, null, 2));
})();
```

**Important Note:** Providing `driver` to the `LocalDisk` and `S3Disk` constructors isn't functionally
necessary; it's necessary only to satisfy typescript right now until we separate the driver from the options since
the driver is only a concern of the `DiskManager`.

### Option B: Use a Disk Manager

`node-disks` also ships with a `DiskManager` that you can provide a single, declarative
configuration up front and then load disks by name from that config.

For example, considering the two disks in **Option A** below, we could have instead
done:

```typescript
import { DiskManager, Disk, DiskDriver } from '@carimus/node-disks';

const diskManager = new DiskManager({
    default: 'foo',
    foo: {
        driver: DiskDriver.Local,
        root: '/tmp',
    },
    bar: {
        driver: DiskDriver.S3,
        bucket: 'test',
    },
    baz: 'bar', // You can alias disks as well! `default` above is an alias.
});

const foo: Disk = diskManager.getDisk('foo');
const bar: Disk = diskManager.getDisk('bar');

// Use `foo` and `bar` not worrying about their implementation like in Option A.
```

## Supported Drivers

### Memory

**Driver name:** `'memory'`

**`Disk` class:** `MemoryDisk`

An in-memory disk whose contents will be forgotten when the node process ends. Each instance of the `MemoryDisk` has
its own isolated filesystem.

#### Options

Takes no options.

### Local

**Driver name:** `'local'`

**`Disk` class:** `LocalDisk`

A disk that uses the local filesystem.

#### Options:

| Name   | Type   | Description                                                                                         |
| ------ | ------ | --------------------------------------------------------------------------------------------------- |
| `root` | string | Required; The absolute path to thee directory where files should be stored on the local filesystem. |

### S3

**Driver name:** `'s3'`

**`Disk` class:** `S3Disk`

A disk that uses a remote AWS S3 bucket.

#### Options:

| Name           | Type   | Description                                                                                                               |
| -------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| `bucket`       | string | Required; The S3 bucket to use.                                                                                           |
| `root`         | string | Optional; The prefix to use for storing objects in the bucket. Defaults to the root                                       |
| `pagingLimit`  | number | Optional; Num of max results to fetch when paging through an S3 `listObjectsV2` call. Defaults to `1000`, the max.        |
| `expires`      | number | Optional; Number of seconds from time of upload to set `Expires` and `Cache-Control` for `putObject` calls.               |
| `putParams`    | object | Optional; Additional params to merge into all `putObject` calls                                                           |
| `clientConfig` | object | Optional; Options to pass to the `AWS.S3` client constructor. Can be used to pass credentials if not using env variables. |

## API

### `Disk`

More detailed docs are TODO. [Check out the source](./src/lib/Disk.ts)
for inline documentation and types.

Important public methods:

-   `async read(path: string): Promise<Buffer>` to read a file into memory
-   `async createReadStream(path: string): Promise<Readable>` to obtain a readable stream to a file
-   `async write(path: string, contents: Buffer): Promise<void>` to write to a file
-   `async createReadStream(path: string): Promise<Writable>` to obtain a writable stream to a file
-   `async delete(path: string): Promise<void>` to delete a file (not a directory)
-   `async list(path: string): Promise<DiskListingObject[]>` to obtain a list of objects in a
    directory on the disk.
-   `getName(): string | null` to get the name of the disk if it was created with one. The `DiskManager` will
    automatically and appropriately set this to the actual resolved name of the disk from the config.

### `DiskManager`

More detailed docs are TODO. [Check out the source](./src/lib/DiskManager.ts)
for inline documentation and types.

-   `constructor(config: DiskManagerConfig)` create the disk manager with a map of disk names to
    their configuration object containing at least a `driver` property and then additionally
    whatever required config options that specific driver needs. Or a string, which is treated as
    an alias for another disk.
-   `async geDisk(name: string, options: DiskManagerOptions): Disk` to get a disk by name (allowing
    for aliases in config).

### Utils

This library also exports some helper methods:

-   `async pipeStreams(readable: Readable, writable: Writable): Promise<string>` pipes a readable stream into a
    writable stream and waits until it completes. It will reject if the pipe stream emits an error and will otherwise
    resolve with the name of the event that the stream closed with (i.e. `'close'` or `'finish'`).
-   `async streamToBuffer(stream: Readable): Promise<Buffer>` pipes a readable stream into a single buffer. Rejects if
    the stream emits an error.

## TODO

-   [ ] Make the `MemoryDisk` test generic to run on any `Disk` and figure out how to run it safely with `LocalDisk`
        and `S3Disk`:
    -   `S3Disk`: credentials and bucket from environment with cleanup `afterEach` and don't fail if env variables
        aren't there.
    -   `LocalDisk`: just randomly generate a path to a tmp directory that doesn't exist in `beforeEach` and use that
        as the disk root and rimraf it in `afterEach`
-   [ ] Improve tests to cover niche cases like:
    -   `Readable` stream passed to `MemoryDisk`/`LocalDisk`
    -   Properly handled symlinks in directory listings for `MemoryDisk`/`LocalDisk`
    -   Proper errors from bad permissions for `MemoryDisk`/`LocalDisk`
    -   Multiple writes to the same file do truncate
    -   Listings always include directories first
-   [ ] Document the `Disk` API.
-   [ ] Document the `DiskManager` API.
-   [ ] Support `rimraf` for directories.
-   [ ] Support `force` for delete which doesn't to mimic `rm -f` which doesn't fail if the file isn't found.
-   [ ] Separate driver from remaining options so that the `driver` options doesn't have to be passed to `*Disk`
        constructors.
-   [ ] Wrap all unknown errors in an `UnknownDiskError` (maybe using `VError`?)
-   [ ] Ensure that when memfs is used, we always use the posix path module even on a win32 host FS (or otherwise
        verify that on win32, memfs uses win32 paths).
-   [ ] Proxy read and write streams so that errors emitted on streams can be wrapped
-   [ ] Upgrade `CodedError` to also contain a reference to the original system/driver error
-   [ ] LocalDisk config setting to filter directory listings by only accessible files/directories.
-   [ ] Support additional basic filesystem operations:
    -   [ ] Copy
    -   [ ] Move

## Development

This project is based on the `carimus-node-ts-package-template`. Check out the
[README and docs there](https://bitbucket.org/Carimus/carimus-node-ts-package-template/src/master/README.md)
for more up to date information on the development process and tools available.
