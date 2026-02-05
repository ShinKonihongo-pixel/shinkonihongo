// Main classrooms hook for managing classroom CRUD operations

import { useState, useEffect, useCallback } from 'react';
import type { Classroom, ClassroomFormData, ClassroomLevel } from '../../types/classroom';
import * as classroomService from '../../services/classroom-firestore';

export function useClassrooms(userId: string | null, isAdmin: boolean) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setClassrooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Admin sees classrooms they created, users see classrooms they're members of
    const unsubscribe = isAdmin
      ? classroomService.subscribeToAdminClassrooms(userId, (data) => {
          setClassrooms(data);
          setLoading(false);
        })
      : classroomService.subscribeToUserClassrooms(userId, (data) => {
          setClassrooms(data);
          setLoading(false);
        });

    return () => unsubscribe();
  }, [userId, isAdmin]);

  const createClassroom = useCallback(async (data: ClassroomFormData): Promise<Classroom | null> => {
    if (!userId) return null;
    try {
      return await classroomService.createClassroom(data, userId);
    } catch (err) {
      console.error('Error creating classroom:', err);
      return null;
    }
  }, [userId]);

  const updateClassroom = useCallback(async (id: string, data: Partial<Classroom>): Promise<boolean> => {
    try {
      await classroomService.updateClassroom(id, data);
      return true;
    } catch (err) {
      console.error('Error updating classroom:', err);
      return false;
    }
  }, []);

  const deleteClassroom = useCallback(async (id: string): Promise<boolean> => {
    try {
      await classroomService.deleteClassroom(id);
      return true;
    } catch (err) {
      console.error('Error deleting classroom:', err);
      return false;
    }
  }, []);

  const joinByCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string; classroom?: Classroom }> => {
    if (!userId) return { success: false, error: 'Chưa đăng nhập' };
    try {
      return await classroomService.joinByCode(code, userId, classroomService.getClassroomByCode);
    } catch (err) {
      console.error('Error joining classroom:', err);
      return { success: false, error: 'Lỗi khi tham gia lớp học' };
    }
  }, [userId]);

  // Helper to filter by level
  const getClassroomsByLevel = useCallback((level: ClassroomLevel): Classroom[] => {
    return classrooms.filter(c => c.level === level);
  }, [classrooms]);

  return {
    classrooms,
    loading,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    joinByCode,
    getClassroomsByLevel,
  };
}
