// Node.js script to seed reading and listening folders
// Run with: node scripts/seed-folders-node.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBktC2eWkNuDxKzWfd4xt2X53CBbYBeY4Q",
  authDomain: "flashcard-a96f1.firebaseapp.com",
  projectId: "flashcard-a96f1",
  storageBucket: "flashcard-a96f1.firebasestorage.app",
  messagingSenderId: "540083542926",
  appId: "1:540083542926:web:bd9d6c1264bb9fc11022df",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedFolders(collectionName, folders) {
  const existingQuery = query(collection(db, collectionName));
  const existingDocs = await getDocs(existingQuery);
  const existingNames = new Set(existingDocs.docs.map(doc => doc.data().name));

  let added = 0;
  for (const folder of folders) {
    if (!existingNames.has(folder.name)) {
      await addDoc(collection(db, collectionName), folder);
      added++;
      console.log(`✓ Added: ${folder.name} to ${collectionName}`);
    } else {
      console.log(`○ Skipped (exists): ${folder.name}`);
    }
  }
  console.log(`\nTotal added to ${collectionName}: ${added}\n`);
}

async function main() {
  const now = new Date().toISOString();

  // Create folders for Reading
  const readingFolders = [];

  // N5: Bài 1 - 25
  for (let i = 1; i <= 25; i++) {
    readingFolders.push({
      name: `Bài ${i}`,
      jlptLevel: 'N5',
      order: i,
      createdAt: now,
      createdBy: 'system',
    });
  }

  // N4: Bài 26 - 50
  for (let i = 26; i <= 50; i++) {
    readingFolders.push({
      name: `Bài ${i}`,
      jlptLevel: 'N4',
      order: i,
      createdAt: now,
      createdBy: 'system',
    });
  }

  // Create folders for Listening (same structure)
  const listeningFolders = [...readingFolders].map(f => ({ ...f, createdAt: now }));

  console.log('=== Seeding Reading Folders ===\n');
  await seedFolders('readingFolders', readingFolders);

  console.log('=== Seeding Listening Folders ===\n');
  await seedFolders('listeningFolders', listeningFolders);

  console.log('✅ Done!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
