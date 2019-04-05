import { FSDisk } from '../../lib/fs/FSDisk';
import { FSModule } from '../..';
import VError = require('verror');

export class MemoryDisk extends FSDisk {
    /**
     * Return an in-memory volume using memfs.
     */
    protected getFSModule(): FSModule {
        let fs = null;
        try {
            fs = require('memfs').fs;
        } catch (error) {
            throw new VError(
                error,
                'Failed to import memfs. Ensure it is installed if you wish to use the Memory disk driver.',
            );
        }
        return fs;
    }

    /**
     * Just use the root of the in-memory filesystem.
     */
    public getRootPath(): string {
        return '/';
    }
}
