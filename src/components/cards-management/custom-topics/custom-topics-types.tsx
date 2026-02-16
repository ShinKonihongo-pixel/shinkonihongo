// Custom Topics Types and Constants
import {
  Briefcase, Building2, Handshake, Presentation, Landmark, GraduationCap,
  BookOpen, Library, PencilRuler, Brain, Laptop, Code2, Database, Globe,
  Smartphone, Plane, MapPin, Compass, Mountain, HeartPulse, Stethoscope,
  Home, Users, Utensils, MessageSquare, Mic, Mail, Phone, Video,
  Palette, Music, Camera, Film, Sparkles
} from 'lucide-react';
import type {
  CustomTopic,
  CustomTopicFolder,
  CustomTopicQuestion,
  CustomTopicFormData,
  CustomTopicQuestionFormData,
} from '../../../types/custom-topic';
import type { JLPTLevel } from '../../../types/kaiwa';
import type { Lesson, GrammarLesson } from '../../../types/flashcard';
import type { CurrentUser } from '../../../types/user';

// Re-export types for convenience
export type {
  CustomTopic,
  CustomTopicFolder,
  CustomTopicQuestion,
  CustomTopicFormData,
  CustomTopicQuestionFormData,
};

// Navigation types
export type ViewMode = 'grid' | 'list';
export type NavType = 'topics' | 'topic-detail' | 'folder-detail';
export type DetailSessionTab = 'sources' | 'questions';

export interface NavState {
  type: NavType;
  topicId?: string;
  folderId?: string;
}

// Props interface
export interface CustomTopicsTabProps {
  topics: CustomTopic[];
  folders: CustomTopicFolder[];
  questions: CustomTopicQuestion[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
  lessons?: Lesson[];
  getLessonsByLevel?: (level: JLPTLevel) => Lesson[];
  grammarLessons?: GrammarLesson[];
  getGrammarLessonsByLevel?: (level: JLPTLevel) => GrammarLesson[];
  onAddTopic: (data: CustomTopicFormData) => Promise<CustomTopic | null>;
  onUpdateTopic: (id: string, data: Partial<CustomTopicFormData>) => Promise<boolean>;
  onDeleteTopic: (id: string) => Promise<boolean>;
  onAddFolder: (topicId: string, name: string, level?: JLPTLevel) => Promise<CustomTopicFolder | null>;
  onUpdateFolder: (id: string, name: string, level?: JLPTLevel) => Promise<boolean>;
  onDeleteFolder: (id: string) => Promise<boolean>;
  onAddQuestion: (data: CustomTopicQuestionFormData) => Promise<CustomTopicQuestion | null>;
  onUpdateQuestion: (id: string, data: Partial<CustomTopicQuestionFormData>) => Promise<boolean>;
  onDeleteQuestion: (id: string) => Promise<boolean>;
  onExportTopic?: (topicId: string) => void;
  onImportTopic?: (data: unknown) => Promise<boolean>;
}

// Icon mapping
export const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'briefcase': Briefcase,
  'building-2': Building2,
  'handshake': Handshake,
  'presentation': Presentation,
  'landmark': Landmark,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  'library': Library,
  'pencil-ruler': PencilRuler,
  'brain': Brain,
  'laptop': Laptop,
  'code-2': Code2,
  'database': Database,
  'globe': Globe,
  'smartphone': Smartphone,
  'plane': Plane,
  'map-pin': MapPin,
  'compass': Compass,
  'mountain': Mountain,
  'heart-pulse': HeartPulse,
  'stethoscope': Stethoscope,
  'home': Home,
  'users': Users,
  'utensils': Utensils,
  'message-square': MessageSquare,
  'mic': Mic,
  'mail': Mail,
  'phone': Phone,
  'video': Video,
  'palette': Palette,
  'music': Music,
  'camera': Camera,
  'film': Film,
  'sparkles': Sparkles,
};

// Render icon component from name
export function renderTopicIcon(iconName: string, size: number = 20, className?: string) {
  const IconComponent = ICON_MAP[iconName];
  if (IconComponent) {
    return <IconComponent size={size} className={className} />;
  }
  // Fallback for legacy emoji icons
  return <span style={{ fontSize: size }}>{iconName}</span>;
}
