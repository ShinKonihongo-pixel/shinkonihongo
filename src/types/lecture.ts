// Lecture/Slideshow types for Japanese learning app

import type { JLPTLevel } from './flashcard';

// Slide layout types
export type SlideLayout =
  | 'title'       // Title slide with centered content
  | 'content'     // Standard content slide
  | 'two-column'  // Two column layout
  | 'image-left'  // Image on left, text on right
  | 'image-right' // Image on right, text on left
  | 'full-media'; // Full screen media (image/video)

// Element types that can be placed on slides
export type SlideElementType = 'text' | 'image' | 'video' | 'audio' | 'flashcard';

// Individual element on a slide
export interface SlideElement {
  id: string;
  type: SlideElementType;
  content: string; // Text content, media URL, or flashcard ID
  position: {
    x: number;      // Percentage from left (0-100)
    y: number;      // Percentage from top (0-100)
    width: number;  // Percentage width (0-100)
    height: number; // Percentage height (0-100)
  };
  style?: {
    fontSize?: string;
    fontWeight?: string;
    fontStyle?: string;
    color?: string;
    textAlign?: string;
    backgroundColor?: string;
  };
}

// Animation types for slide elements
export type SlideAnimation =
  | 'none'
  | 'fade-in'
  | 'fade-out'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'bounce'
  | 'rotate';

// Transition types for page navigation
export type SlideTransition =
  | 'none'
  | 'fade'
  | 'slide-horizontal'
  | 'slide-vertical'
  | 'zoom'
  | 'flip'
  | 'cube'
  | 'dissolve';

// Individual slide
export interface Slide {
  id: string;
  lectureId: string;
  order: number;
  layout: SlideLayout;
  title?: string;
  elements: SlideElement[];
  backgroundColor?: string;
  backgroundImage?: string;
  notes?: string; // Speaker notes (not shown in presentation)
  animation?: SlideAnimation; // Animation for slide content
  transition?: SlideTransition; // Transition when navigating to this slide
  animationDuration?: number; // Duration in ms (default 500)
}

// Lecture folder (similar to Lesson for flashcards)
export interface LectureFolder {
  id: string;
  name: string;
  jlptLevel: JLPTLevel;
  createdBy: string;
  createdAt: string;
  order: number;
}

// Lecture (collection of slides)
export interface Lecture {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  authorId: string;
  authorName: string;
  jlptLevel: JLPTLevel;
  folderId?: string; // Optional folder grouping
  isPublished: boolean;
  isHidden: boolean;  // Ẩn bài giảng (chỉ creator/super_admin thấy)
  createdAt: string;
  updatedAt: string;
  slideCount: number;
  viewCount: number;
  tags?: string[];
}

// Form data for creating/editing lectures
export interface LectureFormData {
  title: string;
  description?: string;
  coverImage?: string;
  jlptLevel: JLPTLevel;
  folderId?: string;
  isPublished: boolean;
  tags?: string[];
}

// Form data for creating/editing slides
export interface SlideFormData {
  layout: SlideLayout;
  title?: string;
  elements: SlideElement[];
  backgroundColor?: string;
  backgroundImage?: string;
  notes?: string;
  animation?: SlideAnimation;
  transition?: SlideTransition;
  animationDuration?: number;
}

// View tracking
export interface LectureView {
  id: string;
  lectureId: string;
  userId: string;
  viewedAt: string;
  lastSlideViewed: number;
  completed: boolean;
}
