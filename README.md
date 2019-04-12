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
import { Disk, LocalDisk, S3Disk, pipeStreams } from '@carimus/node-disks';

const foo: Disk = new LocalDisk({ root: '/tmp' });
const bar: Disk = new S3Disk({ bucket: 'test' });

// Wrap everything in a self-executing async function.
(async () => {
    // Write a file to the foo disk
    await foo.write('foo.txt', 'This is a foo file');

    // Log out the contents of foo.txt
    console.log(await foo.read('foo.txt'));

    // Stream the file from the foo disk to the bar disk as bar.txt
    const fooReadStream = await foo.createReadStream('foo.txt');
    const barWriteStream = await bar.createWriteStream('bar.txt');
    await pipeStreams(fooReadStream, barWriteStream);

    // Get a listing of the bar disk contents and store it on the foo disk.
    const s3Listing = await bar.list();
    await foo.write('s3listing.json', JSON.stringify(s3Listing, null, 2));

    // Delete the files we created
    await foo.delete('foo.txt');
    await foo.delete('s3listing.json');
    await bar.delete('bar.txt');
})();
```

### Option B: Use a Disk Manager

`node-disks` also ships with a `DiskManager` that you can provide a single, declarative
configuration up front and then load disks by name from that config.

For example, considering the two disks in **Option A** below, we could have instead
done:

```typescript
import { DiskManager, Disk, DiskDriver } from '@carimus/node-disks';

const diskManager = new DiskManager({
    // `default` MUST be an alias to another disk. All other keys can be aliases (strings) or objects.
    default: 'foo',
    foo: {
        driver: DiskDriver.Local,
        config: {
            root: '/tmp',
        },
    },
    bar: {
        driver: DiskDriver.S3,
        config: {
            bucket: 'test',
        },
    },
    baz: 'bar', // Alias the baz disk name to the bar S3 disk.
});

const foo: Disk = diskManager.getDisk('foo');
const bar: Disk = diskManager.getDisk('bar');

// Use `foo` and `bar` not worrying about their implementation like in Option A.
```

## Supported Drivers and Options

### Common

All drivers inherit from and implement the abstract [`Disk`](#disk-abstract-class) class and as such inherit some
default base functionality and options.

#### Common Disk Options

| Name                   | Type    | Description                                                                                                |
| ---------------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `url`                  | string  | Optional; If the disk supports URLs, this is the base URL to prepend to paths                              |
| `temporaryUrlExpires`  | number  | Optional; If the disk supports temp URLs, how many seconds after generation do they expire? Default 1 day. |
| `temporaryUrlFallback` | boolean | Optional; If the disk supports URLs but not temp URLs, should it by default fallback to permanent URLs?    |

### Memory

**Driver name:** `'memory'` (`DiskDriver.Memory`)

**`Disk` class:** `MemoryDisk`

**`DiskConfig` interface:** [`DiskConfig`](./src/lib/types.ts#L4) (no extra config outside of common `DiskConfig`)

An in-memory disk whose contents will be forgotten when the node process ends. Each instance of the `MemoryDisk` has
its own isolated filesystem.

#### Memory Disk Options

Takes no options.

### Local

**Driver name:** `'local'` (`DiskDriver.Local`)

**`Disk` class:** `LocalDisk`

**`DiskConfig` interface:** [`LocalDiskConfig`](./src/drivers/local/types.ts#L3)

A disk that uses the local filesystem.

#### Local Disk Options

| Name   | Type   | Description                                                                                         |
| ------ | ------ | --------------------------------------------------------------------------------------------------- |
| `root` | string | Required; The absolute path to thee directory where files should be stored on the local filesystem. |

### S3

**Driver name:** `'s3'` (`DiskDriver.S3`)

**`Disk` class:** `S3Disk`

**`DiskConfig` interface:** [`S3DiskConfig`](./src/drivers/s3/types.ts#L4)

A disk that uses a remote AWS S3 bucket.

#### S3 Disk Options

| Name              | Type   | Description                                                                                                               |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| `bucket`          | string | Required; The S3 bucket to use.                                                                                           |
| `root`            | string | Optional; The prefix to use for storing objects in the bucket. Defaults to the root                                       |
| `pagingLimit`     | number | Optional; Num of max results to fetch when paging through an S3 `listObjectsV2` call. Defaults to `1000`, the max.        |
| `expires`         | number | Optional; Number of seconds from time of upload to set `Expires` and `Cache-Control` for `putObject` calls.               |
| `putParams`       | object | Optional; Additional params to merge into all `putObject` calls                                                           |
| `clientConfig`    | object | Optional; Options to pass to the `AWS.S3` client constructor. Can be used to pass credentials if not using env variables. |
| `autoContentType` | bool   | Optional; Use the `mime` library to guess `ContentType` for write operations. Defaults to `true`                          |

## API

### [`Disk`](./src/lib/Disk.ts) Abstract Class

#### Methods

-   `async read(path: string): Promise<Buffer>` to read a file into memory
-   `async createReadStream(path: string): Promise<Readable>` to obtain a readable stream to a file
-   `async write(path: string, contents: Buffer): Promise<void>` to write to a file
-   `async createReadStream(path: string): Promise<Writable>` to obtain a writable stream to a file
-   `async delete(path: string): Promise<void>` to delete a file (not a directory)
-   `async list(path: string): Promise<DiskListingObject[]>` to obtain a list of objects in a
    directory on the disk.
-   `getName(): string | null` to get the name of the disk if it was created with one. The `DiskManager` will
    automatically and appropriately set this to the actual resolved name of the disk from the config.
-   `getUrl(path: string): string | null` to get a URL to an object if the disk supports it and is configured
    appropriately. If the disk doesn't support URLs, `null` is returned.
-   `getTemporaryUrl(path: string, expires: number, fallback: boolean): string | null` to get a temporary URL to an
    object if the disk supports it and is configured appropriately. This method by default won't fallback to
    generating permanent URLs but can if `fallback` is explicitly passed as `true` or if the disk is configured with
    `temporaryUrlFallback` set to `true`. If the disk doesn't support temporary URLs and can't fallback to permanent
    URLs, `null` is returned.
-   `isTemporaryUrlValid(temporaryUrl: string, against: number | Date = Date.now()): boolean | null` to determine if
    a temporary URL generated with `getTemporaryUrl` is valid (i.e. unexpired). Will return `null` if the URL can't
    be determined either way or if the disk does not support temporary URLs.
-   `async withTempFile(path: string, execute: ((path: string) => Promise<void> | void) | null, extraOptions?: import('tmp').FileOptions): Promise<string>`
    to stream the contents of a file from the disk to a temporary file on the local filesystem for performing operations
    that are easier (or more performant, etc.) to do with local data on the disk as opposed to in memory
    (e.g. `disk.read(path)`).
    -   The caller can pass an async `execute` callback which will get a string path to the temp
        file that contains the disk file's contents. Once `execute` returns/resolves, the file will be automatically
        deleted. If an `execute` callback is not provided, the function will resolve with the path to the temp file.
        **IMPORTANT:** it's the caller's responsibility using this approach to `unlink` the file when they're done with
        it.
    -   This functionality is achieved using `tmp`. You can pass any additional `FileOptions` through to `tmp` (i.e.
        `prefix`) using the third parameter `extraOptions`.

### [`MemoryDisk`](./src/drivers/memory/MemoryDisk.ts) Class (extends [`Disk`](#disk-abstract-class))

#### Methods

-   `constructor(config: MemoryDiskConfig, name?: string)` to create the disk.
    -   See [Memory Disk Options](#memory-disk-options) above for a list of config options you can pass
        to this disk.

### [`LocalDisk`](./src/drivers/local/LocalDisk.ts) Class (extends [`Disk`](#disk-abstract-class))

#### Methods

-   `constructor(config: LocalDiskConfig, name?: string)` to create the disk.
    -   See [`LocalDiskConfig` Options](#local-disk-options) above for a list of config options you can pass
        to this disk.

### [`S3Disk`](./src/drivers/s3/S3Disk.ts) Class (extends [`Disk`](#disk-abstract-class))

#### Methods

-   `constructor(config: S3DiskConfig, name?: string, s3Client?: AWS.S3)` to create the disk, optionally taking a
    pre-initialized S3 client instead of creating a new one.
    -   See [`S3DiskConfig` Options](#s3-disk-options) above for a list of config options you can pass
        to this disk.

### [`DiskManager`](./src/lib/manager/DiskManager.ts) Class

#### Methods

-   `constructor(config: DiskManagerConfig)` create the disk manager with a map of disk names to
    their specification object containing at least a `driver` property and then additionally a `config`
    property containing whatever required config options that specific driver needs. Or a string, which
    is treated as an alias for another disk in the `DiskManagerConfig`
-   `async getDisk(name: string, options: GetDiskOptions): Disk` to get a disk by name. Some disks require runtime
    options that aren't optimal to pass through config. Those are provided in the second argument here.

### `DiskListingObject` Interface

#### Properties

-   `name`: the name of the file or directory
-   `type`: the type (file or directory), see [`DiskObjectType`](#diskobjecttype-enum)

### `DiskObjectType` Enum

#### Values

Indicates the type of an object on the disk.

-   `DiskObjectType.File`: a file
-   `DiskObjectType.Directory`: a directory

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
-   [ ] Wrap all unknown errors in an `UnknownDiskError` (maybe using `VError`?)
-   [ ] Ensure that when memfs is used, we always use the posix path module even on a win32 host FS (or otherwise
        verify that on win32, memfs uses win32 paths).
-   [ ] Proxy read and write streams so that errors emitted on streams can be wrapped
-   [ ] Upgrade `CodedError` to also contain a reference to the original system/driver error
-   [ ] LocalDisk config setting to filter directory listings by only accessible files/directories.
-   [ ] Support additional basic filesystem operations:
    -   [ ] Copy
    -   [ ] Move
    -   [ ] Delete many (globs??)
    -   [ ] Delete directories (`rimraf`)
    -   [ ] Support `force` delete option for not failing when file isn't found and does rimraf for directories.

## Development

This project is based on the `carimus-node-ts-package-template`. Check out the
[README and docs there](https://bitbucket.org/Carimus/carimus-node-ts-package-template/src/master/README.md)
for more up to date information on the development process and tools available.
