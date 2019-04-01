import { DiskConfig } from '../../lib/types';

export interface LocalDiskConfig extends DiskConfig {
    /**
     * The directory where files should be stored on the local disk. If this path is relative, it's resolved from
     * the server processes current working directory. The user that the node process is running under should have
     * full read/write/execute permissions on this directory.
     */
    root?: string;

    /**
     * The base URL to use when generating paths to the files on the disk without a trailing slash.
     *
     * The root path is not automatically prepended to file paths so if you override this, be sure to include
     * the root path if necessary.
     *
     * This defaults to `'file://<root>'`.
     */
    url?: string;
}
