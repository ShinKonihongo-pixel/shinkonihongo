// Node.js script to seed reading and listening folders
// Run with: node scripts/seed-folders-node.mjs

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Validate required env vars
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Error: Missing Firebase environment variables. Check your .env file.');
  process.exit(1);
}

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
