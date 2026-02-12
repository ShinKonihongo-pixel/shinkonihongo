// Migration script: Add center fields to existing branches
// Run from browser console: import('./scripts/migrate-branches-to-centers').then(m => m.migrateBranchesToCenters())

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateSlug, generateInviteCode } from '../utils/slug';
import { DEFAULT_CENTER_BRANDING } from '../types/branch';

export async function migrateBranchesToCenters() {
  console.log('Starting branch → center migration...');

  const snapshot = await getDocs(collection(db, 'branches'));
  const usedSlugs = new Set<string>();
  let migrated = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    // Skip if already has slug
    if (data.slug) {
      usedSlugs.add(data.slug);
      console.log(`  Skipping ${data.name} (already has slug: ${data.slug})`);
      continue;
    }

    // Generate unique slug
    let slug = generateSlug(data.name);
    if (slug.length < 3) slug = slug + '-center';
    let suffix = 0;
    const baseSlug = slug;
    while (usedSlugs.has(slug)) {
      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }
    usedSlugs.add(slug);

    // Update branch
    const docRef = doc(db, 'branches', docSnap.id);
    await updateDoc(docRef, {
      slug,
      branding: DEFAULT_CENTER_BRANDING,
      inviteCode: generateInviteCode(),
      inviteEnabled: true,
      isPublic: true,
    });

    migrated++;
    console.log(`  Migrated: ${data.name} → slug: ${slug}`);
  }

  console.log(`Migration complete. ${migrated} branches updated.`);
}

// Auto-export for console access
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).migrateBranchesToCenters = migrateBranchesToCenters;
}
