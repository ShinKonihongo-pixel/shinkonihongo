#!/usr/bin/env python3
"""
Process N1 Part3 kanji entries to add Vietnamese mnemonics and sample words.
This script continues from where manual edits left off.
"""

import re

# Read the current file
with open('src/data/kanji-seed/n1-part3.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all entries that don't have 'w:' field yet
# Pattern: lines starting with { c: that don't have w: in the next few lines
lines = content.split('\n')

incomplete_count = 0
for i, line in enumerate(lines):
    if line.strip().startswith("{ c:") and "w:" not in line:
        # Check next 3 lines
        has_w = False
        for j in range(i, min(i+4, len(lines))):
            if 'w:' in lines[j]:
                has_w = True
                break
        if not has_w:
            incomplete_count += 1

print(f"Found {incomplete_count} incomplete entries")
print("Processing would require AI assistance for accurate Japanese words and mnemonics")
print("Continuing with manual batch processing...")
