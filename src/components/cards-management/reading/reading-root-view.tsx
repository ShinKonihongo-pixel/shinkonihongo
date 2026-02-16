// Reading Tab - Root View (Level Selection)

import { LevelGrid } from '../level-grid';
import type { RootViewProps } from './reading-tab-types';

export function ReadingRootView({ onSelectLevel, getPassageCountByLevel }: RootViewProps) {
  return (
    <div className="rt-content">
      <LevelGrid
        onSelectLevel={onSelectLevel}
        getCount={getPassageCountByLevel}
        countLabel="bài đọc"
      />
    </div>
  );
}
