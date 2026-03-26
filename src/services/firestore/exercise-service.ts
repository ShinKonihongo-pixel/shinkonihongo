// Exercise Firestore service
// Handles CRUD operations for vocabulary practice exercises

import type { Exercise, ExerciseFormData } from '../../types/exercise';
import {
  COLLECTIONS,
  mapDoc,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  db,
  type Unsubscribe,
} from './collections';

// Subscribe to all exercises, ordered newest-first
export function subscribeToExercises(callback: (exercises: Exercise[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.EXERCISES), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const exercises = snapshot.docs.map(doc => mapDoc<Exercise>(doc));
    callback(exercises);
  });
}

// Add a new exercise document
export async function addExercise(data: ExerciseFormData, createdBy: string): Promise<Exercise> {
  const newExercise = {
    ...data,
    createdBy,
    createdAt: new Date().toISOString(),
    isPublished: false,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.EXERCISES), newExercise);
  return { id: docRef.id, ...newExercise };
}

// Update an existing exercise by id
export async function updateExercise(id: string, data: Partial<Exercise>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.EXERCISES, id), data);
}

// Delete an exercise by id
export async function deleteExercise(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.EXERCISES, id));
}
