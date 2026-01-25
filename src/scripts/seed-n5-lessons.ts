// Script to seed lessons with child folders
// Run this once to populate the database

import { addLesson, updateLesson } from '../services/firestore';
import type { Lesson, JLPTLevel } from '../types/flashcard';

const CHILD_FOLDERS = ['Từ vựng', 'Kanji', 'Ngữ pháp', 'Đọc hiểu', 'Mở rộng'];

// Generic function to seed lessons for any level
async function seedLessons(
  level: JLPTLevel,
  startNum: number,
  endNum: number,
  createdBy: string
): Promise<{ success: boolean; created: number }> {
  let created = 0;

  try {
    for (let i = startNum; i <= endNum; i++) {
      const lessonName = `Bài ${i}`;

      // Create parent lesson
      const parentLesson: Omit<Lesson, 'id'> = {
        name: lessonName,
        jlptLevel: level,
        parentId: null,
        order: i,
        isLocked: false,
        isHidden: false,
        createdBy,
      };

      const newParent = await addLesson(parentLesson);
      created++;

      // Create child folders
      for (let j = 0; j < CHILD_FOLDERS.length; j++) {
        const childLesson: Omit<Lesson, 'id'> = {
          name: CHILD_FOLDERS[j],
          jlptLevel: level,
          parentId: newParent.id,
          order: j + 1,
          isLocked: false,
          isHidden: false,
          createdBy,
        };

        await addLesson(childLesson);
        created++;
      }

      console.log(`[${level}] Created ${lessonName} with ${CHILD_FOLDERS.length} child folders`);
    }

    return { success: true, created };
  } catch (error) {
    console.error('Error seeding lessons:', error);
    return { success: false, created };
  }
}

// N5: Bài 2-25
export async function seedN5Lessons(createdBy: string): Promise<{ success: boolean; created: number }> {
  return seedLessons('N5', 2, 25, createdBy);
}

// N4: Bài 26-50
export async function seedN4Lessons(createdBy: string): Promise<{ success: boolean; created: number }> {
  return seedLessons('N4', 26, 50, createdBy);
}

// Fix order for a specific lesson (make Bài 1 appear first)
export async function fixLessonOrder(
  lessons: Lesson[],
  lessonName: string,
  level: JLPTLevel,
  newOrder: number
): Promise<boolean> {
  const lesson = lessons.find(
    l => l.name === lessonName && l.jlptLevel === level && l.parentId === null
  );

  if (!lesson) {
    console.error(`Lesson "${lessonName}" not found in ${level}`);
    return false;
  }

  await updateLesson(lesson.id, { order: newOrder });
  console.log(`Updated ${lessonName} order to ${newOrder}`);
  return true;
}
