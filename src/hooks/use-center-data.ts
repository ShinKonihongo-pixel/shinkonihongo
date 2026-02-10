// Reusable hook to load center (branch) data and user role by slug

import { useState, useEffect } from 'react';
import { getBranchBySlug, getUserBranchRole } from '../services/branch-firestore';
import type { Branch, BranchMemberRole } from '../types/branch';

interface CenterData {
  center: Branch | null;
  userRole: BranchMemberRole | 'director' | null;
  loading: boolean;
  error: string | null;
}

export function useCenterData(slug: string | null, userId: string | null): CenterData {
  const [center, setCenter] = useState<Branch | null>(null);
  const [userRole, setUserRole] = useState<BranchMemberRole | 'director' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset state when slug cleared
      setCenter(null);
      setUserRole(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getBranchBySlug(slug).then(async (branch) => {
      if (cancelled) return;

      if (!branch) {
        setError('Không tìm thấy trung tâm');
        setLoading(false);
        return;
      }

      setCenter(branch);

      if (userId) {
        const role = await getUserBranchRole(userId, branch.id);
        if (!cancelled) setUserRole(role);
      }

      if (!cancelled) setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setError('Lỗi tải dữ liệu trung tâm');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [slug, userId]);

  return { center, userRole, loading, error };
}
