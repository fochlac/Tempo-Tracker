# Minimal Localization Concept for Tempo-Tracker

## Overview
Create a minimal, non-invasive localization system that leverages existing browser internationalization and only extracts hardcoded UI strings to a translation system.

## Goals
- Extract existing hardcoded strings to translation files
- Use browser's default locale (no additional locale selection UI)
- Minimal code changes
- Build on existing `Intl.DateTimeFormat(undefined, ...)` pattern

## Technical Approach

### Translation Storage
Bundle all translations (start with English only):
```
src/translations/
├── en.json
├── en-us.json  (future)
├── de.json     (future)
```

### Locale Resolution
Two-tiered fallback: 
1. Try full locale (e.g., `en-us`)
2. Try language only (`en`) 
3. Fallback to key

Uses browser locale like existing datetime functions: `new Intl.DateTimeFormat().resolvedOptions().locale`

### Translation Keys
Abstracted keys with namespacing:
```json
{
  "nav.tracker": "Tracker",
  "nav.statistics": "Statistics", 
  "action.save": "Save",
  "action.cancel": "Cancel",
  "status.loading": "Loading...",
  "validation.fillMandatoryOptions": "Please fill all mandatory options."
}
```

### Integration
Simple `t(key)` function, similar to existing datetime utilities.

### Key Conventions (Concise)
- Namespaced: `domain.purpose` (e.g. `view.weeklyHours`, `action.cancel`, `error.jiraConnection`).
- Reuse over invent: prefer adapting existing key if text identical.
- Interpolation: `{{$var}}` placeholders replaced via `t(key, { var: 'X' })`.
- If key not found: fall back to language fallback, then default bundle, then return key.

### Minimal API
```
import { t } from 'src/translations'
t('action.cancel')
t('view.statisticsForYear', { year }) // "Statistics for {{$year}}"
```

### Minimal Pluralization
Keep it trivial: singular key as given, plural key uses "-pl" suffix. The `count` var triggers selection.

Key examples:
```
"value.day": "{{$count}} day",
"value.day-pl": "{{$count}} days"
```
Usage:
```
t('value.day', { count: 1 }) // 1 day
t('value.day', { count: 2 }) // 2 days
```
Resolution rule (with fallback):
```
if vars.count !== undefined && Number(count) !== 1:
  1. Try key + '-pl' in current locale chain
  2. If not found, fallback to singular key in locale chain
  3. Final fallback to key itself
else:
  Try singular key in locale chain, fallback to key
```
No additional language rules (English only); future languages can override by defining their own singular/plural pair.

### Deferred (Add Later if Needed)
- Plural rules beyond simple `{count}` injection
- Runtime language switch UI

### Testing Strategy (Lean)
- One unit test: verifies fallback path (full-locale miss -> language hit -> default hit -> key)
- String replacement is tested via cypress E2E tests

### Performance & Footprint
- All translations bundled statically; expected < 2 KB for initial English set.
- Single object lookup + regex replace for interpolation; negligible overhead.

## File Changes Required
- **New**: 2 files (translations + utility function)
- **Modified**: ~5-8 components (replace hardcoded strings)
- **Unchanged**: Build system, types, existing datetime i18n
