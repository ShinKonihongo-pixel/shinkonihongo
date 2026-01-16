// Classroom View Types - Shared types for classroom components

import type { Classroom, ClassroomMember, ClassroomTest } from '../../types/classroom';
import type { User } from '../../types/user';

export type ViewMode = 'list' | 'detail' | 'members' | 'tests' | 'submissions' | 'grades' | 'attendance' | 'evaluation';

export interface MemberWithUser extends ClassroomMember {
  user?: User;
}

export interface ClassroomListViewProps {
  classrooms: Classroom[];
  isAdmin: boolean;
  unreadCount: number;
  joinCode: string;
  joinError: string;
  joining: boolean;
  onJoinCodeChange: (code: string) => void;
  onJoinByCode: () => void;
  onSelectClassroom: (classroom: Classroom) => void;
  onCreateClick: () => void;
  onEdit: (classroom: Classroom) => void;
  onDelete: (classroom: Classroom) => void;
}

export interface MembersTabProps {
  classroom: Classroom;
  students: MemberWithUser[];
  loading: boolean;
  onInviteClick: () => void;
  onRemoveMember: (memberId: string) => void;
}

export interface TestsTabProps {
  tests: ClassroomTest[];
  testsList: ClassroomTest[];
  assignmentsList: ClassroomTest[];
  submissions: any[];
  isAdmin: boolean;
  loading: boolean;
  onAssignTest: () => void;
  onAssignAssignment: () => void;
  onPublish: (testId: string) => void;
  onReview: (test: ClassroomTest) => void;
  onStartTest: (test: ClassroomTest) => void;
}

export interface GradesTabProps {
  studentGrades: {
    userId: string;
    userName: string;
    testsCompleted: number;
    assignmentsCompleted: number;
    totalScore: number;
    totalPoints: number;
    averagePercent: number;
  }[];
  loading: boolean;
}

export interface StudentOverviewProps {
  classroom: Classroom;
}
