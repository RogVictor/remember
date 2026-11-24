import * as migration_20261020_163756_initial_schema from './20261020_163756_initial_schema';
import * as migration_20261119_130931 from './20261119_130931';
import * as migration_20261119_233002_chat from './20261119_233002_chat';
import * as migration_20261124_111651_hero_image from './20261124_111651_hero_image';
import * as migration_20261124_115231_service_page from './20261124_115231_service_page';

export const migrations = [
  {
    up: migration_20261020_163756_initial_schema.up,
    down: migration_20261020_163756_initial_schema.down,
    name: '20261020_163756_initial_schema',
  },
  {
    up: migration_20261119_130931.up,
    down: migration_20261119_130931.down,
    name: '20261119_130931',
  },
  {
    up: migration_20261119_233002_chat.up,
    down: migration_20261119_233002_chat.down,
    name: '20261119_233002_chat',
  },
  {
    up: migration_20261124_111651_hero_image.up,
    down: migration_20261124_111651_hero_image.down,
    name: '20261124_111651_hero_image',
  },
  {
    up: migration_20261124_115231_service_page.up,
    down: migration_20261124_115231_service_page.down,
    name: '20261124_115231_service_page'
  },
];
