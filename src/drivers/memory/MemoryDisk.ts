import { FSDisk } from '../../lib/fs/FSDisk';
import { AsyncFSModule } from '../..';
import { VolumeFSModule } from './VolumeFSModule';
import VError = require('verror');

export class MemoryDisk extends FSDisk {
    /**
     * Return an in-memory volume using memfs.
     */
    protected getAsyncFsModule(): AsyncFSModule {
        let Volume = null;
        try {
            Volume = require('memfs').Volume;
        } catch (error) {
            throw new VError(
                error,
                'Failed to import memfs. Ensure the correct version is installed if you wish to use the Memory disk driver.',
            );
        }
        return new VolumeFSModule(new Volume());
    }

    /**
     * Just use the root of the in-memory filesystem.
     */
    public getRootPath(): string {
        return '/';
    }
}
