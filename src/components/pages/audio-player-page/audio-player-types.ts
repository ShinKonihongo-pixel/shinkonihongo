// Audio Player Page - Types and Constants
// Firebase audio-based listening practice

import { BookOpen, MessageCircle, FileText, Type, Quote, Layers } from 'lucide-react';
import type { ListeningLessonType } from '../../../types/listening';

export type ViewMode = 'level-select' | 'lesson-select' | 'type-select' | 'audio-player';

export const TYPE_ICONS: Record<ListeningLessonType, typeof BookOpen> = {
  practice: BookOpen,
  conversation: MessageCircle,
  reading: FileText,
  bunpou: Type,
  reibun: Quote,
  other: Layers,
};

export const TYPE_THEMES: Record<ListeningLessonType, { gradient: string; glow: string }> = {
  practice: { gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', glow: 'rgba(34, 197, 94, 0.4)' },
  conversation: { gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', glow: 'rgba(236, 72, 153, 0.4)' },
  reading: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.4)' },
  bunpou: { gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', glow: 'rgba(6, 182, 212, 0.4)' },
  reibun: { gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', glow: 'rgba(249, 115, 22, 0.4)' },
  other: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.4)' },
};
