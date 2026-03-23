import { describe, it, expect } from 'vitest';
import { HAN_VIET_DICT, lookupHanViet, decomposeHanViet, getCompoundHanViet } from '../han-viet-dictionary';

describe('Hán Việt Dictionary', () => {
  it('has 100+ entries', () => {
    expect(Object.keys(HAN_VIET_DICT).length).toBeGreaterThanOrEqual(100);
  });

  it('all entries have required fields', () => {
    for (const [key, entry] of Object.entries(HAN_VIET_DICT)) {
      expect(entry.kanji, `${key} missing kanji`).toBeTruthy();
      expect(entry.hanViet, `${key} missing hanViet`).toBeTruthy();
      expect(entry.meaning, `${key} missing meaning`).toBeTruthy();
    }
  });

  it('lookupHanViet finds known kanji', () => {
    const entry = lookupHanViet('日');
    expect(entry).toBeDefined();
    expect(entry!.hanViet).toBe('NHẬT');
  });

  it('lookupHanViet returns undefined for unknown', () => {
    expect(lookupHanViet('鬱')).toBeUndefined();
  });

  it('decomposeHanViet breaks compound words', () => {
    const result = decomposeHanViet('日本');
    expect(result).toEqual([
      { char: '日', hanViet: 'NHẬT' },
      { char: '本', hanViet: 'BẢN' },
    ]);
  });

  it('decomposeHanViet handles mixed kanji/hiragana', () => {
    const result = decomposeHanViet('日の本');
    expect(result[0].hanViet).toBe('NHẬT');
    expect(result[1].hanViet).toBeNull(); // の is not kanji
    expect(result[2].hanViet).toBe('BẢN');
  });

  it('getCompoundHanViet returns joined reading', () => {
    const result = getCompoundHanViet('大学');
    expect(result).toBe('ĐẠI HỌC');
  });

  it('getCompoundHanViet keeps non-kanji chars', () => {
    const result = getCompoundHanViet('日の出');
    expect(result).toContain('NHẬT');
    expect(result).toContain('の');
    expect(result).toContain('XUẤT');
  });

  it('common compounds have correct readings', () => {
    expect(lookupHanViet('学')!.hanViet).toBe('HỌC');
    expect(lookupHanViet('生')!.hanViet).toBe('SINH');
    expect(lookupHanViet('人')!.hanViet).toBe('NHÂN');
    expect(lookupHanViet('国')!.hanViet).toBe('QUỐC');
  });
});
