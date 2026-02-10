// Firestore service for Center Invite operations

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CenterInvite } from '../types/branch';
import { generateInviteCode } from '../utils/slug';

const COLLECTION = 'center_invites';

function getNowISO(): string {
  return new Date().toISOString();
}

// Create a new invite
export async function createInvite(
  branchId: string,
  createdBy: string,
  options?: { expiresAt?: string; maxUses?: number }
): Promise<CenterInvite> {
  // Generate unique code
  let code = generateInviteCode();
  let exists = true;
  while (exists) {
    const existing = await getInviteByCode(code);
    if (!existing) exists = false;
    else code = generateInviteCode();
  }

  const invite: Omit<CenterInvite, 'id'> = {
    branchId,
    code,
    createdBy,
    expiresAt: options?.expiresAt,
    maxUses: options?.maxUses,
    useCount: 0,
    isActive: true,
    createdAt: getNowISO(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), invite);
  return { id: docRef.id, ...invite };
}

// Get invite by code
export async function getInviteByCode(code: string): Promise<CenterInvite | null> {
  const q = query(
    collection(db, COLLECTION),
    where('code', '==', code.toUpperCase())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as CenterInvite;
}

// Use an invite (validate + increment useCount)
export async function useInvite(
  code: string
): Promise<{ success: boolean; invite?: CenterInvite; error?: string }> {
  const invite = await getInviteByCode(code);
  if (!invite) return { success: false, error: 'Mã mời không hợp lệ' };
  if (!invite.isActive) return { success: false, error: 'Mã mời đã bị vô hiệu hóa' };

  // Check expiry
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return { success: false, error: 'Mã mời đã hết hạn' };
  }

  // Check max uses
  if (invite.maxUses && invite.useCount >= invite.maxUses) {
    return { success: false, error: 'Mã mời đã hết lượt sử dụng' };
  }

  // Increment use count
  const docRef = doc(db, COLLECTION, invite.id);
  await updateDoc(docRef, { useCount: invite.useCount + 1 });

  return { success: true, invite: { ...invite, useCount: invite.useCount + 1 } };
}

// Deactivate an invite
export async function deactivateInvite(inviteId: string): Promise<void> {
  const docRef = doc(db, COLLECTION, inviteId);
  await updateDoc(docRef, { isActive: false });
}

// Get all invites for a branch
export async function getInvitesByBranch(branchId: string): Promise<CenterInvite[]> {
  const q = query(
    collection(db, COLLECTION),
    where('branchId', '==', branchId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CenterInvite));
}
