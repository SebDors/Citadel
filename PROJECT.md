# Project: Citadel Swiss Minimal Redesign

## Architecture
- **Framework**: Expo SDK 54 (`~54.0.0`), React Native 0.81.5, React 19.1.0, TypeScript 5.3.3.
- **Routing**: `expo-router` with root stack in `app/_layout.tsx`, tabs navigation in `app/(tabs)/_layout.tsx`, and modal routes (`app/live-workout.tsx`, `app/template-editor.tsx`, `app/workout-analytics.tsx`).
- **Data Flow & State**:
  - `WorkoutContext.tsx`: Manages active workouts, routine templates, historical records, and volume calculation.
  - `StorageService` (`src/services/storage.ts`): AsyncStorage persistence with `@citadel_app_data_v1` and high-performance debounced `@citadel_current_workout_v1`.
  - `ExportService` (`src/services/exportService.ts`): JSON and CSV export/import, clipboard copy.
- **Theme & Design Tokens**:
  - `src/constants/swissTheme.ts`: International Typographic Style design system.
  - Charcoal substrate `#0A0A0A`, paper white `#F6F6F4`, pure text `#FFFFFF` / `#0F0F0F`, hairlines `0.5px`/`1px` `#262626` / `#E5E5E5`, metadata `#737373`.
  - Single focal accent: Swiss Crimson `#E63946` / `#FF2A2A`.
  - Monumental typography: 44px-64px titles, micro-labels 10-11px with letterSpacing 1.5px. Zero heavy card borders or elevation shadows.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Spatial Post-Mortem & Guidelines | Write `POSTMORTEM_ET_NOUVELLE_ARCHITECTURE_SUISSE.md` critiquing previous card stacking and codifying Swiss layout rules | M1: docs(critique) | R1 |
| 2 | Swiss Design Tokens & Scale | Create `src/constants/swissTheme.ts`, integrate in `theme.ts` & `colors.ts`, high-contrast monochrome & Swiss Crimson `#E63946` | M2: feat(tokens) | R2 |
| 3 | Typographic Top Index Navigation | Eliminate 3-tab bottom bar (`IndustrialSegmentedSteelBar`); implement top index header `01 SESSION \| 02 JOURNAL \| 03 ARCHIVE & DATA` | M3: refactor(nav) | R3 |
| 4 | Editorial Monograph Home Screen | Eliminate top button rows & cards; monumental status/volume header (56px), prominent free workout zone, book-index protocol ledger with red indices | M4: feat(dashboard) | R4 |
| 5 | Horizontal Stage Viewport | Eliminate vertical exercise scroll; single active exercise viewport (`STAGE 01 OF X`), giant telemetry header, 1px underlined set matrix, strike-through completion, rest timer overlay | M5: feat(workout) | R5 |
| 6 | Chronological Journal Ledger | Eliminate 31-day month calendar grid; asymmetric Journal Ribbon with monumental dates (`14 SEP`), telemetry banner `WEEK: XX KG \| MONTH: XX KG`, direct export links | M6: feat(history) | R6 |
| 7 | Strict Types & Expo 54 QA | Zero TypeScript errors (`tsc --noEmit`), verify Expo SDK 54 bundle integrity & business logic, tag `Citadel-SwissMinimal` | M7: test(qa) | R7 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | docs(critique) | Branch `design/revamp-v3-swiss-minimal` checkout; author `POSTMORTEM_ET_NOUVELLE_ARCHITECTURE_SUISSE.md`; commit 1 | None | DONE |
| 2 | feat(tokens) | Create `src/constants/swissTheme.ts`, wire into `theme.ts` and `colors.ts`; commit 2 | M1 | IN_PROGRESS |
| 3 | refactor(nav) | Rebuild `app/(tabs)/_layout.tsx` with top typographic index header, remove bottom tabs; commit 3 | M2 | PLANNED |
| 4 | feat(dashboard) | Rebuild `app/(tabs)/index.tsx` as editorial monograph without cards or top button rows; commit 4 | M2, M3 | PLANNED |
| 5 | feat(workout) | Rebuild `app/live-workout.tsx` and `SetTableRow.tsx` into horizontal Stage Viewport; commit 5 | M2 | PLANNED |
| 6 | feat(history) | Rebuild `app/(tabs)/history.tsx` and data export links, remove `CalendarView.tsx`; commit 6 | M2, M3 | PLANNED |
| 7 | test(qa) | Verify `tsc --noEmit` code 0, Expo 54 bundle integrity, commit 7 and tag `Citadel-SwissMinimal` | M1..M6 | PLANNED |

## Interface Contracts
### `src/constants/swissTheme.ts` ↔ Screens & Components
- Export `SWISS_COLORS`: `{ background: '#0A0A0A', surface: '#121212', border: '#262626', text: '#FFFFFF', textMuted: '#737373', accent: '#E63946', light: {...} }`
- Export `SWISS_TYPOGRAPHY`: `{ display: 56, h1: 44, h2: 32, body: 16, label: 11, letterSpacingLabel: 1.5, letterSpacingDisplay: -1 }`
- Export `SWISS_GRID`: `{ hairline: 0.5, borderFine: 1, margin: 24, gap: 16 }`

### `WorkoutContext` ↔ UI Components
- `activeSession`: `WorkoutSession` (preserved exactly)
- `calculateVolumeAndCompletedCount`: preserves `weightKg * reps` sum for completed non-warmup sets
- `startWorkout`, `finishWorkout`, `cancelWorkout`, `toggleSetComplete`, `updateSet`: identical signatures and event dispatching

### Navigation ↔ Tabs
- Active tab index maps to:
  - `01 SESSION` -> `/` (`app/(tabs)/index.tsx`)
  - `02 JOURNAL` -> `/history` (`app/(tabs)/history.tsx`)
  - `03 ARCHIVE & DATA` -> `/profile` (`app/(tabs)/profile.tsx`)

## Code Layout
- Documentation: `c:\Users\AY030031\Documents\Citadel\POSTMORTEM_ET_NOUVELLE_ARCHITECTURE_SUISSE.md`
- Theme Tokens: `c:\Users\AY030031\Documents\Citadel\src\constants\swissTheme.ts`
- Theme Integration: `c:\Users\AY030031\Documents\Citadel\src\constants\theme.ts`, `colors.ts`
- Navigation Layout: `c:\Users\AY030031\Documents\Citadel\app\(tabs)\_layout.tsx`
- Dashboard Screen: `c:\Users\AY030031\Documents\Citadel\app\(tabs)\index.tsx`
- Workout Screen: `c:\Users\AY030031\Documents\Citadel\app\live-workout.tsx`, `src\components\Workout\SetTableRow.tsx`
- History Screen: `c:\Users\AY030031\Documents\Citadel\app\(tabs)\history.tsx`, `src\services\exportService.ts`
- QA & Verification: `c:\Users\AY030031\Documents\Citadel\scripts\verify_swiss_qa.js`
