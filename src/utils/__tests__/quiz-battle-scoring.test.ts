import { describe, it, expect } from 'vitest'
import {
  calculateQuestionScore,
  BASE_POINTS,
  MAX_TIME_BONUS,
} from '../quiz-battle-scoring'

describe('constants', () => {
  it('BASE_POINTS is 100', () => {
    expect(BASE_POINTS).toBe(100)
  })

  it('MAX_TIME_BONUS is 50', () => {
    expect(MAX_TIME_BONUS).toBe(50)
  })
})

describe('calculateQuestionScore', () => {
  it('returns 0 for wrong answer', () => {
    expect(calculateQuestionScore(false, 2000, 10000)).toBe(0)
  })

  it('returns 0 for zero answerTimeMs', () => {
    expect(calculateQuestionScore(true, 0, 10000)).toBe(0)
  })

  it('returns 0 for zero timeLimitMs', () => {
    expect(calculateQuestionScore(true, 2000, 0)).toBe(0)
  })

  it('returns 0 for negative answerTimeMs', () => {
    expect(calculateQuestionScore(true, -1, 10000)).toBe(0)
  })

  it('returns BASE_POINTS with no time bonus when answered at full time limit', () => {
    // answerTimeMs === timeLimitMs → timeBonus = 0
    const score = calculateQuestionScore(true, 10000, 10000)
    expect(score).toBe(BASE_POINTS)
  })

  it('returns BASE_POINTS + MAX_TIME_BONUS for instant answer', () => {
    // Answered at 1ms — nearly full time remaining
    const score = calculateQuestionScore(true, 1, 10000)
    // timeBonus = floor((9999/10000) * 50) = floor(49.995) = 49
    expect(score).toBeGreaterThanOrEqual(BASE_POINTS + MAX_TIME_BONUS - 1)
    expect(score).toBeLessThanOrEqual(BASE_POINTS + MAX_TIME_BONUS)
  })

  it('score is between BASE_POINTS and BASE_POINTS + MAX_TIME_BONUS', () => {
    const score = calculateQuestionScore(true, 3000, 10000)
    expect(score).toBeGreaterThanOrEqual(BASE_POINTS)
    expect(score).toBeLessThanOrEqual(BASE_POINTS + MAX_TIME_BONUS)
  })

  it('faster answer yields higher score', () => {
    const fast = calculateQuestionScore(true, 1000, 10000)
    const slow = calculateQuestionScore(true, 8000, 10000)
    expect(fast).toBeGreaterThan(slow)
  })

  it('returns exactly BASE_POINTS when answerTimeMs equals timeLimitMs', () => {
    expect(calculateQuestionScore(true, 5000, 5000)).toBe(BASE_POINTS)
  })

  it('max 20 questions totals up to 3000 points', () => {
    const maxPerQuestion = BASE_POINTS + MAX_TIME_BONUS
    expect(maxPerQuestion * 20).toBe(3000)
  })
})
