import { describe, it, expect } from 'vitest'
import { KANGXI_RADICALS } from '../radicals'

describe('KANGXI_RADICALS', () => {
  it('exports an array', () => {
    expect(Array.isArray(KANGXI_RADICALS)).toBe(true)
  })

  it('has 214 entries (all Kangxi radicals)', () => {
    expect(KANGXI_RADICALS).toHaveLength(214)
  })

  it('each entry has required fields', () => {
    KANGXI_RADICALS.forEach((r, i) => {
      expect(typeof r.number, `entry ${i} number`).toBe('number')
      expect(typeof r.character, `entry ${i} character`).toBe('string')
      expect(typeof r.strokeCount, `entry ${i} strokeCount`).toBe('number')
      expect(typeof r.vietnameseName, `entry ${i} vietnameseName`).toBe('string')
      expect(typeof r.meaning, `entry ${i} meaning`).toBe('string')
    })
  })

  it('numbers are unique (no duplicates)', () => {
    const numbers = KANGXI_RADICALS.map(r => r.number)
    const unique = new Set(numbers)
    expect(unique.size).toBe(numbers.length)
  })

  it('characters are unique', () => {
    const chars = KANGXI_RADICALS.map(r => r.character)
    const unique = new Set(chars)
    expect(unique.size).toBe(chars.length)
  })

  it('numbers range from 1 to 214', () => {
    const numbers = KANGXI_RADICALS.map(r => r.number).sort((a, b) => a - b)
    expect(numbers[0]).toBe(1)
    expect(numbers[numbers.length - 1]).toBe(214)
  })

  it('stroke counts are positive integers', () => {
    KANGXI_RADICALS.forEach(r => {
      expect(r.strokeCount).toBeGreaterThan(0)
    })
  })

  it('first entry is radical 一 (number 1, 1 stroke)', () => {
    const first = KANGXI_RADICALS.find(r => r.number === 1)
    expect(first?.character).toBe('一')
    expect(first?.strokeCount).toBe(1)
  })

  it('no entry has empty character', () => {
    KANGXI_RADICALS.forEach(r => {
      expect(r.character.length).toBeGreaterThan(0)
    })
  })

  it('no entry has empty vietnameseName', () => {
    KANGXI_RADICALS.forEach(r => {
      expect(r.vietnameseName.length).toBeGreaterThan(0)
    })
  })
})
