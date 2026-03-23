import { describe, it, expect } from 'vitest'
import { KRAD_DECOMPOSITION } from '../krad-decomposition'

describe('KRAD_DECOMPOSITION', () => {
  it('exports an object', () => {
    expect(typeof KRAD_DECOMPOSITION).toBe('object')
    expect(KRAD_DECOMPOSITION).not.toBeNull()
  })

  it('has kanji entries', () => {
    expect(Object.keys(KRAD_DECOMPOSITION).length).toBeGreaterThan(0)
  })

  it('each value is a non-empty array', () => {
    Object.entries(KRAD_DECOMPOSITION).forEach(([kanji, radicals]) => {
      expect(Array.isArray(radicals), `${kanji} should have array value`).toBe(true)
      expect(radicals.length, `${kanji} should have at least one radical`).toBeGreaterThan(0)
    })
  })

  it('each radical entry is a non-empty string', () => {
    Object.entries(KRAD_DECOMPOSITION).forEach(([kanji, radicals]) => {
      radicals.forEach((r, i) => {
        expect(typeof r, `${kanji}[${i}] should be string`).toBe('string')
        expect(r.length, `${kanji}[${i}] should not be empty`).toBeGreaterThan(0)
      })
    })
  })

  it('contains common JLPT kanji', () => {
    // Basic kanji that should be in any education-level decomposition
    expect(KRAD_DECOMPOSITION).toHaveProperty('一')
    expect(KRAD_DECOMPOSITION).toHaveProperty('人')
    expect(KRAD_DECOMPOSITION).toHaveProperty('口')
  })

  it('一 decomposes to itself', () => {
    expect(KRAD_DECOMPOSITION['一']).toEqual(['一'])
  })

  it('人 decomposes to itself', () => {
    expect(KRAD_DECOMPOSITION['人']).toEqual(['人'])
  })

  it('compound kanji 中 contains 口 and 丨', () => {
    expect(KRAD_DECOMPOSITION['中']).toContain('口')
    expect(KRAD_DECOMPOSITION['中']).toContain('丨')
  })

  it('no duplicate keys (Record guarantees this, but sanity check length)', () => {
    const keys = Object.keys(KRAD_DECOMPOSITION)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })

  it('has substantial number of entries (education-level coverage)', () => {
    expect(Object.keys(KRAD_DECOMPOSITION).length).toBeGreaterThan(100)
  })
})
