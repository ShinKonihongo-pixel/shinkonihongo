import { describe, it, expect } from 'vitest'
import { canAccessPage } from '../role-permissions'
import type { UserRole } from '../../types/user'

// All roles in the system
const ALL_ROLES: UserRole[] = [
  'super_admin',
  'director',
  'branch_admin',
  'main_teacher',
  'part_time_teacher',
  'assistant',
  'admin',
  'vip_user',
  'user',
]

// Helpers
const allows = (page: string, role: UserRole) => canAccessPage(page, role)
const denies = (page: string, role: UserRole) => !canAccessPage(page, role)

describe('canAccessPage — undefined role', () => {
  it('returns false when role is undefined', () => {
    expect(canAccessPage('branches', undefined)).toBe(false)
    expect(canAccessPage('cards', undefined)).toBe(false)
    expect(canAccessPage('unknown-page', undefined)).toBe(false)
  })
})

describe('canAccessPage — non-protected pages', () => {
  it('returns true for any authenticated role on open pages', () => {
    for (const role of ALL_ROLES) {
      expect(canAccessPage('home', role)).toBe(true)
      expect(canAccessPage('study', role)).toBe(true)
      expect(canAccessPage('unknown-page', role)).toBe(true)
    }
  })
})

// branches / teachers / salary — director | branch_admin | super_admin
describe.each(['branches', 'teachers', 'salary'])('canAccessPage — %s (branch manager pages)', (page) => {
  it('allows director', () => expect(allows(page, 'director')).toBe(true))
  it('allows branch_admin', () => expect(allows(page, 'branch_admin')).toBe(true))
  it('allows super_admin', () => expect(allows(page, 'super_admin')).toBe(true))

  it('denies main_teacher', () => expect(denies(page, 'main_teacher')).toBe(true))
  it('denies part_time_teacher', () => expect(denies(page, 'part_time_teacher')).toBe(true))
  it('denies assistant', () => expect(denies(page, 'assistant')).toBe(true))
  it('denies admin (legacy)', () => expect(denies(page, 'admin')).toBe(true))
  it('denies vip_user', () => expect(denies(page, 'vip_user')).toBe(true))
  it('denies user', () => expect(denies(page, 'user')).toBe(true))
})

// my-teaching — main_teacher | part_time_teacher | assistant
describe('canAccessPage — my-teaching', () => {
  it('allows main_teacher', () => expect(allows('my-teaching', 'main_teacher')).toBe(true))
  it('allows part_time_teacher', () => expect(allows('my-teaching', 'part_time_teacher')).toBe(true))
  it('allows assistant', () => expect(allows('my-teaching', 'assistant')).toBe(true))

  it('denies director', () => expect(denies('my-teaching', 'director')).toBe(true))
  it('denies branch_admin', () => expect(denies('my-teaching', 'branch_admin')).toBe(true))
  it('denies super_admin', () => expect(denies('my-teaching', 'super_admin')).toBe(true))
  it('denies admin (legacy)', () => expect(denies('my-teaching', 'admin')).toBe(true))
  it('denies vip_user', () => expect(denies('my-teaching', 'vip_user')).toBe(true))
  it('denies user', () => expect(denies('my-teaching', 'user')).toBe(true))
})

// permissions — super_admin only
describe('canAccessPage — permissions', () => {
  it('allows super_admin', () => expect(allows('permissions', 'super_admin')).toBe(true))

  it('denies director', () => expect(denies('permissions', 'director')).toBe(true))
  it('denies branch_admin', () => expect(denies('permissions', 'branch_admin')).toBe(true))
  it('denies admin (legacy)', () => expect(denies('permissions', 'admin')).toBe(true))
  it('denies main_teacher', () => expect(denies('permissions', 'main_teacher')).toBe(true))
  it('denies vip_user', () => expect(denies('permissions', 'vip_user')).toBe(true))
  it('denies user', () => expect(denies('permissions', 'user')).toBe(true))
})

// lecture-editor / cards — legacy isAdmin: 'admin' | 'super_admin'
describe.each(['lecture-editor', 'cards'])('canAccessPage — %s (legacy admin pages)', (page) => {
  it('allows super_admin', () => expect(allows(page, 'super_admin')).toBe(true))
  it('allows admin (legacy)', () => expect(allows(page, 'admin')).toBe(true))

  // Key distinction: director and branch_admin are NOT included (matches isAdmin from use-auth.ts)
  it('denies director', () => expect(denies(page, 'director')).toBe(true))
  it('denies branch_admin', () => expect(denies(page, 'branch_admin')).toBe(true))
  it('denies main_teacher', () => expect(denies(page, 'main_teacher')).toBe(true))
  it('denies part_time_teacher', () => expect(denies(page, 'part_time_teacher')).toBe(true))
  it('denies assistant', () => expect(denies(page, 'assistant')).toBe(true))
  it('denies vip_user', () => expect(denies(page, 'vip_user')).toBe(true))
  it('denies user', () => expect(denies(page, 'user')).toBe(true))
})
