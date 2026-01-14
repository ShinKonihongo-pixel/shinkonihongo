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
  isPublished: boolean;
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
