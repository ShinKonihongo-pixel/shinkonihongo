// Firestore service for Lecture/Slideshow operations

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Lecture, LectureFormData, Slide, SlideFormData, LectureView, LectureFolder } from '../types/lecture';
import type { JLPTLevel } from '../types/flashcard';

// Collection names
const COLLECTIONS = {
  LECTURES: 'lectures',
  SLIDES: 'slides',
  LECTURE_VIEWS: 'lectureViews',
  LECTURE_FOLDERS: 'lectureFolders',
} as const;

function getNowISO(): string {
  return new Date().toISOString();
}

// ============ LECTURES ============

export async function getAllLectures(): Promise<Lecture[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.LECTURES));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lecture));
}

export async function getPublishedLectures(): Promise<Lecture[]> {
  const q = query(
    collection(db, COLLECTIONS.LECTURES),
    where('isPublished', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lecture));
}

export function subscribeToLectures(callback: (lectures: Lecture[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.LECTURES), (snapshot) => {
    const lectures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lecture));
    callback(lectures);
  });
}

export function subscribeToPublishedLectures(callback: (lectures: Lecture[]) => void): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.LECTURES),
    where('isPublished', '==', true)
  );
  return onSnapshot(q, (snapshot) => {
    const lectures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lecture));
    callback(lectures);
  });
}

export async function getLectureById(id: string): Promise<Lecture | null> {
  const docRef = doc(db, COLLECTIONS.LECTURES, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Lecture;
}

export async function addLecture(
  data: LectureFormData,
  authorId: string,
  authorName: string
): Promise<Lecture> {
  const now = getNowISO();
  const newLecture: Omit<Lecture, 'id'> = {
    ...data,
    authorId,
    authorName,
    isHidden: false,
    createdAt: now,
    updatedAt: now,
    slideCount: 0,
    viewCount: 0,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.LECTURES), newLecture);
  return { id: docRef.id, ...newLecture };
}

export async function updateLecture(id: string, data: Partial<Lecture>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.LECTURES, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: getNowISO(),
  });
}

export async function deleteLecture(id: string): Promise<void> {
  // Delete all slides first
  const slidesQuery = query(
    collection(db, COLLECTIONS.SLIDES),
    where('lectureId', '==', id)
  );
  const slidesSnapshot = await getDocs(slidesQuery);
  const deleteSlidePromises = slidesSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deleteSlidePromises);

  // Delete views
  const viewsQuery = query(
    collection(db, COLLECTIONS.LECTURE_VIEWS),
    where('lectureId', '==', id)
  );
  const viewsSnapshot = await getDocs(viewsQuery);
  const deleteViewPromises = viewsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deleteViewPromises);

  // Delete lecture
  const docRef = doc(db, COLLECTIONS.LECTURES, id);
  await deleteDoc(docRef);
}

export async function incrementViewCount(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.LECTURES, id);
  await updateDoc(docRef, {
    viewCount: increment(1),
  });
}

// ============ SLIDES ============

export async function getSlidesByLecture(lectureId: string): Promise<Slide[]> {
  const q = query(
    collection(db, COLLECTIONS.SLIDES),
    where('lectureId', '==', lectureId),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slide));
}

export function subscribeToSlides(
  lectureId: string,
  callback: (slides: Slide[]) => void
): Unsubscribe {
  // Try simple query without orderBy first (avoids composite index requirement)
  const q = query(
    collection(db, COLLECTIONS.SLIDES),
    where('lectureId', '==', lectureId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      // Sort by order in JavaScript instead of Firestore
      const slides = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Ensure elements is always an array
            elements: Array.isArray(data.elements) ? data.elements : [],
          } as Slide;
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      callback(slides);
    },
    (error) => {
      console.error('Firestore subscribeToSlides error:', error);
      callback([]);
    }
  );
}

// Remove undefined values from object (Firestore doesn't accept undefined)
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  const cleaned = {} as T;
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

export async function addSlide(
  lectureId: string,
  data: SlideFormData,
  order: number
): Promise<Slide> {
  // Clean data - remove undefined fields
  const cleanedData = removeUndefined(data as unknown as Record<string, unknown>) as unknown as SlideFormData;

  const newSlide: Omit<Slide, 'id'> = {
    ...cleanedData,
    lectureId,
    order,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.SLIDES), newSlide);

  // Update lecture slide count
  const lectureRef = doc(db, COLLECTIONS.LECTURES, lectureId);
  await updateDoc(lectureRef, {
    slideCount: increment(1),
    updatedAt: getNowISO(),
  });

  return { id: docRef.id, ...newSlide };
}

export async function updateSlide(id: string, data: Partial<Slide>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SLIDES, id);
  const cleanedData = removeUndefined(data as Record<string, unknown>);
  await updateDoc(docRef, cleanedData);
}

export async function deleteSlide(id: string, lectureId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SLIDES, id);
  await deleteDoc(docRef);

  // Update lecture slide count
  const lectureRef = doc(db, COLLECTIONS.LECTURES, lectureId);
  await updateDoc(lectureRef, {
    slideCount: increment(-1),
    updatedAt: getNowISO(),
  });
}

export async function reorderSlides(slides: { id: string; order: number }[]): Promise<void> {
  const updatePromises = slides.map(({ id, order }) => {
    const docRef = doc(db, COLLECTIONS.SLIDES, id);
    return updateDoc(docRef, { order });
  });
  await Promise.all(updatePromises);
}

// ============ LECTURE VIEWS ============

export async function recordLectureView(
  lectureId: string,
  userId: string,
  lastSlideViewed: number,
  completed: boolean
): Promise<void> {
  // Check if view exists
  const q = query(
    collection(db, COLLECTIONS.LECTURE_VIEWS),
    where('lectureId', '==', lectureId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // First view - increment count and create record
    await incrementViewCount(lectureId);
    await addDoc(collection(db, COLLECTIONS.LECTURE_VIEWS), {
      lectureId,
      userId,
      viewedAt: getNowISO(),
      lastSlideViewed,
      completed,
    });
  } else {
    // Update existing view
    const existingDoc = snapshot.docs[0];
    await updateDoc(existingDoc.ref, {
      viewedAt: getNowISO(),
      lastSlideViewed,
      completed: completed || existingDoc.data().completed,
    });
  }
}

export async function getLectureViewsByUser(userId: string): Promise<LectureView[]> {
  const q = query(
    collection(db, COLLECTIONS.LECTURE_VIEWS),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LectureView));
}

// ============ LECTURE FOLDERS ============

export function subscribeToLectureFolders(callback: (folders: LectureFolder[]) => void): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.LECTURE_FOLDERS),
    orderBy('order', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LectureFolder));
    callback(folders);
  });
}

export async function addLectureFolder(
  name: string,
  jlptLevel: JLPTLevel,
  createdBy: string
): Promise<LectureFolder> {
  // Get current max order for this level (avoid composite index by filtering in JS)
  const q = query(
    collection(db, COLLECTIONS.LECTURE_FOLDERS),
    where('jlptLevel', '==', jlptLevel)
  );
  const snapshot = await getDocs(q);
  const existingFolders = snapshot.docs.map(doc => doc.data());
  const maxOrder = existingFolders.length > 0
    ? Math.max(...existingFolders.map(f => f.order || 0)) + 1
    : 0;

  const newFolder: Omit<LectureFolder, 'id'> = {
    name,
    jlptLevel,
    createdBy,
    createdAt: getNowISO(),
    order: maxOrder,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.LECTURE_FOLDERS), newFolder);
  return { id: docRef.id, ...newFolder };
}

export async function updateLectureFolder(id: string, data: Partial<LectureFolder>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.LECTURE_FOLDERS, id);
  await updateDoc(docRef, data);
}

export async function deleteLectureFolder(id: string): Promise<void> {
  // First, update all lectures in this folder to remove folderId
  const lecturesQuery = query(
    collection(db, COLLECTIONS.LECTURES),
    where('folderId', '==', id)
  );
  const lecturesSnapshot = await getDocs(lecturesQuery);
  const updatePromises = lecturesSnapshot.docs.map(doc =>
    updateDoc(doc.ref, { folderId: null })
  );
  await Promise.all(updatePromises);

  // Delete the folder
  const docRef = doc(db, COLLECTIONS.LECTURE_FOLDERS, id);
  await deleteDoc(docRef);
}

export function getLectureFoldersByLevel(folders: LectureFolder[], level: JLPTLevel): LectureFolder[] {
  return folders.filter(f => f.jlptLevel === level).sort((a, b) => a.order - b.order);
}

export function getLecturesByFolder(lectures: Lecture[], folderId: string): Lecture[] {
  return lectures.filter(l => l.folderId === folderId);
}

export function getLecturesByLevel(lectures: Lecture[], level: JLPTLevel): Lecture[] {
  return lectures.filter(l => l.jlptLevel === level);
}
