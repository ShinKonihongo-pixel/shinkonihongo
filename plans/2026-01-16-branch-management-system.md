# Kế hoạch: Hệ thống Quản lý Đa Chi Nhánh

**Ngày tạo:** 2026-01-16
**Trạng thái:** In Progress
**Ưu tiên:** Phase 1 - Chi nhánh + Branch Admin

---

## Progress Tracking

### Completed
- [x] `src/types/branch.ts` - Branch, BranchMember, BranchStats interfaces
- [x] `src/types/teacher.ts` - TeacherSchedule, TeachingSession, Salary interfaces
- [x] `src/types/user.ts` - Updated with new roles (director, branch_admin, teachers)
- [x] `src/types/classroom.ts` - Added branchId field
- [x] `src/services/branch-firestore.ts` - Branch CRUD operations
- [x] `src/services/teacher-firestore.ts` - Teacher schedule & session management
- [x] `src/services/salary-firestore.ts` - Salary calculation & management
- [x] `src/hooks/use-branches.ts` - Branch state management hooks
- [x] `src/hooks/use-teachers.ts` - Teacher & salary hooks
- [x] `src/components/branch/branch-card.tsx` - Branch display card
- [x] `src/components/branch/branch-create-modal.tsx` - Create/edit branch modal
- [x] `src/components/branch/branch-selector.tsx` - Branch selector dropdown

### Teacher Components Completed
- [x] `src/components/teacher/teacher-list.tsx` - Danh sách giáo viên với filter
- [x] `src/components/teacher/teacher-add-modal.tsx` - Modal thêm/sửa giáo viên
- [x] `src/components/teacher/teacher-schedule.tsx` - Lịch dạy tuần + modal
- [x] `src/components/teacher/teaching-log.tsx` - Ghi nhận giờ dạy + modal

### Salary Components Completed
- [x] `src/components/salary/salary-calculator.tsx` - Bảng tính lương + modal sửa
- [x] `src/components/salary/salary-slip.tsx` - Phiếu lương (print/PDF)
- [x] `src/components/salary/salary-report.tsx` - Báo cáo lương tổng hợp

### Management Pages Completed
- [x] `src/components/pages/branch-management-page.tsx` - Quản lý chi nhánh (Director)
- [x] `src/components/pages/teacher-management-page.tsx` - Quản lý giáo viên (Branch Admin)
- [x] `src/components/pages/salary-page.tsx` - Quản lý lương

### Integration Completed
- [x] `src/components/layout/sidebar.tsx` - Added branches/teachers/salary nav items with role-based access
- [x] `src/components/layout/header.tsx` - Added new Page types
- [x] `src/App.tsx` - Added routing for BranchManagementPage, TeacherManagementPage, SalaryPage

## Phase 1 Complete!

---

## 1. Tổng quan Kiến trúc

### 1.1 Hệ thống phân quyền (Role Hierarchy)

```
director (Giám đốc)
  └─ branch_admin (Admin Chi nhánh)
       └─ main_teacher (Giáo viên chính)
            └─ part_time_teacher (Giáo viên part-time)
            └─ assistant (Trợ giảng)
                 └─ student (Học sinh)
```

### 1.2 Database Schema (Firestore Collections)

#### Collection: `branches`
```typescript
interface Branch {
  id: string;
  name: string;                    // Tên chi nhánh
  code: string;                    // Mã chi nhánh (unique)
  address?: string;
  phone?: string;
  email?: string;
  directorId: string;              // Giám đốc sở hữu
  adminIds: string[];              // Danh sách admin chi nhánh
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Collection: `branch_members`
```typescript
type TeacherRole = 'main_teacher' | 'part_time_teacher' | 'assistant';

interface BranchMember {
  id: string;
  branchId: string;
  userId: string;
  role: 'branch_admin' | TeacherRole;
  salary?: {
    type: 'monthly' | 'hourly';
    amount: number;
  };
  joinedAt: string;
  status: 'active' | 'inactive';
}
```

#### Collection: `teacher_schedules`
```typescript
interface TeacherSchedule {
  id: string;
  branchId: string;
  teacherId: string;
  classroomId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  role: TeacherRole;               // Vai trò trong lớp này
}
```

#### Collection: `teaching_sessions`
```typescript
interface TeachingSession {
  id: string;
  branchId: string;
  teacherId: string;
  classroomId: string;
  date: string;                    // YYYY-MM-DD
  startTime: string;
  endTime: string;
  duration: number;                // Phút thực tế
  status: 'scheduled' | 'completed' | 'cancelled';
  note?: string;
  approvedBy?: string;             // Admin duyệt
  approvedAt?: string;
}
```

#### Collection: `salaries`
```typescript
interface Salary {
  id: string;
  branchId: string;
  teacherId: string;
  month: string;                   // YYYY-MM
  totalHours: number;
  totalSessions: number;
  baseSalary: number;
  bonus?: number;
  deduction?: number;
  totalAmount: number;
  status: 'draft' | 'approved' | 'paid';
  paidAt?: string;
  note?: string;
  createdBy: string;
  createdAt: string;
}
```

### 1.3 Cập nhật User types

```typescript
// Mở rộng UserRole
export type UserRole =
  | 'super_admin'
  | 'director'        // NEW: Giám đốc
  | 'admin'           // Giữ nguyên (cho tương thích)
  | 'branch_admin'    // NEW: Admin chi nhánh
  | 'main_teacher'    // NEW: Giáo viên chính
  | 'part_time_teacher' // NEW: Giáo viên part-time
  | 'assistant'       // NEW: Trợ giảng
  | 'vip_user'
  | 'user';

// Thêm field vào User interface
interface User {
  // ... existing fields
  branchId?: string;               // Chi nhánh hiện tại (nếu có)
  branchIds?: string[];            // Các chi nhánh được quản lý (cho director)
}
```

---

## 2. Phase 1: Chi nhánh + Branch Admin

### 2.1 Tính năng cần implement

#### A. Quản lý Chi nhánh (Director)
- [ ] Tạo/sửa/xóa chi nhánh
- [ ] Gán Admin cho chi nhánh
- [ ] Dashboard tổng quan các chi nhánh

#### B. Quản lý Lớp học (Branch Admin)
- [x] Tạo/sửa/xóa lớp học *(đã có)*
- [ ] Gắn lớp học với chi nhánh
- [ ] Tổng hợp tình hình lớp học

#### C. Điểm danh
- [x] Điểm danh học sinh *(đã có)*
- [ ] Xem lịch sử điểm danh theo chi nhánh
- [ ] Báo cáo điểm danh tổng hợp

#### D. Quản lý Giáo viên
- [ ] Thêm/xóa giáo viên (main, part-time, trợ giảng)
- [ ] Phân công giáo viên vào lớp
- [ ] Xem lịch dạy của giáo viên

#### E. Tính lương
- [ ] Ghi nhận giờ dạy
- [ ] Tính lương theo ngày/tháng
- [ ] Tạo phiếu lương
- [ ] Xuất phiếu lương PDF

### 2.2 Cấu trúc thư mục đề xuất

```
src/
├── types/
│   ├── branch.ts                    # NEW: Branch types
│   ├── teacher.ts                   # NEW: Teacher & salary types
│   └── classroom.ts                 # Update: add branchId
│
├── services/
│   ├── branch-firestore.ts          # NEW: Branch CRUD
│   ├── teacher-firestore.ts         # NEW: Teacher management
│   └── salary-firestore.ts          # NEW: Salary calculation
│
├── components/
│   ├── branch/
│   │   ├── branch-card.tsx          # Chi nhánh card
│   │   ├── branch-create-modal.tsx  # Tạo chi nhánh
│   │   ├── branch-dashboard.tsx     # Dashboard chi nhánh
│   │   └── branch-selector.tsx      # Chọn chi nhánh
│   │
│   ├── teacher/
│   │   ├── teacher-list.tsx         # Danh sách giáo viên
│   │   ├── teacher-add-modal.tsx    # Thêm giáo viên
│   │   ├── teacher-schedule.tsx     # Lịch dạy
│   │   └── teaching-log.tsx         # Ghi nhận giờ dạy
│   │
│   └── salary/
│       ├── salary-calculator.tsx    # Tính lương
│       ├── salary-slip.tsx          # Phiếu lương
│       └── salary-report.tsx        # Báo cáo lương
│
├── pages/
│   ├── branch-management-page.tsx   # Trang quản lý chi nhánh
│   ├── teacher-management-page.tsx  # Trang quản lý giáo viên
│   └── salary-page.tsx              # Trang tính lương
│
└── hooks/
    ├── use-branches.ts              # Branch hooks
    ├── use-teachers.ts              # Teacher hooks
    └── use-salary.ts                # Salary hooks
```

### 2.3 UI Flow

#### Flow 1: Giám đốc tạo chi nhánh
```
[Director Dashboard]
    │
    └─> [Tạo chi nhánh mới]
         - Nhập tên, địa chỉ, liên hệ
         - Chọn Admin từ danh sách users
         │
         └─> [Chi nhánh được tạo]
              - Admin nhận thông báo
              - Admin có thể bắt đầu quản lý
```

#### Flow 2: Branch Admin quản lý giáo viên
```
[Branch Admin Dashboard]
    │
    ├─> [Quản lý giáo viên]
    │    - Xem danh sách
    │    - Thêm/xóa giáo viên
    │    - Phân công lớp
    │
    ├─> [Quản lý lớp học]
    │    - Tạo lớp mới
    │    - Gán giáo viên
    │    - Xem điểm danh
    │
    └─> [Tính lương]
         - Xem giờ dạy
         - Tạo phiếu lương
         - Xuất PDF
```

---

## 3. Phân tích Impact

### 3.1 Files cần sửa đổi
| File | Thay đổi |
|------|----------|
| `src/types/user.ts` | Thêm role mới |
| `src/types/classroom.ts` | Thêm `branchId` |
| `src/components/layout/sidebar.tsx` | Menu theo role |
| `src/App.tsx` | Routing mới |

### 3.2 Files cần tạo mới
| File | Mô tả |
|------|-------|
| `src/types/branch.ts` | Branch interfaces |
| `src/types/teacher.ts` | Teacher & salary interfaces |
| `src/services/branch-firestore.ts` | Branch CRUD |
| `src/services/teacher-firestore.ts` | Teacher CRUD |
| `src/services/salary-firestore.ts` | Salary calculation |
| `src/components/branch/*` | Branch components |
| `src/components/teacher/*` | Teacher components |
| `src/components/salary/*` | Salary components |

### 3.3 Firestore Collections mới
- `branches`
- `branch_members`
- `teacher_schedules`
- `teaching_sessions`
- `salaries`

---

## 4. Implementation Order

### Step 1: Foundation
1. Tạo `types/branch.ts` - Branch interfaces
2. Tạo `types/teacher.ts` - Teacher & salary interfaces
3. Update `types/user.ts` - Thêm role mới
4. Update `types/classroom.ts` - Thêm branchId

### Step 2: Services
5. Tạo `services/branch-firestore.ts` - Branch CRUD
6. Tạo `services/teacher-firestore.ts` - Teacher management
7. Tạo `services/salary-firestore.ts` - Salary calculation

### Step 3: Hooks
8. Tạo `hooks/use-branches.ts`
9. Tạo `hooks/use-teachers.ts`
10. Tạo `hooks/use-salary.ts`

### Step 4: UI Components
11. Branch components (card, modal, dashboard)
12. Teacher components (list, modal, schedule)
13. Salary components (calculator, slip, report)

### Step 5: Pages & Integration
14. Branch management page
15. Teacher management page
16. Salary page
17. Update sidebar navigation
18. Update App routing

---

## 5. Quyết định đã xác nhận

### Q1: Migration Strategy
**Đã chọn:** Cấu trúc lại hoàn toàn, không giữ data classrooms cũ
- Tất cả classrooms phải thuộc 1 branch
- Thiết kế clean từ đầu

### Q2: Salary Calculation
**Đã chọn:** Kết hợp cả hai
- Tự động tính từ teaching_sessions
- Admin có thể điều chỉnh (bonus, deduction)
- Công thức: `totalAmount = (totalHours * hourlyRate) + bonus - deduction`

### Q3: Branch Admin Permissions
**Đã chọn:** Branch Admin có quyền tạo user mới
- Tạo giáo viên/học sinh mới cho chi nhánh
- Users mới tự động được gắn với branch

---

## 6. Ước tính Scope

| Module | Components | Services | Effort |
|--------|------------|----------|--------|
| Branch | 4 | 1 | Medium |
| Teacher | 4 | 1 | Medium |
| Salary | 3 | 1 | High |
| Integration | 3 | 0 | Medium |

**Tổng:** ~15 components, 3 services, 3 hooks

---

## Unresolved Questions

1. Có cần thêm Firestore Security Rules cho multi-branch không?
2. Branch Admin có quyền tạo user mới không, hay chỉ gán users đã có?
3. Giám đốc có cần dashboard real-time với charts không?
4. Cần export báo cáo định dạng gì? (PDF, Excel, hoặc cả hai)
