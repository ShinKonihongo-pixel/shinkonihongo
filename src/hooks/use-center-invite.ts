// Hook for center invite management

import { useState, useEffect, useCallback } from 'react';
import type { CenterInvite } from '../types/branch';
import * as inviteService from '../services/center-invite-firestore';

export function useCenterInvites(branchId: string | null) {
  const [invites, setInvites] = useState<CenterInvite[]>([]);
  const [loading, setLoading] = useState(false);

  // Load invites
  useEffect(() => {
    if (!branchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: clear state when branchId removed
      setInvites([]);
      return;
    }
    setLoading(true);
    inviteService.getInvitesByBranch(branchId).then(data => {
      setInvites(data);
      setLoading(false);
    });
  }, [branchId]);

  const createInvite = useCallback(async (
    createdBy: string,
    options?: { expiresAt?: string; maxUses?: number }
  ) => {
    if (!branchId) return;
    const invite = await inviteService.createInvite(branchId, createdBy, options);
    setInvites(prev => [...prev, invite]);
    return invite;
  }, [branchId]);

  const deactivateInvite = useCallback(async (inviteId: string) => {
    await inviteService.deactivateInvite(inviteId);
    setInvites(prev => prev.map(i => i.id === inviteId ? { ...i, isActive: false } : i));
  }, []);

  return { invites, loading, createInvite, deactivateInvite };
}

// Hook for joining a center via invite code
export function useJoinCenter() {
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinWithCode = useCallback(async (code: string): Promise<{ success: boolean; branchId?: string }> => {
    setJoining(true);
    setError(null);

    try {
      const result = await inviteService.useInvite(code);
      if (!result.success) {
        setError(result.error || 'Không thể tham gia');
        setJoining(false);
        return { success: false };
      }

      setJoining(false);
      return { success: true, branchId: result.invite?.branchId };
    } catch {
      setError('Lỗi kết nối');
      setJoining(false);
      return { success: false };
    }
  }, []);

  return { joining, error, joinWithCode, setError };
}
