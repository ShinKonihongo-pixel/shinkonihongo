# KRADFILE Kanji Radical Decomposition Data - Research Report

Date: 2026-03-21

## Executive Summary

KRADFILE is the authoritative kanji-to-radical decomposition dataset from the Electronic Dictionary Research and Development Group (EDRDG). Three primary data sources identified:

1. **Original KRADFILE** from EDRDG FTP server
2. **krad-unicode** - Converted to JSON/UTF-8 (6,355 kanji)
3. **jmdict-simplified** - Comprehensive JSON package (includes KRADFILE + RADKFILE)

---

## 1. Original KRADFILE from EDRDG

### Download URLs

| File | URL |
|------|-----|
| KRADFILE (JIS X 0208) | `http://ftp.edrdg.org/pub/Nihongo/kradfile.gz` |
| KRADFILE2 + RADKFILE2 (JIS X 0212) | `http://ftp.edrdg.org/pub/Nihongo/kradzip.zip` |

### Data Coverage

- **KRADFILE**: 6,355 kanji (JIS X 0208-1997 standard)
- **KRADFILE2**: 5,801 kanji (JIS X 0212 supplementary set)
- **RADKFILE2**: Additional 952 kanji (JIS X 0213)
- **Total radicals/components**: 253 unique elements

### File Format

Plain text, one kanji per line:

```
kanji : component1 component2 component3 ...
```

**Example** (hypothetical):
```
漢 : 氵 寒
字 : 宀 子
```

**Encoding**: Original is EUC-JP encoded. KRADFILE-Unicode variant uses UTF-8.

### Licensing

- Copyright: EDRDG (Electronic Dictionary Research and Development Group)
- Led by: James William Breen
- License: EDRDG Licence Agreement (restrictive for commercial use)

---

## 2. krad-unicode (JSON Conversion)

**Repository**: [hoffmannjp/krad-unicode](https://github.com/hoffmannjp/krad-unicode)

### Raw GitHub URLs

```
https://raw.githubusercontent.com/hoffmannjp/krad-unicode/main/krad.json
https://raw.githubusercontent.com/hoffmannjp/krad-unicode/main/krad_components.json
https://raw.githubusercontent.com/hoffmannjp/krad-unicode/main/possible_groups.json
```

### Files Provided

1. **krad.json** - Kanji-to-components mapping (6,355 entries)
   - Structure: `{ kanji: [component1, component2, ...] }`
   - Unicode characters used instead of JIS X 0208 substitutes

2. **krad_components.json** - Component metadata (253 entries)
   - Structure: `{ component: stroke_count }`

3. **possible_groups.json** - All valid component combinations

### Key Advantage

Replaces JIS X 0208 placeholder characters with proper Unicode equivalents.

Example: `化` → `⺅`, `个` → `𠆢`

---

## 3. jmdict-simplified

**Repository**: [scriptin/jmdict-simplified](https://github.com/scriptin/jmdict-simplified)

### Distribution Method

**Not a traditional npm package.** Pre-built JSON files distributed via GitHub releases.

**Latest Release URL**: `https://github.com/scriptin/jmdict-simplified/releases/latest`

**Release Schedule**: Automatically updated every Monday

**Download Format**: ZIP or tar+gzip archives

### Data Included

- JMdict (dictionary entries)
- JMnedict (named entities)
- Kanjidic (kanji info)
- **KRADFILE** (kanji-to-radical mapping)
- **RADKFILE** (radical-to-kanji mapping)

### JSON Structure

**KRADFILE in JSON**:
```json
{
  "kanji": {
    "字": ["宀", "子"],
    "漢": ["氵", "寒"]
  }
}
```

**RADKFILE in JSON**:
```json
{
  "radicals": {
    "氵": { "stroke_count": 3 },
    "宀": { "stroke_count": 3 }
  }
}
```

---

## 4. NPM Packages for Kanji Radicals

### Actively Maintained

| Package | Status | Use Case |
|---------|--------|----------|
| **kanji** | 5-year-old | Kanji composition trees, reading data |
| **kanjidic** | Inactive | Wraps KANJIDIC with radical number lookup |
| **kanji.js** | Legacy | Browser-compatible KANJIDIC lookup |

### Python Alternative

**jamdict** (PyPI) - Python library with built-in KRAD/RADK support
- Supports kanji-radical and radical-kanji bidirectional lookups
- Included KRADFILE parsing

---

## 5. Comparison: Which Source to Use?

### Use EDRDG KRADFILE directly if:
- You need the authoritative, unmodified source
- You're building kanji research tools
- You can handle EUC-JP/gzip files

### Use krad-unicode if:
- You want JSON format immediately
- You need UTF-8 encoding instead of JIS X 0208 substitutes
- You want to fetch via GitHub raw CDN
- File sizes are small (krad.json ~200KB)

### Use jmdict-simplified if:
- You need comprehensive Japanese linguistic data
- You want kanji↔radical bidirectional mapping (KRADFILE + RADKFILE)
- You need reliable weekly updates
- You want one unified distribution package

### Avoid NPM packages if:
- You need comprehensive, frequently-updated data
- You're building serious kanji tools
- The npm packages are 5+ years stale

---

## 6. Integration Recommendations

### For Lightweight Client-Side Apps

Fetch krad-unicode's `krad.json` directly:
```javascript
const response = await fetch(
  'https://raw.githubusercontent.com/hoffmannjp/krad-unicode/main/krad.json'
);
const radicalMap = await response.json();
```

### For Comprehensive Backend

Use jmdict-simplified's latest release and parse locally. Run weekly update check to pull new releases.

### For Production

Consider hosting a cached copy (via CDN or internal S3) rather than repeatedly hitting GitHub raw content to avoid rate limiting.

---

## Technical Notes

### File Sizes (Approximate)

- KRADFILE (original, gzipped): ~30KB
- krad.json (uncompressed): ~200KB
- jmdict-simplified full package: ~10-15MB (includes all dictionaries)

### Licensing Considerations

- **EDRDG files**: Restrictive - review license agreement at [kanjicafe.com](http://www.kanjicafe.com/kradfile_license.htm)
- **krad-unicode**: Inherits EDRDG license terms (likely same restrictions)
- **jmdict-simplified**: Check individual component licenses (KANJIDIC2 is EDRDG, RADKFILE is EDRDG)

All three are **non-commercial or limited commercial use only**.

---

## Unresolved Questions

1. **CDN availability**: GitHub's raw.githubusercontent.com is infrastructure-dependent; no guarantee of uptime or performance. Are you considering a production setup that needs SLA guarantees?

2. **Update frequency needed**: If you need beyond-weekly updates, EDRDG FTP may be better, but it lacks JSON conversion automation.

3. **Commercial licensing**: If you're building commercial products, verify license compatibility with EDRDG Licence Agreement before integration.

4. **Component stroke counts**: jmdict-simplified claims to provide stroke counts for radicals. Need to verify completeness vs. krad_components.json.
