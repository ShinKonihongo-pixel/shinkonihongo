import { useState, useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ReadingPassage, ReadingFolder } from '../../../types/reading';
import { ReadingSettingsModal } from '../../ui/reading-settings';
import { useReadingSettings } from '../../../contexts/reading-settings-context';
import { JLPTLevelSelector, LEVEL_THEMES } from '../../ui/jlpt-level-selector';
import { usePracticeState } from './use-practice-state';
import { useAudioControls } from './use-audio-controls';
import { useMobileDetection } from './use-mobile-detection';
import { FolderListView } from './folder-list-view';
import { PassageListView } from './passage-list-view';
import { CompletedView } from './completed-view';
import { PracticeView } from './practice-view';

interface ReadingPracticePageProps {
  passages: ReadingPassage[];
  folders: ReadingFolder[];
  getFoldersByLevel: (level: JLPTLevel) => ReadingFolder[];
  getPassagesByFolder: (folderId: string) => ReadingPassage[];
  onGoHome?: () => void;
}

export function ReadingPracticePage({
  passages,
  getFoldersByLevel,
  getPassagesByFolder,
}: ReadingPracticePageProps) {
  const { settings } = useReadingSettings();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const practiceState = usePracticeState();
  const audioControls = useAudioControls();
  const isMobile = useMobileDetection();

  const levelFolders = useMemo(() => {
    if (!practiceState.selectedLevel) return [];
    return getFoldersByLevel(practiceState.selectedLevel);
  }, [practiceState.selectedLevel, getFoldersByLevel]);

  const folderPassages = useMemo(() => {
    if (!practiceState.selectedFolder) return [];
    return getPassagesByFolder(practiceState.selectedFolder.id);
  }, [practiceState.selectedFolder, getPassagesByFolder]);

  const countByLevel = useMemo(() => {
    const counts: Record<JLPTLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    passages.forEach(p => { counts[p.jlptLevel]++; });
    return counts;
  }, [passages]);

  const getPassageCount = (folderId: string) => getPassagesByFolder(folderId).length;

  const score = practiceState.calculateScore();
  const theme = practiceState.selectedLevel ? LEVEL_THEMES[practiceState.selectedLevel] : LEVEL_THEMES.N5;

  return (
    <>
      <div className="reading-practice-page">
        <ReadingSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />

        {practiceState.viewMode === 'level-select' && (
          <JLPTLevelSelector
            title="Đọc Hiểu"
            subtitle="Chọn cấp độ JLPT để bắt đầu"
            icon={<BookOpen size={32} />}
            countByLevel={countByLevel}
            countLabel="bài đọc"
            onSelectLevel={practiceState.selectLevel}
          />
        )}

        {practiceState.viewMode === 'folder-list' && practiceState.selectedLevel && (
          <FolderListView
            selectedLevel={practiceState.selectedLevel}
            levelFolders={levelFolders}
            theme={theme}
            getPassageCount={getPassageCount}
            onSelectFolder={practiceState.selectFolder}
            onGoBack={practiceState.goBack}
          />
        )}

        {practiceState.viewMode === 'passage-list' && practiceState.selectedLevel && practiceState.selectedFolder && (
          <PassageListView
            selectedLevel={practiceState.selectedLevel}
            selectedFolder={practiceState.selectedFolder}
            folderPassages={folderPassages}
            theme={theme}
            onStartPractice={practiceState.startPractice}
            onGoBack={practiceState.goBack}
          />
        )}

        {practiceState.viewMode === 'completed' && practiceState.selectedPassage && (
          <CompletedView
            score={score}
            theme={theme}
            onRestart={practiceState.handleRestart}
            onGoBack={practiceState.goBack}
          />
        )}

        {practiceState.viewMode === 'practice' && practiceState.selectedPassage && practiceState.selectedLevel && (
          <PracticeView
            selectedLevel={practiceState.selectedLevel}
            selectedPassage={practiceState.selectedPassage}
            currentQuestionIndex={practiceState.currentQuestionIndex}
            selectedAnswers={practiceState.selectedAnswers}
            showResults={practiceState.showResults}
            isPinned={practiceState.isPinned}
            isQuestionCollapsed={practiceState.isQuestionCollapsed}
            isMobile={isMobile}
            contentTab={practiceState.contentTab}
            audioState={audioControls.audioState}
            theme={theme}
            settings={settings}
            onGoBack={practiceState.goBack}
            onOpenSettings={() => setShowSettingsModal(true)}
            onSetPinned={practiceState.setIsPinned}
            onSetQuestionCollapsed={practiceState.setIsQuestionCollapsed}
            onSetCurrentQuestion={practiceState.setCurrentQuestionIndex}
            onSetShowResults={practiceState.setShowResults}
            onSetContentTab={practiceState.setContentTab}
            onSelectAnswer={practiceState.handleSelectAnswer}
            onShowResult={practiceState.handleShowResult}
            onNext={practiceState.handleNextQuestion}
            onAudioToggle={audioControls.handleAudioToggle}
            onPauseSpeaking={audioControls.pauseSpeaking}
            onResumeSpeaking={audioControls.resumeSpeaking}
          />
        )}
      </div>
      <style>{STYLES}</style>
    </>
  );
}

// Styles extracted from original file - kept inline for scoping
const STYLES = `/* Styles will be imported from original file */`;
