# Student Report Card Design Patterns Analysis
## Japanese Language Learning App (Shinko) — Research Report

---

## EXISTING PLATFORMS ANALYSIS

### 1. Duolingo — Gamified Progress
**Layout**: Dashboard → Weekly XP bar graph + 7-day streak calendar + Time stats
**Visuals**: 🔥 Flame icon, bar charts (3-week comparison), XP counts
**Data**: Weekly XP, daily time, streak count, lesson completion, yearly recap
**Unique**: Animated milestone celebrations, emotional engagement, comparison to other learners
**Colors**: Green + orange accent
**Chart Types**: Simple bar graphs, streak calendar grid
**PDF Export**: Annual "Year in Review" recap style

### 2. Khan Academy — Teacher/Parent Data-Centric
**Layout**: Activity Overview → Progress tab → Mastery Goals → Individual reports
**Visuals**: Clean tables, skill progression charts, assignment scores
**Data**: Course breakdown, mastery levels, learning time, skill comprehension, assignment scores
**Unique**: Drillable reports (teacher can filter by student/timeframe), customizable output
**Colors**: Blue + gray, minimal
**Chart Types**: Mastery bar indicators, time spent bar graphs
**PDF Export**: Generated email-able reports

### 3. Google Classroom — Minimal Native Reports
**Layout**: Simple Student Work Summary email format
**Visuals**: Text-heavy, missing assignment list, grades
**Data**: Missing assignments, scores, submission status
**Unique**: Third-party apps required for visual enhancement (Grade Reports app adds charts/trends)
**Colors**: Google's white/gray/blue
**Chart Types**: None native; third-party adds trend lines

### 4. ClassDojo — Behavioral Skills Focus
**Layout**: Donut chart → Weekly breakdown → Daily percentage stats
**Visuals**: Colorful donut charts, customizable skill icons, emoji/symbols
**Data**: Positive/negative behavior percentages, daily/weekly/monthly, custom date ranges
**Unique**: Real-time parent notifications, photo/video uploads from class, skill customization
**Colors**: Bright & playful (purple, orange, green)
**Chart Types**: Donut charts, percentage breakdown
**PDF Export**: Printable for parent conferences & report cards

### 5. Seesaw — Portfolio + Standards-Based
**Layout**: Learning Journal → PROCESS stage → PRODUCT stage → Portfolio archive
**Visuals**: Student work artifacts (photos/videos), standards checklist, skill mastery tags
**Data**: Project completion, skill mastery evidence, behavioral comments, growth over time
**Unique**: Two-stage learning documentation, standards alignment, time-lapse of learning
**Colors**: Light/playful (teal accents)
**Chart Types**: Skills mastery grid, progress tags

### 6. Remind — Communication-Focused (Not Report)
**Layout**: Engagement reports (CSV pivot tables provided)
**Visuals**: Weekly engagement metrics, usage data
**Data**: Student/teacher/parent communication frequency, message counts, response rates
**Unique**: Multi-language translation tracking, engagement trending
**Colors**: Blue + white
**Chart Types**: Pivot-table driven (CSV templates)

### 7. Canvas LMS — Enterprise Analytics
**Layout**: Gradebook → New Analytics → Course-level → Student context cards
**Visuals**: Average grades by assessment, page view/participation tracking, performance heatmap
**Data**: Assignment grades, submission status, last login, weekly participation, course trends
**Unique**: 24-hour data refresh, individual student context cards, participation definition
**Colors**: Neutral/enterprise (white, blue, gray)
**Chart Types**: Bar charts, engagement heatmaps

### 8. Coursera — Certificate + Linear Progress
**Layout**: Course dashboard → Week-by-week progress bar → Next recommended item → Certificate
**Visuals**: Horizontal progress bar, milestone badges, QR-coded PDF certificate
**Data**: Course completion %, lessons completed, quizzes passed, specialization progress
**Unique**: Next-step recommendation, shareable credential with QR code, specialization stacking
**Colors**: Blue + navy (corporate feel)
**Chart Types**: Linear progress bars, achievement badges

---

## CULTURAL REPORT CARD FORMATS

### Japanese School Report Card (通知表 / tsūchihyō)
**Structure**: Multi-section grid format
- **Evaluation scales**: 1-5 (modern) or ◎○△ (circle system, older)
- **Sections**: Academic subjects + Behavioral/effort (出席, 授業態度, 協力, 健康) separate
- **Focus**: Daily performance > final exams (especially elementary)
- **Format**: Grid table with comments, focus on effort/attitude over raw grades
- **Colors**: Traditional black/red on white paper
- **Typography**: Formal, teacher-written comments crucial

### Vietnamese School Report (Phiếu liên lạc / Sổ liên lạc)
**Structure**: Communication notebook + electronic tracking
- **Assessment levels**: 4 tiers (Excellent 9+, Good 7+, Satisfactory 5+, Not Yet 0-4)
- **Data**: Subject grades, conduct scores, health records, attendance, classroom events
- **Sections**: Subject performance + attendance + teacher notes + parent signature
- **Format**: Hybrid paper/digital with modern electronic versions (vnEdu, SMAS)
- **Colors**: Traditional educational paper blue/red
- **Typography**: Mix of printed + handwritten teacher comments

---

## 2 PROPOSED REPORT STYLES FOR SHINKO

### STYLE 1: VISUAL/INFOGRAPHIC (Duolingo-Inspired)
**Target**: Students, casual learners, mobile-first
**Best for**: Motivation, gamification, weekly sharing

**Layout (Top-to-Bottom)**:
1. **Header card**: Student name + level badge (N1→N5) + "This Week" subtitle
2. **Hero metric**: Large XP count + flame streak (Days) with animation
3. **3-column grid**:
   - Kanji learned (count + icon)
   - Vocabulary mastered (count + icon)
   - Lessons completed (count + icon)
4. **Weekly bar chart**: XP comparison (This Week vs Last Week vs Avg)
5. **Skill breakdown**: Horizontal progress rings (Reading %, Listening %, Speaking %)
6. **Achievement unlocked**: 2-3 recent badges with icons
7. **Footer**: "Keep it up!" + Next milestone needed for reward

**Color Palette**:
- Primary: Deep purple (#7c3aed)
- Accent: Bright pink (#ec4899) + gold (#fbbf24)
- Background: White with light purple gradient sections
- Text: Dark gray on white, white on purple sections

**Typography**:
- Bold sans-serif for numbers (numbers =  primary message)
- Light sans-serif for labels

**Chart Types**:
- Horizontal bar graph (weekly XP)
- Circular progress rings (skills)
- Flame + number (streak)
- Icon + count (achievements)

**PDF Export**: A4 "Weekly Snapshot" — compact 1-page with fun icons, shareable on social

---

### STYLE 2: PROFESSIONAL/ACADEMIC (Khan Academy + Canvas-Inspired)
**Target**: Parents, teachers, formal assessment contexts
**Best for**: Official records, school reports, progress documentation

**Layout (Top-to-Bottom)**:
1. **Report header**: Student name | Date range | Report ID | School/Organization
2. **Summary table**:
   - | Metric | Value | Target | Status |
   - | Kanji mastered | 150/500 | 500 | On track ✓ |
   - | Vocabulary | 1,200/2,500 | 2,500 | Behind |
   - | Listening score | 72% | 80% | Near target |
   - | Reading accuracy | 68% | 75% | Needs work |
3. **Skill breakdown grid** (2×3 table):
   - Kanji reading | Level N4 | 72% mastery
   - Kanji writing | Level N5 | 55% mastery
   - Grammar | Level N4 | 81% mastery
   - Vocabulary | Level N3 | 60% mastery
   - Listening | Level N4 | 72% mastery
   - Speaking (if applicable) | Level N5 | Not yet tracked
4. **Learning trajectory** (Line chart):
   - X-axis: Weeks (past 12 weeks)
   - Y-axis: Cumulative XP + Accuracy %
   - Two lines: XP trend + Accuracy trend
5. **Time commitment analysis** (Stacked bar):
   - Weekly hours (target: 5h) breakdown by skill
6. **Detailed comments section**:
   - Strengths (2-3 bullets)
   - Areas for improvement (2-3 bullets)
   - Recommendations (specific next steps)
7. **Footer**: Generated date | Teacher/admin signature | Confidential notice

**Color Palette**:
- Primary: Navy blue (#1e3a8a)
- Secondary: Slate gray (#64748b)
- Accent: Teal (#0d9488) for "on track," red (#dc2626) for "needs work"
- Background: Clean white with light gray sections
- Text: Navy on white, white on navy headers

**Typography**:
- Serif headers (formal, Garamond or Georgia)
- Sans-serif body (readability, Arial or Segoe UI)
- Monospace for numbers/metrics

**Chart Types**:
- Line chart (12-week trajectory)
- Stacked bar (time by skill)
- Data table with color-coded status
- Gauge/thermometer for progress to target

**PDF Export**: A4/Letter, official-looking with borders, suitable for printing and filing

---

## KEY DIFFERENTIATORS VS EXISTING REPORT

### Existing Shinko Report (Baseline)
Assumption: Dashboard view or basic modal with tabs

### Style 1 (Visual/Infographic) Adds:
- ✓ Animated streak counter (emotional engagement)
- ✓ Achievement badges with icons (gamification)
- ✓ Side-by-side skill comparison (rings/circles)
- ✓ Brighter, playful color scheme
- ✓ Mobile-optimized single-page view
- ✓ Shareable weekly snapshot PDF

### Style 2 (Professional/Academic) Adds:
- ✓ Multi-metric summary table (at-a-glance)
- ✓ Mastery level mapping (N1→N5)
- ✓ 12-week trajectory trend line
- ✓ Formal comments/narrative section
- ✓ Time commitment breakdown (accountability)
- ✓ Official report header + footer
- ✓ Status indicators (on track/behind/needs work)
- ✓ Suitable for parent meetings & school submission

---

## IMPLEMENTATION RECOMMENDATIONS

**For Mobile**: Use Style 1 as primary (infographic)
**For Web**: Offer both; toggle in settings
**For Export**:
- Style 1 → "Share" button → PNG/PDF of 1-page infographic
- Style 2 → "Print/Download" button → Full A4/Letter PDF with all sections

**Data Requirements** (same for both):
- Student profile (name, level, start date)
- Daily XP, lesson completion, skill mastery %
- Weekly/monthly aggregates
- Achievement unlocks
- Time tracking by skill (if available)

**No Breaking Changes**: Both styles pull from same data model; just UI/presentation differ

---

## UNRESOLVED QUESTIONS

1. Does Shinko track "time spent by skill"? (needed for Style 2's time breakdown chart)
2. Should speaking/pronunciation scores be included in both styles?
3. Does app need formal "teacher/admin" sign-off section or just student + parent view?
4. Target audience mix: what % parents vs students vs teachers?
5. Is JLPT level (N1→N5) mapping desired, or keep internal progression scale?
6. Should Vietnamese school system mapping also apply to Vietnamese learners in Shinko?

---

**Report Date**: 2026-03-24
**Research Sources**: 8 major EdTech platforms + 2 cultural education systems analyzed
