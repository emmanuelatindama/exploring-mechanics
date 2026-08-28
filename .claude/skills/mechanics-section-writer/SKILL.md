---
name: mechanics-section-writer
description: >
  Write or flesh out a docs/<NN-section>/index.html page for the
  exploring-mechanics repository (e.g. "write section 1", "build out
  kinematics", "flesh out the Newton's laws page", "let's do the energy
  section next"). Use this whenever the user asks to write, build, draft,
  flesh out, or fill in content for any numbered section under docs/ in this
  repo -- 00-toolkit through 10-capstones -- so every section ends up built
  to the same standard: heavily visual, maximally interactive, math kept
  visible throughout with "for math enthusiasts" dropdowns at each detailed
  step, and every variable explained where it first appears. Do not use this
  for edits to guide.md, README.md, the playground/_projects pages in the
  portfolio repo, or unrelated JS/CSS bugfixes that don't involve writing new
  section content.
---

# Writing an exploring-mechanics section page

This repo teaches classical mechanics through interactive pages, not static
prose. `docs/00-toolkit/index.html` is the reference implementation — five
draggable/animated SVG widgets, live readouts, and math woven through the
explanatory text rather than dumped at the end. Every later section
(01-kinematics through 10-capstones) should read like it was built by the
same person on the same day. Before writing, skim `docs/00-toolkit/index.html`
and `docs/assets/js/toolkit.js` once to refresh what "done" looks like here.

## The standard, in priority order

1. **Interactive beats animated beats static.** For every concept, first ask
   "can the reader drag/slide/toggle something and see the physics respond?"
   Only fall back to a moving visual (CSS/SVG animation, or a GIF if the
   motion is too complex to build cheaply) when true interactivity isn't
   feasible in the time available. Only fall back to a static diagram if
   neither is practical — and treat that as a gap worth flagging, not a
   default.
2. **Math stays visible, not archived.** Show the key equation inline in the
   normal flow of the page (like the toolkit's `v = rω`, `F = ma` callouts) —
   a reader skimming without opening any dropdown should still see the
   governing relationship. Then, at *every* point in that subtopic where a
   derivation, a proof step, or a longer calculation would otherwise clutter
   the page, wrap just that detailed part in:
   ```html
   <details class="math-details">
     <summary>For math enthusiasts</summary>
     <!-- the derivation, in the normal prose+equation flow -->
   </details>
   ```
   A single subtopic tab can and often should have several of these,
   dropped in right next to the idea they expand on — one after the core
   equation is introduced, another inside the worked example, another next
   to the simulation if there's a derivation behind what it's plotting. Do
   not batch them all into one dropdown at the end of the page; that defeats
   the point of being able to expand *just* the step you're stuck on.
3. **Every variable gets named.** The first time a symbol appears (in prose,
   an equation, or a readout label), it needs a short definition next to it —
   inline (`where *v* is speed, *r* is the radius, and *ω* is angular
   velocity`) or as a small list. Don't assume `θ`, `ω`, `μ`, etc. are
   self-explanatory; a reader who hasn't seen the symbol yet should never
   have to guess.
4. **Reuse the toolkit's plumbing.** Don't reinvent drag handling or
   coordinate math per section — pull from `docs/assets/js/toolkit.js`:
   - `svgEl(tag, attrs)` — create SVG elements without inline markup soup.
   - `clientToSvg(svg, evt)` — convert a pointer event to SVG user-space
     coordinates (accounts for viewBox scaling, so it works at any CSS size).
   - `makeDraggable(handle, svg, onMove)` — wires pointerdown/move/up with
     pointer capture; you supply `onMove(pointInSvgSpace)`.
   - `toScreen(x, y)` / `toWorld(sx, sy)` (and the `SCALE`/`ORIGIN` constants
     next to them) — the world↔screen mapping used by the vector and
     coordinate widgets. Reuse this convention (y-up world, origin at
     viewBox center) so widgets across sections feel the same to drag.
   - `buildCartesianGrid` / `buildPolarGrid` / `arcPath` — grid and angle-arc
     drawing helpers.
   If a section's widget needs something these don't cover (e.g. the
   free-body force-sum pattern, or the reference-frame animation loop with
   `requestAnimationFrame` + pattern-scrolling), it's fine to write new
   section-specific logic in that section's own JS file — just keep sharing
   the primitives above rather than duplicating them.
5. **Keep the same visual language.** Reuse the widget CSS classes from
   `docs/assets/css/toolkit.css` (`.widget`, `.widget-visual`,
   `.widget-side`, `.controls`, `.controls .row`, `.readout`, `.explainer`,
   checkbox/slider styling) instead of inventing new layout patterns, and
   reuse the color palette already established: blue `#2a78d6` (primary /
   first vector or force), orange `#eb6834` (secondary), green `#1baf7a`
   (resultant / normal-force-style "balancing" quantities), red `#e34948`
   (friction / opposing quantities / warnings), dark/`var(--text-primary)`
   dashed (net or summary vectors). If `toolkit.css` doesn't have a layout
   primitive a new widget needs, add it there (or to a small per-section
   stylesheet) rather than hand-rolling one-off inline styles.
6. **No new dependencies.** Everything here is vanilla SVG + JS, same as the
   rest of the site (see `exploring-probability`'s own no-build-step, mostly
   dependency-free approach). Don't reach for a charting/animation library
   for something a `<svg>` + a few event listeners can do.

## Page structure to produce

Each section is one `docs/<NN-section>/index.html`:

- `<link>` to `../assets/css/site.css` and a per-section stylesheet (either
  reuse `../assets/css/toolkit.css` if the widgets are similar in kind, or
  add `../assets/css/<section-slug>.css` for anything section-specific).
- `<body data-section="<NN-section>">`, wrapped in `<div class="wrap">`.
- A `header.top` with breadcrumb (`<a href="../index.html">Exploring
  Mechanics</a> / N. Section Name`), `<h1>`, and a one-paragraph `.sub`
  framing what this section is about.
- `<nav class="tabbar" id="tabbar">` with one `<button data-target="...">`
  per subtopic — pull the exact subtopic list and titles for this section
  from `docs/assets/js/section-data.js` (the `SECTIONS["<NN-section>"]`
  entry) so tabs match what section 1-10's outline already promised.
- `<div class="panels" id="panels">` containing one `<div class="panel"
  id="panel-<subtopic-id>">` per subtopic (first one gets class
  `panel active`), each with:
  - `<h2>` subtopic title.
  - A short motivating question or "what do you predict happens" framing —
    this repo's whole design principle (see `guide.md`) is prediction before
    explanation.
  - The core equation/relationship shown inline (not hidden in a dropdown).
  - The interactive widget (or animated/static fallback per priority #1
    above) with `.controls` + `.readout` next to it, following the
    `.widget` / `.widget-visual` / `.widget-side` layout.
  - `<details class="math-details">` dropdowns at each detailed-math point,
    per priority #2.
  - Variable definitions inline per priority #3.
  - Where relevant: real-world limitations, a short "why this matters" or
    common-misconception callout (`.callout` class), same as the guide's
    page template and section 0's friction/misconception notes.
- A `<script>` tag for the section's JS file
  (`../assets/js/<section-slug>.js`), written the way `toolkit.js` is: one
  `init<Subtopic>()` function per widget, plus a small tab-switching block
  at the bottom, all called from a single `DOMContentLoaded` listener.

If a section is large (6+ subtopics, several needing custom widgets), it's
fine for the JS file to be long — that's what `toolkit.js` already is.
Prefer one file per section over splintering into many small files; it
keeps the "one script tag per page" pattern intact.

## Before calling a section done

1. Read back the finished HTML/JS for the section and check every item in
   "The standard, in priority order" above against it, subtopic by
   subtopic — it's easy to nail the first tab and get lazier by the fourth.
2. Start the preview server (`.claude/launch.json` already has an
   `exploring-mechanics` config in the portfolio repo, or add one) and
   actually exercise each widget: drag handles, move sliders, toggle
   checkboxes, and confirm the readout numbers are mathematically correct
   (do the arithmetic by hand for at least one case per widget, the way
   section 0's FBD net-force numbers were hand-checked). A widget that
   renders but doesn't respond correctly to input is worse than no widget —
   it teaches the wrong thing.
3. Check the browser console for errors after switching through every tab.
4. If an animation loop is involved (anything using
   `requestAnimationFrame`), confirm it actually advances over time, not
   just that it doesn't throw — screenshots taken back-to-back with a short
   delay between them are enough to see movement.
