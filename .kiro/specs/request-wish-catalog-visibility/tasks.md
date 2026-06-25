# Implementation Plan

## Overview

This task list implements the bugfix for the silent `maxPrice` filter in `RequestedCatalogPage.jsx`. The workflow follows the exploratory bugfix methodology: write the bug condition exploration test first (to confirm the bug), then write preservation tests, then apply the minimal one-line fix, then verify both test suites pass.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3.1"] },
    { "wave": 4, "tasks": ["3.2", "3.3"] },
    { "wave": 5, "tasks": ["4"] }
  ]
}
```

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - High-Budget Wish Excluded on Initial Load
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate wishes with `budget > 1000` are silently excluded
  - **Scoped PBT Approach**: Scope the property to concrete failing cases — any wish where `wish.budget > 1000` and `wish.status === "ACTIVE"` should appear in the rendered catalog on initial mount without any user filter interaction
  - **Setup**: Install a test framework if not present (Vitest + React Testing Library is the standard choice for Vite+React projects). Add `vitest`, `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`, and `fast-check` as dev dependencies. Configure `vitest` in `vite.config.js` with `jsdom` environment.
  - **Test file**: `frontend/src/pages/__tests__/RequestedCatalogPage.bug.test.jsx`
  - Mock `../api` so `API.get("/wishes")` resolves with a wish list containing at least one wish where `budget > 1000` (e.g., `{ _id: "w1", title: "Professional Camera", budget: 2500, status: "ACTIVE", category: "Electronics" }`). Also mock `API.get("/auth/me")` and `localStorage`.
  - Render `<RequestedCatalogPage />` inside a `MemoryRouter`. After the async fetch resolves, query the rendered output for the high-budget wish card.
  - Assert the wish with `budget: 2500` IS visible in the rendered catalog (i.e., its title appears in the DOM).
  - Also assert the wish with `budget: 1001` IS visible (edge case — excluded by one rupee on unfixed code).
  - Run test on UNFIXED code (`useState(1000)`).
  - **EXPECTED OUTCOME**: Test FAILS — confirms wishes with `budget > 1000` are excluded by the hardcoded filter
  - Document the counterexample: `"Wish { _id: 'w1', budget: 2500 } missing from catalog on initial render"`
  - Mark task complete when test is written, run, and the failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Filter Behavior Unchanged for Non-Buggy Inputs
  - **IMPORTANT**: Follow observation-first methodology — observe actual behavior on UNFIXED code for inputs where `NOT isBugCondition(wish)` (i.e., `wish.budget <= 1000`), then write tests that capture those observed behaviors
  - **Test file**: `frontend/src/pages/__tests__/RequestedCatalogPage.preservation.test.jsx`
  - **Observe on UNFIXED code** (these cases work correctly before the fix):
    - `calculateVisibility({ budget: 500 })` → wish IS visible (500 ≤ 1000)
    - `calculateVisibility({ budget: 1000 })` → wish IS visible (1000 ≤ 1000, boundary)
    - Search filter: wishes not matching `search` term are excluded regardless of budget
    - Category filter: wishes not matching `selectedCategory` are excluded regardless of budget
  - **Write property-based tests using `fast-check`** (stronger guarantees via automatic case generation):
    - **PBT 2a** — For all wishes with `budget` in `[0, 1000]`, the wish IS visible in the catalog on initial render (no user filter applied). Use `fc.integer({ min: 0, max: 1000 })` to generate budgets.
    - **PBT 2b** — For all `(wish, searchTerm)` pairs where `wish.title` does NOT include `searchTerm` (and `searchTerm` is non-empty), the wish is NOT in filtered results when that search term is active.
    - **PBT 2c** — For all `(wish, category)` pairs where `wish.category !== category` and `category !== "All"`, the wish is NOT in filtered results when that category is selected.
  - Verify all preservation tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS — confirms baseline behavior to preserve
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 3. Fix for hardcoded maxPrice initial value excluding high-budget wishes

  - [x] 3.1 Implement the fix
    - Open `frontend/src/pages/RequestedCatalogPage.jsx`
    - On the line containing `const [maxPrice, setMaxPrice] = useState(1000);` (currently line 148), change `1000` to `Infinity`
    - Final result: `const [maxPrice, setMaxPrice] = useState(Infinity);`
    - Do NOT modify the `filteredRequests` filter logic — `p.budget <= Infinity` evaluates to `true` for all finite budgets, which is the correct behavior
    - Do NOT modify `WishCard`, `syncWishes`, `handleCreateWish`, `handlePitchQuote`, `handleAcceptOffer`, `handleDeleteWish`, any API routes, or any backend code
    - _Bug_Condition: isBugCondition(wish) → wish.budget > 1000 AND wish.status === "ACTIVE"_
    - _Expected_Behavior: All active wishes (including those with budget > 1000) SHALL appear in filteredRequests on initial render, before any user filter interaction_
    - _Preservation: All existing filter behaviors (search by title, category selection, user-adjusted maxPrice) remain functionally identical; only the initial value of maxPrice changes_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.5, 3.6_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - High-Budget Wish Visible on Initial Load
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 asserts that wishes with `budget > 1000` appear in the catalog on initial render
    - With `maxPrice` initialized to `Infinity`, `p.budget <= Infinity` is `true` for all finite budgets — the wish will no longer be filtered out
    - Run `frontend/src/pages/__tests__/RequestedCatalogPage.bug.test.jsx`
    - **EXPECTED OUTCOME**: Test PASSES — confirms the bug is fixed
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - No Regressions in Existing Filter Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run `frontend/src/pages/__tests__/RequestedCatalogPage.preservation.test.jsx`
    - **EXPECTED OUTCOME**: All preservation tests PASS — confirms no regressions
    - Confirm that low-budget wishes (budget ≤ 1000) remain visible, search and category filters still work, and the boundary case (budget = 1000) is still correctly included

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite: `npx vitest --run` from the `frontend/` directory
  - Verify that both `RequestedCatalogPage.bug.test.jsx` and `RequestedCatalogPage.preservation.test.jsx` report all tests passing
  - Verify no other existing tests have been broken by the change
  - Ensure all tests pass; ask the user if any questions or unexpected failures arise

## Notes

- The fix is a single-character change: `useState(1000)` → `useState(Infinity)` on line 148 of `RequestedCatalogPage.jsx`.
- No test framework is currently installed in the frontend. Tasks 1 and 2 include setup instructions for Vitest + React Testing Library + fast-check.
- Do NOT modify `WishCard`, fetch logic, API routes, or any backend code.
- Property 1 (bug condition test) is expected to FAIL on unfixed code — this is correct behavior that confirms the bug exists.
- Property 2 (preservation tests) are expected to PASS on both unfixed and fixed code.
