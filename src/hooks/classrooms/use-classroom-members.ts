// Classroom members management hook

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ClassroomMember } from '../../types/classroom';
import type { User } from '../../types/user';
import * as classroomService from '../../services/classroom-firestore';

export function useClassroomMembers(classroomId: string | null, users: User[]) {
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classroomId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = classroomService.subscribeToMembers(classroomId, (data) => {
      setMembers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classroomId]);

  // Get member with user details
  const membersWithUsers = useMemo(() => {
    return members.map(member => ({
      ...member,
      user: users.find(u => u.id === member.userId),
    }));
  }, [members, users]);

  const inviteUser = useCallback(async (
    userId: string,
    invitedBy: string
  ): Promise<ClassroomMember | null> => {
    if (!classroomId) return null;
    try {
      return await classroomService.addMember(classroomId, userId, 'student', invitedBy, 'direct');
    } catch (err) {
      console.error('Error inviting user:', err);
      return null;
    }
  }, [classroomId]);

  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    if (!classroomId) return false;
    try {
      await classroomService.removeMember(memberId, classroomId);
      return true;
    } catch (err) {
      console.error('Error removing member:', err);
      return false;
    }
  }, [classroomId]);

  // Check if user is already a member
  const isMember = useCallback((userId: string): boolean => {
    return members.some(m => m.userId === userId);
  }, [members]);

  // Get students only
  const students = useMemo(() => {
    return membersWithUsers.filter(m => m.role === 'student');
  }, [membersWithUsers]);

  // Get admins only
  const admins = useMemo(() => {
    return membersWithUsers.filter(m => m.role === 'admin');
  }, [membersWithUsers]);

  return {
    members,
    membersWithUsers,
    students,
    admins,
    loading,
    inviteUser,
    removeMember,
    isMember,
  };
}
