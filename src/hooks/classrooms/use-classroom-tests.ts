// Classroom tests and assignments management hook

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ClassroomTest, TestFormData } from '../../types/classroom';
import * as classroomService from '../../services/classroom-firestore';
import { handleError } from '../../utils/error-handler';

export function useClassroomTests(classroomId: string | null) {
  const [tests, setTests] = useState<ClassroomTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classroomId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = classroomService.subscribeToTests(classroomId, (data) => {
      // Sort by createdAt descending
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classroomId]);

  const createTest = useCallback(async (
    data: TestFormData,
    createdBy: string
  ): Promise<ClassroomTest | null> => {
    if (!classroomId) return null;
    try {
      return await classroomService.createTest(data, classroomId, createdBy);
    } catch (err) {
      handleError(err, { context: 'useclassroomUtests' });
      return null;
    }
  }, [classroomId]);

  const updateTest = useCallback(async (testId: string, data: Partial<ClassroomTest>): Promise<boolean> => {
    try {
      await classroomService.updateTest(testId, data);
      return true;
    } catch (err) {
      handleError(err, { context: 'useclassroomUtests' });
      return false;
    }
  }, []);

  const deleteTest = useCallback(async (testId: string): Promise<boolean> => {
    try {
      await classroomService.deleteTest(testId);
      return true;
    } catch (err) {
      handleError(err, { context: 'useclassroomUtests' });
      return false;
    }
  }, []);

  const publishTest = useCallback(async (testId: string): Promise<boolean> => {
    if (!classroomId) return false;
    try {
      await classroomService.publishTest(testId, classroomId);
      return true;
    } catch (err) {
      handleError(err, { context: 'useclassroomUtests' });
      return false;
    }
  }, [classroomId]);

  // Separate tests and assignments
  const testsList = useMemo(() => tests.filter(t => t.type === 'test'), [tests]);
  const assignmentsList = useMemo(() => tests.filter(t => t.type === 'assignment'), [tests]);

  // Published only
  const publishedTests = useMemo(() => tests.filter(t => t.isPublished), [tests]);

  return {
    tests,
    testsList,
    assignmentsList,
    publishedTests,
    loading,
    createTest,
    updateTest,
    deleteTest,
    publishTest,
  };
}
