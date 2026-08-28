# Contributing

Thanks for contributing to Exploring Mechanics.

## Adding or editing a topic page

Every page under `docs/` should follow the template in
[guide.md](guide.md#how-every-topic-page-should-work):

1. The question
2. Make a prediction
3. Assumptions
4. Diagram
5. Variables
6. Mathematical model
7. Derivation
8. Worked example
9. Interactive simulation
10. Result
11. Why this is unintuitive
12. Real-world limitations
13. Extensions
14. Challenge questions
15. References

## Adding a simulation

Place new simulations under `simulations/<name>/` with their own `README.md`
describing what it teaches, how to run it, and its dependencies. Link to it
from the corresponding page under `docs/`.

## Style

- Prefer SI units and define all variables before using them.
- State idealizations and assumptions explicitly.
- Keep derivations step-by-step rather than skipping algebra.

## Pull requests

- Keep PRs scoped to one topic or simulation where possible.
- Update the relevant `index.md` when adding a new page.
