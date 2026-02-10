// Main classrooms hook for managing classroom CRUD operations

import { useState, useEffect, useCallback } from 'react';
import type { Classroom, ClassroomFormData, ClassroomLevel } from '../../types/classroom';
import * as classroomService from '../../services/classroom-firestore';

export function useClassrooms(userId: string | null, isAdmin: boolean, branchId?: string | null) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClassrooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Center mode: show all classrooms belonging to the center
    // Normal mode: admin sees created classrooms, students see joined classrooms
    let unsubscribe: () => void;
    if (branchId) {
      unsubscribe = classroomService.subscribeToBranchClassrooms(branchId, (data) => {
        setClassrooms(data);
        setLoading(false);
      });
    } else {
      unsubscribe = isAdmin
        ? classroomService.subscribeToAdminClassrooms(userId, (data) => {
            setClassrooms(data);
            setLoading(false);
          })
        : classroomService.subscribeToUserClassrooms(userId, (data) => {
            setClassrooms(data);
            setLoading(false);
          });
    }

    return () => unsubscribe();
  }, [userId, isAdmin, branchId]);

  const createClassroom = useCallback(async (data: ClassroomFormData): Promise<Classroom | null> => {
    if (!userId) return null;
    try {
      const formData = branchId ? { ...data, branchId } : data;
      return await classroomService.createClassroom(formData, userId);
    } catch (err) {
      console.error('Error creating classroom:', err);
      return null;
    }
  }, [userId, branchId]);

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
      // In center mode, validate classroom belongs to this center before joining
      if (branchId) {
        const classroom = await classroomService.getClassroomByCode(code);
        if (!classroom) return { success: false, error: 'Không tìm thấy lớp học với mã này' };
        if (classroom.branchId !== branchId) return { success: false, error: 'Lớp học này không thuộc trung tâm này' };
      }
      return await classroomService.joinByCode(code, userId, classroomService.getClassroomByCode);
    } catch (err) {
      console.error('Error joining classroom:', err);
      return { success: false, error: 'Lỗi khi tham gia lớp học' };
    }
  }, [userId, branchId]);

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
