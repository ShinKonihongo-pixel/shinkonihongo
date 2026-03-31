// Audio list view with TTS forms and audio management
import { LEVEL_THEMES } from '../../../constants/themes';
import { LESSON_TYPES } from './listening-tab-types';
import { useGroq } from '../../../hooks/use-groq';
import { useKaiwaCharacters } from '../../../hooks/use-kaiwa-characters';
import { KaiwaCharacterModal } from '../kaiwa-character-modal';
import type { ListeningAudioViewProps } from './listening-audio-view-types';
import { useListeningAudioHandlers } from './use-listening-audio-handlers';
import { ListeningAudioHeader } from './listening-audio-header';
import { ListeningTtsForm } from './listening-tts-form';
import { ListeningUploadForm } from './listening-upload-form';
import { ListeningFolderList } from './listening-folder-list';
import { ListeningAudioList } from './listening-audio-list';
import './listening-shared.css';

export function ListeningAudioView({
  level, lessonNumber, lessonType, onBack,
  typeFolders, allAudios, getAudiosByFolder,
  onAddFolder, onUpdateFolder, onDeleteFolder,
  onAddAudio, onAddTextAudio, onUpdateAudio, onDeleteAudio,
  getAudioUrl, getFoldersByLevelLessonAndType,
  showAddFolder, setShowAddFolder,
  showAddAudio, setShowAddAudio,
  newFolderName, setNewFolderName,
  editingFolder, setEditingFolder,
  editingAudio, setEditingAudio,
  playingAudioId, setPlayingAudioId,
  audioTitle, setAudioTitle,
  audioDescription, setAudioDescription,
  selectedFile, setSelectedFile,
  fileInputRef, audioRef,
  showTextToSpeech, setShowTextToSpeech,
  ttsTitle, setTtsTitle,
  ttsText, setTtsText,
  ttsDescription, setTtsDescription,
  ttsPreviewing, setTtsPreviewing,
  ttsMode, setTtsMode,
  showCharacterModal, setShowCharacterModal,
  kaiwaLines, setKaiwaLines,
  generatingFurigana, setGeneratingFurigana,
}: ListeningAudioViewProps) {
  const theme = LEVEL_THEMES[level];
  const typeLabel = LESSON_TYPES.find(t => t.value === lessonType)?.label || '';

  const {
    characters: kaiwaCharacters, jaVoices,
    addCharacter, updateCharacter, deleteCharacter,
    getCharacterByName, getPresetForCharacter,
  } = useKaiwaCharacters();
  const { generateFurigana } = useGroq();

  const handlers = useListeningAudioHandlers({
    level, lessonNumber, lessonType, typeLabel,
    kaiwaCharacters, getCharacterByName, generateFurigana,
    audioTitle, setAudioTitle,
    audioDescription, setAudioDescription,
    selectedFile, setSelectedFile, fileInputRef,
    ttsTitle, setTtsTitle, ttsText, setTtsText, ttsDescription, setTtsDescription,
    ttsMode, ttsPreviewing, setTtsPreviewing, kaiwaLines, setKaiwaLines,
    editingAudio, setEditingAudio,
    editingFolder, setEditingFolder,
    newFolderName, setNewFolderName,
    setShowAddFolder, setShowAddAudio, setShowTextToSpeech,
    playingAudioId, setPlayingAudioId, audioRef,
    generatingFurigana, setGeneratingFurigana,
    onAddFolder, onUpdateFolder, onDeleteFolder,
    onAddAudio, onAddTextAudio, onUpdateAudio, onDeleteAudio,
    getAudioUrl, getFoldersByLevelLessonAndType,
  });

  return (
    <div className="listening-tab">
      <ListeningAudioHeader
        level={level} lessonNumber={lessonNumber} lessonType={lessonType}
        audioCount={allAudios.length} onBack={onBack}
        onShowUpload={() => { setShowAddAudio(true); setShowTextToSpeech(false); }}
        onShowTts={() => { setShowTextToSpeech(true); setShowAddAudio(false); }}
      />

      {showTextToSpeech && (
        <ListeningTtsForm
          ttsTitle={ttsTitle} setTtsTitle={setTtsTitle}
          ttsText={ttsText} setTtsText={setTtsText}
          ttsDescription={ttsDescription} setTtsDescription={setTtsDescription}
          ttsMode={ttsMode} setTtsMode={setTtsMode}
          ttsPreviewing={ttsPreviewing}
          kaiwaLines={kaiwaLines} setKaiwaLines={setKaiwaLines}
          kaiwaCharacters={kaiwaCharacters}
          getPresetForCharacter={getPresetForCharacter}
          generatingFurigana={generatingFurigana}
          onGenerateFuriganaTtsText={handlers.handleGenerateFuriganaTtsText}
          onPreviewTts={handlers.handlePreviewTts}
          onSave={handlers.handleAddTextAudio}
          onCancel={handlers.handleCancelTts}
          onShowCharacterModal={() => setShowCharacterModal(true)}
        />
      )}

      {showAddAudio && (
        <ListeningUploadForm
          audioTitle={audioTitle} setAudioTitle={setAudioTitle}
          audioDescription={audioDescription} setAudioDescription={setAudioDescription}
          selectedFile={selectedFile} fileInputRef={fileInputRef}
          generatingFurigana={generatingFurigana}
          onFileSelect={handlers.handleFileSelect}
          onGenerateFuriganaTitle={handlers.handleGenerateFuriganaTitle}
          onGenerateFuriganaDesc={handlers.handleGenerateFuriganaDesc}
          onSave={handlers.handleAddAudio}
          onCancel={handlers.handleCancelUpload}
        />
      )}

      <ListeningFolderList
        typeFolders={typeFolders} getAudiosByFolder={getAudiosByFolder}
        showAddFolder={showAddFolder} setShowAddFolder={setShowAddFolder}
        newFolderName={newFolderName} setNewFolderName={setNewFolderName}
        editingFolder={editingFolder} setEditingFolder={setEditingFolder}
        onAddFolder={handlers.handleAddFolder}
        onUpdateFolder={handlers.handleUpdateFolder}
        onDeleteFolder={handlers.handleDeleteFolder}
      />

      <ListeningAudioList
        allAudios={allAudios} playingAudioId={playingAudioId}
        editingAudio={editingAudio} setEditingAudio={setEditingAudio}
        kaiwaCharacters={kaiwaCharacters} generatingFurigana={generatingFurigana}
        level={level} levelGradient={theme.gradient}
        onTogglePlay={handlers.togglePlayAudio}
        onUpdateTtsAudio={handlers.handleUpdateTtsAudio}
        onDeleteAudio={handlers.handleDeleteAudio}
        onGenerateFuriganaEditText={handlers.handleGenerateFuriganaEditText}
      />

      {showCharacterModal && (
        <KaiwaCharacterModal
          characters={kaiwaCharacters} jaVoices={jaVoices}
          onAdd={addCharacter} onUpdate={updateCharacter} onDelete={deleteCharacter}
          onClose={() => setShowCharacterModal(false)}
        />
      )}

      <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />
    </div>
  );
}
