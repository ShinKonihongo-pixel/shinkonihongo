import { describe, it, expect } from 'vitest'
import { generateSlug, validateSlug, generateInviteCode } from '../slug'

describe('generateSlug', () => {
  it('converts ASCII text to lowercase hyphenated slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('converts Vietnamese diacritics', () => {
    expect(generateSlug('Tiếng Nhật')).toBe('tieng-nhat')
  })

  it('handles đ/Đ characters', () => {
    expect(generateSlug('Đại học')).toBe('dai-hoc')
    expect(generateSlug('đường phố')).toBe('duong-pho')
  })

  it('removes special characters', () => {
    expect(generateSlug('Hello! World#2')).toBe('hello-world2')
  })

  it('collapses multiple spaces into single hyphen', () => {
    expect(generateSlug('a   b')).toBe('a-b')
  })

  it('collapses multiple hyphens', () => {
    expect(generateSlug('a--b')).toBe('a-b')
  })

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug(' hello ')).toBe('hello')
  })

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })

  it('handles string with only special characters', () => {
    expect(generateSlug('!!! ###')).toBe('')
  })

  it('handles numbers', () => {
    expect(generateSlug('N5 2024')).toBe('n5-2024')
  })

  it('strips CJK characters (not in a-z0-9)', () => {
    expect(generateSlug('漢字')).toBe('')
  })

  it('full Vietnamese school name', () => {
    const result = generateSlug('Trường Đại Học Bách Khoa')
    expect(result).toBe('truong-dai-hoc-bach-khoa')
  })
})

describe('validateSlug', () => {
  it('accepts valid slug', () => {
    expect(validateSlug('hello-world')).toBe(true)
  })

  it('accepts slug with numbers', () => {
    expect(validateSlug('abc123')).toBe(true)
  })

  it('rejects slug shorter than 3 chars', () => {
    expect(validateSlug('ab')).toBe(false)
  })

  it('rejects slug longer than 50 chars', () => {
    expect(validateSlug('a' + '-'.repeat(48) + 'b' + 'x')).toBe(false)
  })

  it('rejects slug with uppercase', () => {
    expect(validateSlug('Hello')).toBe(false)
  })

  it('rejects slug with leading hyphen', () => {
    expect(validateSlug('-hello')).toBe(false)
  })

  it('rejects slug with trailing hyphen', () => {
    expect(validateSlug('hello-')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(validateSlug('')).toBe(false)
  })

  it('accepts exactly 3-char slug', () => {
    expect(validateSlug('abc')).toBe(true)
  })
})

describe('generateInviteCode', () => {
  it('generates 6 character code', () => {
    const code = generateInviteCode()
    expect(code).toHaveLength(6)
  })

  it('code contains only valid characters (no 0, O, 1, I)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode()
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/)
      expect(code).not.toMatch(/[01IO]/)
    }
  })

  it('generates different codes on repeated calls', () => {
    const codes = new Set(Array.from({ length: 20 }, generateInviteCode))
    expect(codes.size).toBeGreaterThan(1)
  })
})
