// Type declarations for kuroshiro and kuroshiro-analyzer-kuromoji

declare module 'kuroshiro' {
  interface ConvertOptions {
    mode?: 'normal' | 'spaced' | 'okurigana' | 'furigana';
    to?: 'hiragana' | 'katakana' | 'romaji';
    romajiSystem?: 'nippon' | 'passport' | 'hepburn';
    delimiter_start?: string;
    delimiter_end?: string;
  }

  interface Analyzer {
    init(): Promise<void>;
    parse(text: string): Promise<unknown[]>;
  }

  class Kuroshiro {
    constructor();
    init(analyzer: Analyzer): Promise<void>;
    convert(text: string, options?: ConvertOptions): Promise<string>;
    static Util: {
      isHiragana(char: string): boolean;
      isKatakana(char: string): boolean;
      isKana(char: string): boolean;
      isKanji(char: string): boolean;
      isJapanese(char: string): boolean;
      hasHiragana(str: string): boolean;
      hasKatakana(str: string): boolean;
      hasKana(str: string): boolean;
      hasKanji(str: string): boolean;
      hasJapanese(str: string): boolean;
      kanaToHiragana(str: string): string;
      kanaToKatakana(str: string): string;
      kanaToRomaji(str: string, romajiSystem?: string): string;
    };
  }

  export default Kuroshiro;
}

declare module 'kuroshiro-analyzer-kuromoji' {
  interface AnalyzerOptions {
    dictPath?: string;
  }

  class KuromojiAnalyzer {
    constructor(options?: AnalyzerOptions);
    init(): Promise<void>;
    parse(text: string): Promise<unknown[]>;
  }

  export default KuromojiAnalyzer;
}
