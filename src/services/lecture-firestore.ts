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
import type { Lecture, LectureFormData, Slide, SlideFormData, LectureView } from '../types/lecture';

// Collection names
const COLLECTIONS = {
  LECTURES: 'lectures',
  SLIDES: 'slides',
  LECTURE_VIEWS: 'lectureViews',
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
  const q = query(
    collection(db, COLLECTIONS.SLIDES),
    where('lectureId', '==', lectureId),
    orderBy('order', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const slides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slide));
    callback(slides);
  });
}

export async function addSlide(
  lectureId: string,
  data: SlideFormData,
  order: number
): Promise<Slide> {
  const newSlide: Omit<Slide, 'id'> = {
    ...data,
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
  await updateDoc(docRef, data);
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
