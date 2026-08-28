# Exploring Mechanics

An interactive, mathematics-first repository for learning classical mechanics
through derivations, diagrams, simulations, and counterintuitive puzzles.

See [guide.md](guide.md) for the full project guide, topic roadmap, and page
template.

## Structure

- [`docs/`](docs/index.html) — one page per section (toolkit, kinematics,
  Newton's laws, energy, momentum, simple machines, circular motion, rotation,
  oscillations, unintuitive problems, capstones). Each section page is tabbed
  across its subtopics (e.g. constant-velocity, constant-acceleration,
  free-fall, projectile-motion, relative-motion under kinematics), sharing one
  wide-layout template (`docs/assets/`) instead of a narrow single column.
  Content outline for every subtopic lives in `docs/assets/js/section-data.js`.
- [`simulations/`](simulations/) — interactive simulations backing the docs
- [`notebooks/`](notebooks/) — derivations, numerical methods, and data analysis
- [`experiments/`](experiments/) — at-home, classroom, and video-based experiments
- [`assets/`](assets/) — diagrams, images, videos, animations, and data
- [`references/`](references/) — bibliography and attributions

## Running it locally

Static site, no build step. Either open `docs/index.html` directly, or:

```bash
python -m http.server 8000     # then visit http://localhost:8000/docs/
```

## Status

Scaffolding in progress — each subtopic tab lists its concepts, applications,
and suggested experiments/simulations. The full per-topic content (question,
prediction, derivation, worked example, interactive simulation) follows the
[standard template in guide.md](guide.md#how-every-topic-page-should-work)
and is being filled in incrementally.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

See [LICENSE](LICENSE).
