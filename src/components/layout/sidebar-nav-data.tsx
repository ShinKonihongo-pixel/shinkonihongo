// Navigation section definitions for Sidebar

import type { ReactNode } from 'react';
import {
  Home,
  Layers,
  Gamepad2,
  Award,
  MessageCircle,
  Settings,
  Bell,
  Building2,
  BookOpen,
  Headphones,
  FileText,
  BookOpenCheck,
  LayoutGrid,
  ClipboardList,
  Users,
  BarChart3,
  Crown,
  Shield,
  PenTool,
  Mic,
  TrendingUp,
  MessageSquare,
  GraduationCap,
  School,
  DollarSign,
} from 'lucide-react';
import type { Page } from './header';

export interface NavItem {
  page: Page;
  label: string;
  icon: ReactNode;
  roles?: string[];
}

export interface NavSection {
  id: string;
  title: string;
  emoji: string;
  items: NavItem[];
  defaultExpanded?: boolean;
  roles?: string[];
}

const iconProps = { size: 20, strokeWidth: 1.75 };

// ── Regular (non-center) nav sections ──────────────────────────────────────
export const regularSections: NavSection[] = [
  {
    id: 'learning',
    title: 'Học tập',
    emoji: '📚',
    defaultExpanded: true,
    items: [
      { page: 'home', label: 'Trang chủ', icon: <Home {...iconProps} /> },
      { page: 'study', label: 'Từ Vựng', icon: <Layers {...iconProps} /> },
      { page: 'grammar-study', label: 'Ngữ Pháp', icon: <FileText {...iconProps} /> },
      { page: 'kanji-study', label: 'Hán Tự', icon: <BookOpen {...iconProps} /> },
      { page: 'reading', label: 'Đọc Hiểu', icon: <BookOpenCheck {...iconProps} /> },
      { page: 'listening', label: 'Nghe Hiểu', icon: <Headphones {...iconProps} /> },
      { page: 'exercises', label: 'Bài Tập', icon: <ClipboardList {...iconProps} /> },
      { page: 'conjugation' as Page, label: 'Chia Động Từ', icon: <PenTool {...iconProps} /> },
      { page: 'pronunciation' as Page, label: 'Phát Âm', icon: <Mic {...iconProps} /> },
      { page: 'cards', label: 'Quản lý thẻ', icon: <LayoutGrid {...iconProps} />, roles: ['admin', 'super_admin'] },
    ],
  },
  {
    id: 'games',
    title: 'Trò chơi',
    emoji: '🎮',
    defaultExpanded: false,
    items: [
      { page: 'game-hub', label: 'Game Hub', icon: <Gamepad2 {...iconProps} /> },
      { page: 'jlpt', label: 'JLPT Practice', icon: <Award {...iconProps} /> },
    ],
  },
  {
    id: 'communication',
    title: 'Giao tiếp',
    emoji: '💬',
    defaultExpanded: false,
    items: [
      { page: 'kaiwa', label: 'Hội thoại', icon: <MessageCircle {...iconProps} />, roles: ['vip_user', 'admin', 'super_admin', 'director', 'branch_admin', 'main_teacher'] },
      { page: 'classroom', label: 'Lớp Học', icon: <School {...iconProps} /> },
      { page: 'lectures', label: 'Bài giảng', icon: <GraduationCap {...iconProps} /> },
      { page: 'chat', label: 'Chat', icon: <MessageSquare {...iconProps} /> },
    ],
  },
  {
    id: 'management',
    title: 'Quản lý',
    emoji: '🏫',
    defaultExpanded: false,
    roles: ['admin', 'super_admin', 'director', 'branch_admin', 'main_teacher'],
    items: [
      { page: 'branches', label: 'Chi nhánh', icon: <Building2 {...iconProps} />, roles: ['director', 'branch_admin', 'super_admin'] },
      { page: 'teachers', label: 'Quản lý GV', icon: <Users {...iconProps} />, roles: ['admin', 'super_admin', 'director', 'branch_admin'] },
      { page: 'salary', label: 'Lương', icon: <DollarSign {...iconProps} />, roles: ['admin', 'super_admin', 'director', 'branch_admin'] },
      { page: 'permissions', label: 'Phân quyền', icon: <Shield {...iconProps} />, roles: ['super_admin'] },
    ],
  },
  {
    id: 'personal',
    title: 'Cá nhân',
    emoji: '📊',
    defaultExpanded: true,
    items: [
      { page: 'progress', label: 'Tiến độ', icon: <TrendingUp {...iconProps} /> },
      { page: 'analytics' as Page, label: 'Phân tích', icon: <BarChart3 {...iconProps} /> },
      { page: 'notifications', label: 'Thông báo', icon: <Bell {...iconProps} /> },
      { page: 'pricing', label: 'Nâng cấp', icon: <Crown {...iconProps} /> },
      { page: 'settings', label: 'Cài đặt', icon: <Settings {...iconProps} /> },
    ],
  },
];

// ── Center-mode nav item lists ───────────────────────────────────────────────
const centerLearningSectionItems: NavItem[] = [
  { page: 'home', label: 'Trang chủ', icon: <Home {...iconProps} /> },
  { page: 'study', label: 'Từ Vựng', icon: <Layers {...iconProps} /> },
  { page: 'grammar-study', label: 'Ngữ Pháp', icon: <FileText {...iconProps} /> },
  { page: 'kanji-study', label: 'Hán Tự', icon: <BookOpen {...iconProps} /> },
  { page: 'reading', label: 'Đọc Hiểu', icon: <BookOpenCheck {...iconProps} /> },
  { page: 'listening', label: 'Nghe Hiểu', icon: <Headphones {...iconProps} /> },
  { page: 'exercises', label: 'Bài Tập', icon: <ClipboardList {...iconProps} /> },
];

const centerActivitySectionItems: NavItem[] = [
  { page: 'classroom', label: 'Lớp Học', icon: <School {...iconProps} /> },
  { page: 'jlpt', label: 'JLPT', icon: <Award {...iconProps} /> },
  { page: 'game-hub', label: 'Game', icon: <Gamepad2 {...iconProps} /> },
  { page: 'center-members', label: 'Thành viên', icon: <Users {...iconProps} /> },
];

const centerAdminSectionItems: NavItem[] = [
  { page: 'center-dashboard', label: 'Dashboard TT', icon: <BarChart3 {...iconProps} /> },
  { page: 'cards', label: 'Quản lý nội dung', icon: <LayoutGrid {...iconProps} /> },
];

// Build center nav sections
export function buildCenterSections(isCenterAdmin: boolean): NavSection[] {
  const sections: NavSection[] = [
    {
      id: 'learning',
      title: 'Học tập',
      emoji: '📚',
      defaultExpanded: true,
      items: centerLearningSectionItems,
    },
    {
      id: 'activities',
      title: 'Hoạt động',
      emoji: '🎮',
      defaultExpanded: true,
      items: centerActivitySectionItems,
    },
  ];
  if (isCenterAdmin) {
    sections.push({
      id: 'centerAdmin',
      title: 'Quản lý TT',
      emoji: '🏫',
      defaultExpanded: false,
      items: centerAdminSectionItems,
    });
  }
  return sections;
}

// ── localStorage helpers ────────────────────────────────────────────────────
const LS_KEY = 'sidebar-sections-state';

export function loadSectionState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function saveSectionState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
