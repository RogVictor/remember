import * as migration_20261020_163756_initial_schema from './20261020_163756_initial_schema';
import * as migration_20261119_130931 from './20261119_130931';

export const migrations = [
  {
    up: migration_20261020_163756_initial_schema.up,
    down: migration_20261020_163756_initial_schema.down,
    name: '20261020_163756_initial_schema',
  },
  {
    up: migration_20261119_130931.up,
    down: migration_20261119_130931.down,
    name: '20261119_130931'
  },
];
