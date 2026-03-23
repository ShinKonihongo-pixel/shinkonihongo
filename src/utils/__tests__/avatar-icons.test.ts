import { describe, it, expect } from 'vitest'
import {
  isImageAvatar,
  getRandomAvatar,
  getAvatarsByCategory,
  ILLUSTRATED_AVATARS,
  CUSTOM_AVATARS,
  EMOJI_AVATARS,
  IMAGE_AVATARS,
  ALL_AVATAR_ICONS,
  AVATAR_CATEGORIES,
} from '../avatar-icons'

describe('isImageAvatar', () => {
  it('returns true for /avatars/ path', () => {
    expect(isImageAvatar('/avatars/girl_435066.png')).toBe(true)
  })

  it('returns true for http URL', () => {
    expect(isImageAvatar('https://example.com/avatar.png')).toBe(true)
  })

  it('returns true for http (non-secure) URL', () => {
    expect(isImageAvatar('http://example.com/avatar.png')).toBe(true)
  })

  it('returns false for emoji', () => {
    expect(isImageAvatar('😊')).toBe(false)
  })

  it('returns false for plain emoji string', () => {
    expect(isImageAvatar('🐱')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isImageAvatar('')).toBe(false)
  })

  it('returns false for icon name without /avatars/ prefix', () => {
    expect(isImageAvatar('avatar.png')).toBe(false)
  })
})

describe('getRandomAvatar', () => {
  it('returns a non-empty string', () => {
    const avatar = getRandomAvatar()
    expect(typeof avatar).toBe('string')
    expect(avatar.length).toBeGreaterThan(0)
  })

  it('returns an avatar from ALL_AVATAR_ICONS', () => {
    for (let i = 0; i < 20; i++) {
      const avatar = getRandomAvatar()
      expect(ALL_AVATAR_ICONS).toContain(avatar)
    }
  })
})

describe('getAvatarsByCategory', () => {
  it('returns ILLUSTRATED_AVATARS for "illustrated" category', () => {
    expect(getAvatarsByCategory('illustrated')).toEqual(ILLUSTRATED_AVATARS)
  })

  it('returns CUSTOM_AVATARS for "custom" category', () => {
    expect(getAvatarsByCategory('custom')).toEqual(CUSTOM_AVATARS)
  })

  it('returns EMOJI_AVATARS for "emoji" category', () => {
    expect(getAvatarsByCategory('emoji')).toEqual(EMOJI_AVATARS)
  })

  it('returns empty array for unknown category', () => {
    expect(getAvatarsByCategory('unknown')).toEqual([])
  })
})

describe('data arrays', () => {
  it('ILLUSTRATED_AVATARS has entries', () => {
    expect(ILLUSTRATED_AVATARS.length).toBeGreaterThan(0)
  })

  it('CUSTOM_AVATARS has 49 entries', () => {
    expect(CUSTOM_AVATARS).toHaveLength(49)
  })

  it('CUSTOM_AVATARS paths start from /avatars/1.png', () => {
    expect(CUSTOM_AVATARS[0]).toBe('/avatars/1.png')
    expect(CUSTOM_AVATARS[48]).toBe('/avatars/49.png')
  })

  it('EMOJI_AVATARS contains only non-image strings', () => {
    EMOJI_AVATARS.forEach(e => {
      expect(isImageAvatar(e)).toBe(false)
    })
  })

  it('IMAGE_AVATARS = ILLUSTRATED + CUSTOM combined', () => {
    expect(IMAGE_AVATARS).toEqual([...ILLUSTRATED_AVATARS, ...CUSTOM_AVATARS])
  })

  it('ALL_AVATAR_ICONS = IMAGE_AVATARS + EMOJI_AVATARS', () => {
    expect(ALL_AVATAR_ICONS).toEqual([...IMAGE_AVATARS, ...EMOJI_AVATARS])
  })

  it('AVATAR_CATEGORIES has 3 entries', () => {
    expect(AVATAR_CATEGORIES).toHaveLength(3)
  })

  it('AVATAR_CATEGORIES image entries have isImage=true', () => {
    const illustratedCat = AVATAR_CATEGORIES.find(c => c.key === 'illustrated')
    const customCat = AVATAR_CATEGORIES.find(c => c.key === 'custom')
    expect(illustratedCat?.isImage).toBe(true)
    expect(customCat?.isImage).toBe(true)
  })

  it('AVATAR_CATEGORIES emoji entry has isImage=false', () => {
    const emojiCat = AVATAR_CATEGORIES.find(c => c.key === 'emoji')
    expect(emojiCat?.isImage).toBe(false)
  })
})
