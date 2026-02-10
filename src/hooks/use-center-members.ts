// Hook to subscribe to center members with user display info

import { useState, useEffect, useCallback } from 'react';
import { subscribeToBranchMembers, removeBranchMember } from '../services/branch-firestore';
import type { BranchMember, BranchMemberRole } from '../types/branch';
import type { User } from '../types/user';

export interface CenterMemberInfo {
  member: BranchMember;
  displayName: string;
  username: string;
  avatar?: string;
}

interface UseCenterMembersResult {
  members: CenterMemberInfo[];
  loading: boolean;
  removeMember: (memberId: string) => Promise<void>;
}

export function useCenterMembers(
  branchId: string | null,
  users: User[]
): UseCenterMembersResult {
  const [rawMembers, setRawMembers] = useState<BranchMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset state when branchId cleared
      setRawMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToBranchMembers(branchId, (members) => {
      setRawMembers(members);
      setLoading(false);
    });

    return unsub;
  }, [branchId]);

  // Resolve userId → User display info
  const members: CenterMemberInfo[] = rawMembers
    .filter(m => m.status === 'active')
    .map(member => {
      const user = users.find(u => u.id === member.userId);
      return {
        member,
        displayName: user?.displayName || user?.username || 'Unknown',
        username: user?.username || '',
        avatar: user?.avatar,
      };
    })
    .sort((a, b) => {
      // Sort: admin > teachers > students
      const roleOrder: Record<BranchMemberRole, number> = {
        branch_admin: 0,
        main_teacher: 1,
        part_time_teacher: 2,
        assistant: 3,
        student: 4,
      };
      return (roleOrder[a.member.role] ?? 5) - (roleOrder[b.member.role] ?? 5);
    });

  const removeMember = useCallback(async (memberId: string) => {
    await removeBranchMember(memberId);
  }, []);

  return { members, loading, removeMember };
}
