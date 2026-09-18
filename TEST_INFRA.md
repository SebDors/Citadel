# E2E Test Infra: Citadel Swiss Minimal Redesign

## Test Philosophy
- Opaque-box, requirement-driven verification of all Swiss Minimal redesign mandates.
- Rigorous checks: Zero TypeScript compile errors (`tsc --noEmit`), Expo SDK 54 compatibility check, Git commit history structure, Swiss design token schema, Zero-Card architectural compliance, and Business Logic preservation (AsyncStorage keys, volume calculations, export service).

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Postmortem & Guidelines | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ |
| 2 | Swiss Design Tokens | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 3 | Top Typographic Index Nav | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 4 | Editorial Monograph Home | ORIGINAL_REQUEST § R4 | 5 | 5 | ✓ |
| 5 | Horizontal Stage Viewport | ORIGINAL_REQUEST § R5 | 5 | 5 | ✓ |
| 6 | Chronological Journal Ribbon | ORIGINAL_REQUEST § R6 | 5 | 5 | ✓ |
| 7 | Strict Types & Expo 54 QA | ORIGINAL_REQUEST § R7 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Automated Node.js verification script (`scripts/verify_swiss_qa.js`) executing TypeScript validation, token schema checks, AST/structural assertions for zero-card layouts, and Git commit log sequence.
- Command: `node scripts/verify_swiss_qa.js` and `node node_modules/typescript/bin/tsc --noEmit`
- Pass/fail semantics: Exit code 0 on all checks passing.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Launch free workout from monograph home, record 3 sets in Stage Viewport, rest timer fires, complete workout | F2, F4, F5 | High |
| 2 | Navigate using top index (01 SESSION -> 02 JOURNAL), view chronological ledger with weekly/monthly volume | F2, F3, F6 | Medium |
| 3 | Export data to JSON and clipboard from Journal screen | F6 | Medium |
| 4 | Switch between dark and light Swiss themes with high-contrast monochrome & Swiss Crimson | F2, F3, F4, F5, F6 | High |
| 5 | Inspect Git history: 7 exact conventional commits on `design/revamp-v3-swiss-minimal` and tag `Citadel-SwissMinimal` | F1, F7 | Medium |

## Coverage Thresholds
- Tier 1: Feature Coverage (≥5 checks per feature)
- Tier 2: Boundary & Corner Cases (zero cards, empty history, null reps, extreme volume, dark/light contrast)
- Tier 3: Cross-Feature interaction tests
- Tier 4: Real-world workflow simulation
