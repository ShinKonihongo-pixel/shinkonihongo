// Constants for lecture page

import type { LevelConfig } from './types';

export const LEVEL_CONFIG: LevelConfig = {
  levels: ['N5', 'N4', 'N3', 'N2', 'N1'],
  colors: {
    N5: '#27ae60',
    N4: '#3498db',
    N3: '#9b59b6',
    N2: '#e67e22',
    N1: '#e74c3c',
  },
  descriptions: {
    N5: 'Sơ cấp - Cơ bản',
    N4: 'Sơ cấp - Nâng cao',
    N3: 'Trung cấp',
    N2: 'Trung cao cấp',
    N1: 'Cao cấp',
  },
};

export const AUTO_ADVANCE_INTERVALS = [5, 10, 15, 20, 30];
