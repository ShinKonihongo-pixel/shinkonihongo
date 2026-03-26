// Classroom test submissions management hook

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ClassroomSubmission, SubmissionAnswer } from '../../types/classroom';
import * as classroomService from '../../services/classroom-firestore';
import { handleError } from '../../utils/error-handler';

export function useClassroomSubmissions(testId: string | null, userId?: string) {
  const [submissions, setSubmissions] = useState<ClassroomSubmission[]>([]);
  const [mySubmission, setMySubmission] = useState<ClassroomSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubmissions([]);
      setMySubmission(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = classroomService.subscribeToSubmissions(testId, (data) => {
      setSubmissions(data);
      if (userId) {
        setMySubmission(data.find(s => s.userId === userId) || null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [testId, userId]);

  const startSubmission = useCallback(async (
    classroomId: string,
    userId: string
  ): Promise<ClassroomSubmission | null> => {
    if (!testId) return null;
    try {
      return await classroomService.startSubmission(testId, classroomId, userId);
    } catch (err) {
      handleError(err, { context: 'useclassroomUsubmissions' });
      return null;
    }
  }, [testId]);

  const submitAnswers = useCallback(async (
    submissionId: string,
    answers: SubmissionAnswer[],
    timeSpent: number
  ): Promise<boolean> => {
    try {
      await classroomService.submitAnswers(submissionId, answers, timeSpent);
      return true;
    } catch (err) {
      handleError(err, { context: 'useclassroomUsubmissions' });
      return false;
    }
  }, []);

  const gradeSubmission = useCallback(async (
    submissionId: string,
    answers: SubmissionAnswer[],
    feedback: string,
    gradedBy: string
  ): Promise<boolean> => {
    try {
      await classroomService.gradeSubmission(submissionId, answers, feedback, gradedBy);
      return true;
    } catch (err) {
      handleError(err, { context: 'useclassroomUsubmissions' });
      return false;
    }
  }, []);

  // Stats
  const submittedCount = useMemo(() => {
    return submissions.filter(s => s.submittedAt).length;
  }, [submissions]);

  const averageScore = useMemo(() => {
    const submitted = submissions.filter(s => s.submittedAt);
    if (submitted.length === 0) return 0;
    const totalScore = submitted.reduce((sum, s) => sum + s.score, 0);
    const totalPoints = submitted.reduce((sum, s) => sum + s.totalPoints, 0);
    return totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
  }, [submissions]);

  return {
    submissions,
    mySubmission,
    loading,
    startSubmission,
    submitAnswers,
    gradeSubmission,
    submittedCount,
    averageScore,
  };
}
