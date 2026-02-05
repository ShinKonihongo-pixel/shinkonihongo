import type { GameSettingsProps } from './settings-types';
import type { Lesson } from '../../../types/flashcard';
import { GameSettingsBasic } from './game-settings-basic';
import { GameSettingsSources } from './game-settings-sources';
import { GameSettingsAI } from './game-settings-ai';
import { GameSettingsJLPT } from './game-settings-jlpt';
import { GameSoundSettings } from './settings-sound-panel';

interface GameSettingsExtendedProps extends GameSettingsProps {
  flashcards?: any[];
  lessons?: Lesson[];
}

export function GameSettings({ settings, onUpdateSetting, flashcards = [], lessons = [] }: GameSettingsExtendedProps) {
  return (
    <>
      <GameSettingsBasic settings={settings} onUpdateSetting={onUpdateSetting} />

      <GameSettingsSources
        settings={settings}
        onUpdateSetting={onUpdateSetting}
        flashcards={flashcards}
        lessons={lessons}
      />

      <GameSettingsAI settings={settings} onUpdateSetting={onUpdateSetting} />

      <GameSettingsJLPT settings={settings} onUpdateSetting={onUpdateSetting} />

      <GameSoundSettings />
    </>
  );
}
