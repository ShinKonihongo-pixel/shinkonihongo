import { describe, it, expect } from 'vitest'
import {
  calculateExpectedScore,
  calculateNewRating,
  calculateRatingChanges,
} from '../elo-rating'

describe('calculateExpectedScore', () => {
  it('returns 0.5 for equal ratings', () => {
    expect(calculateExpectedScore(1000, 1000)).toBeCloseTo(0.5)
  })

  it('returns > 0.5 when player is higher rated', () => {
    expect(calculateExpectedScore(1200, 1000)).toBeGreaterThan(0.5)
  })

  it('returns < 0.5 when player is lower rated', () => {
    expect(calculateExpectedScore(1000, 1200)).toBeLessThan(0.5)
  })

  it('returns value between 0 and 1', () => {
    const score = calculateExpectedScore(800, 2000)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })
})

describe('calculateNewRating', () => {
  it('increases rating on win', () => {
    const newRating = calculateNewRating(1000, 1000, 'win')
    expect(newRating).toBeGreaterThan(1000)
  })

  it('decreases rating on loss', () => {
    const newRating = calculateNewRating(1000, 1000, 'loss')
    expect(newRating).toBeLessThan(1000)
  })

  it('barely changes rating on draw between equal players', () => {
    const newRating = calculateNewRating(1000, 1000, 'draw')
    expect(newRating).toBeCloseTo(1000, -1) // within ~10 points
  })

  it('rating does not drop below floor (100)', () => {
    // Very low rated player loses to very high rated opponent
    const newRating = calculateNewRating(101, 3000, 'loss')
    expect(newRating).toBeGreaterThanOrEqual(100)
  })

  it('higher-rated player losing causes bigger drop than lower-rated player losing to equal', () => {
    // High-rated player (1600) losing to low-rated (1000) — upset, K is larger
    const highRatedLoss = calculateNewRating(1600, 1000, 'loss')
    const highRatedChange = 1600 - highRatedLoss

    // Equal rated players
    const equalLoss = calculateNewRating(1000, 1000, 'loss')
    const equalChange = 1000 - equalLoss

    // The upset (higher-rated losing to lower-rated) should lose more points
    // because dynamic K is larger for bigger gap
    expect(highRatedChange).toBeGreaterThan(equalChange)
  })

  it('lower expected score win gives bigger rating gain', () => {
    // Underdog (1000) beats favourite (1600)
    const underdogWin = calculateNewRating(1000, 1600, 'win')
    // Equal win
    const equalWin = calculateNewRating(1000, 1000, 'win')

    expect(underdogWin - 1000).toBeGreaterThan(equalWin - 1000)
  })
})

describe('calculateRatingChanges', () => {
  it('returns four fields', () => {
    const result = calculateRatingChanges(1000, 1000)
    expect(result).toHaveProperty('winnerChange')
    expect(result).toHaveProperty('loserChange')
    expect(result).toHaveProperty('winnerNew')
    expect(result).toHaveProperty('loserNew')
  })

  it('winner gains, loser loses for equal ratings', () => {
    const { winnerChange, loserChange } = calculateRatingChanges(1000, 1000)
    expect(winnerChange).toBeGreaterThan(0)
    expect(loserChange).toBeLessThan(0)
  })

  it('draw: both players near zero change for equal ratings', () => {
    const { winnerChange, loserChange } = calculateRatingChanges(1000, 1000, true)
    expect(winnerChange).toBeCloseTo(0, -1)
    expect(loserChange).toBeCloseTo(0, -1)
  })

  it('winnerNew = winnerRating + winnerChange', () => {
    const { winnerNew, winnerChange } = calculateRatingChanges(1200, 800)
    expect(winnerNew).toBe(1200 + winnerChange)
  })

  it('loserNew = loserRating + loserChange', () => {
    const { loserNew, loserChange } = calculateRatingChanges(1200, 800)
    expect(loserNew).toBe(800 + loserChange)
  })

  it('higher-rated player losing to lower-rated has larger loss magnitude (dynamic K)', () => {
    // Favourite (1600) vs underdog (1000)
    const { loserChange: favouriteLoss } = calculateRatingChanges(1000, 1600)
    // Equal players
    const { loserChange: equalLoss } = calculateRatingChanges(1000, 1000)
    expect(Math.abs(favouriteLoss)).toBeGreaterThan(Math.abs(equalLoss))
  })
})
