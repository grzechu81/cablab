import { describe, expect, it } from 'vitest'
import { evenShelfHeightOffsets } from './shelves'

describe('evenShelfHeightOffsets', () => {
  it('returns nothing for a non-positive count', () => {
    expect(evenShelfHeightOffsets(0, 720, 18)).toEqual([])
    expect(evenShelfHeightOffsets(-1, 720, 18)).toEqual([])
  })

  it('centres a single shelf in the cavity', () => {
    // low 18, high 684, span 666 → 18 + 666/2 = 351
    expect(evenShelfHeightOffsets(1, 720, 18)).toEqual([351])
  })

  it('spreads several shelves with equal gaps top and bottom', () => {
    // span 666, gaps of 666/3 = 222
    expect(evenShelfHeightOffsets(2, 720, 18)).toEqual([240, 462])
    // span 666, gaps of 666/4 = 166.5 → rounded
    expect(evenShelfHeightOffsets(3, 720, 18)).toEqual([185, 351, 518])
  })

  it('is monotonically increasing', () => {
    const offsets = evenShelfHeightOffsets(6, 2100, 18)
    for (let i = 1; i < offsets.length; i += 1) {
      expect(offsets[i]).toBeGreaterThan(offsets[i - 1])
    }
  })

  it('scales with cabinet height', () => {
    // low 18, high 964, span 946 → 18 + 946/2 = 491
    expect(evenShelfHeightOffsets(1, 1000, 18)).toEqual([491])
  })

  it('degrades gracefully when the board is thicker than the cavity', () => {
    expect(evenShelfHeightOffsets(2, 40, 25)).toEqual([25, 25])
  })
})
