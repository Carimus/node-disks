# Node Disks

An abstraction for local/remote disks for node inspired by The League of Extraordinary Packages's
FlySystem.

## Prerequisites

-   Node >= 10.10 (requires support for `withFileTypes` in `fs.readdir`)

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
import { Disk, LocalDisk, S3Disk } from '@carimus/node-disks';

const foo: Disk = new LocalDisk({ root: '/tmp' });
const bar: Disk = new S3Disk({ bucket: 'test' });

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

### Option B: Use a Disk Manager

`node-disks` also ships with a `DiskManager` that you can provide a single, declarative
configuration up front and then load disks by name from that config.

For example, considering the two disks in **Option A** below, we could have instead
done:

```typescript
import { DiskManager, Disk } from '@carimus/node-disks';

const diskManager = new DiskManager({
    default: 'foo',
    foo: {
        driver: 'local',
        root: '/tmp',
    },
    bar: {
        driver: 's3',
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

An in-memory disk whose contents will be forgotten when the node process ends.

**Warning:** Currently this driver uses a global in-memory disk. Multiple instances using this
driver will share the same in-memory filesystem. This is on the roadmap to be fixed by allowing
a `root` option to be specified just like with the local disk. Additionally there is the possibility
to add a `MemoryVolumeDisk` that uses [`memfs`](https://github.com/streamich/memfs)'s `Volume` which
gives each instance its own in memory filesystem isolated from all others.

#### Optoins

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

### `DiskManager`

More detailed docs are TODO. [Check out the source](./src/lib/DiskManager.ts)
for inline documentation and types.

-   `constructor(config: DiskManagerConfig)` create the disk manager with a map of disk names to
    their configuration object containing at least a `driver` property and then additionally
    whatever required config options that specific driver needs. Or a string, which is treated as
    an alias for another disk.
-   `async geDisk(name: string, options: DiskManagerOptions): Disk` to get a disk by name (allowing
    for aliases in config).

## TODO

-   [ ] Write tests for `S3Disk`.
-   [ ] Write tests for `LocalDisk`.
-   [ ] Write tests for `MemoryDisk`.
-   [ ] Document the `Disk` API.
-   [ ] Document the `DiskManager` API.
-   [ ] Don't rely on `fs.readdir`'s `withFileTypes` so as to support all node 10 versions.
-   [ ] Write a `MemoryVolumeDisk` driver.
-   [ ] Fix the `MemoryDisk` driver to accept and honor `root` like the `LocalDisk` does.
-   [ ] Support `rimraf` for directories.
-   [ ] Fix `FSDisk` (backend to `MemoryDisk` and `LocalDisk`) to `mkdirp` path to file to mirror s3 behaviour.
-   [ ] When a file is deleted on `FSDisk` and its the only file in the directory, delete the directory, following the
        path backwards to do the same to get rid of all fs tree leaves.
-   [ ] Support `force` for delete which doesn't to mimic `rm -f` which doesn't fail if the file isn't found.

## Development

This project is based on the `carimus-node-ts-package-template`. Check out the
[README and docs there](https://bitbucket.org/Carimus/carimus-node-ts-package-template/src/master/README.md)
for more up to date information on the development process and tools available.
