# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Eduardo and Mariana, a Spanish-speaking couple who recently moved to Aruba. Adult
beginners in English, using the app on their phones in short sessions. Mariana works as a
reservations agent; Eduardo as a telecommunications technician. Each has their own
progress on the same device (`el` / `ella` in storage).

## Product Purpose

Their own app for learning the English they need at home, in town and at work in Aruba:
phrases with audio by situation, work English for both jobs, practice games with spaced
repetition, a 12-week plan, and Turrón, a tutor that converses and corrects by voice.
Success: they use it daily and can handle real situations (supermarket, doctor, phone,
work calls) in English.

## Positioning

Not a generic language course: content is written for life in Aruba and for these two
jobs, and Turrón, their own pixel beagle, is the companion who guides, corrects and
reflects their progress.

## Operating Context

- Phone first, often on mobile data; also used offline except for the AI tutor.
- Two builds from one source: `index.html` (GitHub Pages, Turrón uses Gemini with a key
  each user pastes) and `dist/claude.html` (artifact inside claude.ai, uses Claude
  capabilities). Both must keep working.
- Browser speech (Chrome or Safari) for listening and microphone.

## Capabilities and Constraints

- Single HTML file built from `src/` by `tools/build.py`; no framework, no npm dependencies, must load fast.
- Interface text in Spanish; practice content in English.
- Saved progress lives in `localStorage` key `aruba-ingles-v1` and must never break.
- Gemini key lives only in the user's browser (`turron-gemini-key`), never in the repo.
- All user/AI text is escaped (`esc()`, `plain()`); a past XSS bug must not return.

## Brand Commitments

- Name: El Tutor Turrón. Turrón is an original pixel beagle (22×22 sprite in
  `src/turron_sprite.json`) and must stay original; "Pokémon-like" refers only to the pixel style.
- Turrón is the brand, the guide and the progress meter, not a decoration.

## Evidence on Hand

- Content: `src/guide_data.json`, `src/content_extra.py` (sections 0–22).
- Sprite with states idle/blink/talk/happy/tail. No other illustrations or photos exist.
- PDF guide in `pdf/` (covers v1 content only).

## Product Principles

1. Warm and easy for adult beginners: never make them feel lost or judged.
2. Turrón is present at every important moment, not only in his tab.
3. Fast and dependable on a phone, online or not.
4. Their data and progress are sacred.

## Accessibility & Inclusion

Touch targets of 44 px or more, named buttons, AA contrast in light and dark, respect
`prefers-reduced-motion` and system theme. Body text must stay highly legible for beginners.
