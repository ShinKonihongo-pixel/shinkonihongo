// Seed script for reading and listening folders
// Run this once to create default folders for N5 and N4

import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface FolderData {
  name: string;
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  order: number;
  createdAt: string;
  createdBy: string;
}

async function seedFolders(collectionName: string, folders: FolderData[]) {
  const existingQuery = query(collection(db, collectionName));
  const existingDocs = await getDocs(existingQuery);
  const existingNames = new Set(existingDocs.docs.map(doc => doc.data().name));

  let added = 0;
  for (const folder of folders) {
    if (!existingNames.has(folder.name)) {
      await addDoc(collection(db, collectionName), folder);
      added++;
      console.log(`Added: ${folder.name} to ${collectionName}`);
    } else {
      console.log(`Skipped (exists): ${folder.name}`);
    }
  }
  console.log(`Total added to ${collectionName}: ${added}`);
}

export async function seedReadingFolders() {
  const now = new Date().toISOString();
  const folders: FolderData[] = [];

  // N5: Bài 1 - 25
  for (let i = 1; i <= 25; i++) {
    folders.push({
      name: `Bài ${i}`,
      jlptLevel: 'N5',
      order: i,
      createdAt: now,
      createdBy: 'system',
    });
  }

  // N4: Bài 26 - 50
  for (let i = 26; i <= 50; i++) {
    folders.push({
      name: `Bài ${i}`,
      jlptLevel: 'N4',
      order: i,
      createdAt: now,
      createdBy: 'system',
    });
  }

  await seedFolders('readingFolders', folders);
}

export async function seedListeningFolders() {
  const now = new Date().toISOString();
  const folders: FolderData[] = [];

  // N5: Bài 1 - 25
  for (let i = 1; i <= 25; i++) {
    folders.push({
      name: `Bài ${i}`,
      jlptLevel: 'N5',
      order: i,
      createdAt: now,
      createdBy: 'system',
    });
  }

  // N4: Bài 26 - 50
  for (let i = 26; i <= 50; i++) {
    folders.push({
      name: `Bài ${i}`,
      jlptLevel: 'N4',
      order: i,
      createdAt: now,
      createdBy: 'system',
    });
  }

  await seedFolders('listeningFolders', folders);
}

export async function seedAllFolders() {
  console.log('Seeding reading folders...');
  await seedReadingFolders();

  console.log('Seeding listening folders...');
  await seedListeningFolders();

  console.log('Done!');
}

// Export to window for console access
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).seedAllFolders = seedAllFolders;
  (window as unknown as Record<string, unknown>).seedReadingFolders = seedReadingFolders;
  (window as unknown as Record<string, unknown>).seedListeningFolders = seedListeningFolders;
}
