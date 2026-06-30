# Implementation Plan

## Overview

Implement the rent negotiation flow unification bugfix using the exploratory methodology: write exploration tests first (expected to fail), then preservation tests (expected to pass), then apply the 8-change fix across 2 files, and finally verify both test suites pass with no regressions.

## Tasks

- [x] 1. Write bug condition exploration tests (BEFORE implementing fix)
  - **Property 1: Bug Condition** - Rent Catalog Card Dead Button & Missing Negotiate Button / Detail Page No Prompt
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected (correct) behavior; they will pass once the fix is applied
  - **GOAL**: Surface counterexamples that demonstrate both bugs on unfixed code
  - **Scoped PBT Approach**: For the catalog card, scope property to a non-owner, non-locked RENT product (any rentalPrice > 0). For the detail page, scope to a RENT product click with a mocked window.prompt.
  - Create `frontend/src/pages/__tests__/RentNegotiationFlow.bug.test.jsx`
  - **Test 1a — Dead Rent button**: Render `ProductCard` (from `RentCatalogPage`) for a non-owner, non-locked product without passing `handleRentClick`/`handleNegotiationClick`/`userNegotiations` props (current state). Assert that a "Rent" button exists. Assert it has **no** `onClick` handler. Assert **no** "Negotiate" button is present. Run on unfixed code — test FAILS confirming bug 1.1 / 1.2.
  - **Test 1b — PBT: No onClick and no Negotiate for any valid RENT product**: Using `fast-check`, generate random `{ rentalPrice, securityDeposit, title }` objects. For each, render `ProductCard` without action props. Assert two buttons with wired handlers are present — this FAILS on unfixed code (only one dead button). Counterexample: `{ rentalPrice: 500, securityDeposit: 200, title: "Camera" }` renders 1 button, 0 onClick handlers.
  - **Test 1c — No userNegotiations state**: Render `RentCatalogPage` (mocking API). Assert that the `Negotiate` button (or a disabled "✓ Negotiation Sent" state) is not rendered anywhere, confirming the state does not exist in unfixed code. Run on unfixed code — test FAILS confirming bug 1.3.
  - **Test 1d — Detail page: window.prompt NOT called on negotiate click**: Render `ProductDetailPage` for a RENT product. Spy on `window.prompt`. Simulate a click on "💬 Propose Custom Price Negotiation". Assert `window.prompt` was **not** called. Run on unfixed code — test FAILS (prompt is indeed absent, confirming bug 1.4). Document counterexample: "window.prompt not invoked; POST fired immediately with listed rentalPrice".
  - Run all tests on UNFIXED code
  - **EXPECTED OUTCOME**: All tests in this file FAIL (this is correct — it proves the bugs exist)
  - Document all counterexamples found to understand root cause
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Bug-Condition Inputs Produce Unchanged Behavior
  - **IMPORTANT**: Follow observation-first methodology — observe UNFIXED code output first, then codify
  - Create `frontend/src/pages/__tests__/RentNegotiationFlow.preservation.test.jsx`
  - **Observe on UNFIXED code before writing assertions:**
    - Observe: `ProductCard` with `isVisuallyLocked=true` renders "Temporarily Unavailable" button (no Rent/Negotiate)
    - Observe: `ProductCard` with `isOwner=true` renders "Your Listing" span (no action buttons)
    - Observe: Clicking card body (not a button) navigates to `/product/:id`
    - Observe: `SecondHandCatalogPage` renders Buy + Negotiate two-button layout for non-owner, non-locked products
    - Observe: `ProductDetailPage` SECOND_HAND path — `handleSecondHandNegotiateClick` calls `window.prompt` (not the RENT path)
    - Observe: `ProductDetailPage` RENT "Rent Now" (`handleAction`) POSTs at listed price with duration and navigates to checkout
  - **PBT 2a — Locked card always shows "Temporarily Unavailable"**: Using `fast-check`, generate random product objects with `isRentedOrReserved=true`, `isOwner=false`. For each, render `ProductCard` and assert "Temporarily Unavailable" button is present and no Rent/Negotiate buttons appear. Verify passes on UNFIXED code.
  - **PBT 2b — Owner card always shows "Your Listing"**: Using `fast-check`, generate random product objects. For each, render `ProductCard` with `currentUser` matching `p.owner`. Assert "Your Listing" text is shown and no Rent/Negotiate buttons are rendered. Verify passes on UNFIXED code.
  - **Test 2c — Card body navigation preserved**: Render `ProductCard` for a non-locked product. Click the card body (not any button). Assert `navigate` was called with `/product/${p._id}`. Verify passes on UNFIXED code.
  - **Test 2d — SecondHandCatalogPage untouched**: Render `SecondHandCatalogPage` (mock API). Assert Buy and Negotiate buttons are present for a non-owner, non-locked product. Verify passes on UNFIXED code and must continue passing after fix.
  - **Test 2e — SECOND_HAND detail page negotiate uses window.prompt**: On `ProductDetailPage` for a SECOND_HAND product, spy on `window.prompt`. Click "💬 Propose Buyout Offer Price". Assert `window.prompt` IS called (SECOND_HAND path already correct). Verify passes on UNFIXED code.
  - **Test 2f — RENT handleAction (Rent Now) POSTs at listed price**: On `ProductDetailPage` for a RENT product, click "Rent Now". Assert `API.post` was called with `dailyRate: product.rentalPrice` (not a prompted value). Verify passes on UNFIXED code.
  - Run all tests on UNFIXED code
  - **EXPECTED OUTCOME**: All tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and all pass on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Implement the fix across 2 files (8 changes total)

  - [x] 3.1 RentCatalogPage — Change 1: Extend ProductCard component signature
    - Add `userNegotiations`, `handleRentClick`, and `handleNegotiationClick` to the destructured props of the `ProductCard = React.memo(...)` component (line ~16)
    - New signature: `{ p, isNight, bookmarkedIds, handleBookmarkToggle, navigate, coordsLoading, coordsError, calculateDistance, userCoords, currentUser, userNegotiations, handleRentClick, handleNegotiationClick }`
    - _Bug_Condition: isBugCondition_CatalogCard(X) — X.page = "RentCatalogPage" AND NOT X.isVisuallyLocked AND NOT X.isOwner_
    - _Requirements: 2.1_

  - [x] 3.2 RentCatalogPage — Change 2: Replace dead single Rent button with two-button layout
    - In `ProductCard`, locate the bottom-right action section (the `isVisuallyLocked` ternary that renders "Temporarily Unavailable")
    - Replace the dead `<button className="...">Rent</button>` branch with the full three-way layout mirroring `SecondHandCatalogPage.ProductCard`:
      - `isVisuallyLocked` → "Temporarily Unavailable" (unchanged)
      - `isOwner` → `<span>Your Listing</span>` (unchanged)
      - else → `<div className="flex flex-col gap-1 w-20">` containing a "Rent" button wired to `(e) => { e.stopPropagation(); handleRentClick(p._id, p.rentalPrice, p.securityDeposit); }` and either a disabled "✓ Negotiation Sent" button (when `userNegotiations[p._id]` is truthy) or a "Negotiate" button wired to `(e) => { e.stopPropagation(); handleNegotiationClick(p._id, p.rentalPrice, p.title); }`
    - _Bug_Condition: isBugCondition_CatalogCard — renders dead single button_
    - _Expected_Behavior: rendered.hasRentButton = true AND rendered.rentButton.hasOnClickHandler = true AND rendered.hasNegotiateButton = true_
    - _Preservation: isVisuallyLocked → "Temporarily Unavailable" branch must be kept intact; card body onClick navigation must not be affected_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.3, 3.4, 3.5_

  - [x] 3.3 RentCatalogPage — Change 3: Add userNegotiations state declaration
    - In the `RentCatalogPage` function component, add alongside existing `useState` declarations:
      ```js
      const [userNegotiations, setUserNegotiations] = useState({});
      ```
    - _Bug_Condition: isBugCondition_CatalogCard — parent has no userNegotiations state_
    - _Requirements: 2.4_

  - [x] 3.4 RentCatalogPage — Change 4: Populate userNegotiations in session-loading useEffect
    - Inside the `activeToken` branch of the geolocation/session `useEffect`, replace the current `API.get("/auth/me").then(...)` block with the chained pattern from `SecondHandCatalogPage` that also calls `API.get("/rent/transactions")`, maps active transactions into a `negotiationsMap`, and calls `setUserNegotiations(negotiationsMap)`
    - Active states to include: `["PENDING_NEGOTIATION", "NEGOTIATING", "ACCEPTED", "AWAITING_PAYMENT", "RESERVED"]`
    - Only include transactions where `String(borrower._id) === String(user._id)`
    - _Requirements: 2.4_

  - [x] 3.5 RentCatalogPage — Change 5: Add handleRentClick handler
    - Define `handleRentClick` as an async function in the `RentCatalogPage` component body (after state declarations, before return):
      ```js
      const handleRentClick = async (productId, price, securityDeposit) => { ... }
      ```
    - POST to `/rent/negotiate` with `{ productId, startDate: new Date(), endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), dailyRate: price, securityDeposit: securityDeposit || 0 }`
    - On success: call `triggerToast("Rental request submitted!")` then `setTimeout(() => navigate(\`/rent/checkout/\${productId}\`), 1500)`
    - On error: call `triggerToast(err.response?.data?.msg || "Rental request failed")`
    - _Expected_Behavior: POST /rent/negotiate at listed price with 3-day duration and securityDeposit, then navigate to checkout_
    - _Requirements: 2.2_

  - [x] 3.6 RentCatalogPage — Change 6: Add handleNegotiationClick handler
    - Define `handleNegotiationClick` as an async function in the `RentCatalogPage` component body:
      ```js
      const handleNegotiationClick = async (productId, currentPrice, title) => { ... }
      ```
    - Guard: if `userNegotiations[productId]` is truthy, call `triggerToast("You already have an active negotiation for this product.")` and return
    - Call `window.prompt(\`Enter your custom daily rate for "\${title}" (Current: ₹\${currentPrice}/day):\`)`
    - If prompt returns falsy, return (user cancelled)
    - Parse with `parseFloat`; if `isNaN` or `<= 0`, call `triggerToast("Please enter a valid price.")` and return
    - POST to `/rent/negotiate` with `{ productId, startDate: new Date(), endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), dailyRate: numericOffer, securityDeposit: 0 }`
    - On success: call `triggerToast(\`Negotiation request of ₹\${numericOffer}/day sent!\`)` and `setUserNegotiations(prev => ({ ...prev, [productId]: "PENDING_NEGOTIATION" }))`
    - On 409: call `alert(...)` and `setUserNegotiations(prev => ({ ...prev, [productId]: "PENDING_NEGOTIATION" }))`, return
    - On other errors: call `triggerToast(err.response?.data?.msg || "Negotiation request failed")`
    - _Expected_Behavior: window.prompt shown, postedDailyRate = user_entered_value, button transitions to disabled "✓ Negotiation Sent"_
    - _Requirements: 2.3, 2.4_

  - [x] 3.7 RentCatalogPage — Change 7: Pass new props to <ProductCard> in the render map
    - Find the `products.map(...)` render section in `RentCatalogPage` JSX where `<ProductCard>` is instantiated
    - Add the three new props to each `<ProductCard>` invocation:
      ```jsx
      userNegotiations={userNegotiations}
      handleRentClick={handleRentClick}
      handleNegotiationClick={handleNegotiationClick}
      ```
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.8 ProductDetailPage — Change 8: Replace handleNegotiateClick with prompt-based pattern
    - Replace the entire body of `handleNegotiateClick` (the function used by the RENT negotiate button) with the same pattern as `handleSecondHandNegotiateClick`:
      - Guard: `if (!product) return;`
      - Guard: `if (activeNegotiationStatus !== null)` → `triggerToast(...)` and return
      - Call `window.prompt(\`Enter your custom daily rate for "\${product.title}" (Current: ₹\${product.rentalPrice}/day):\`)`
      - If falsy, return
      - `parseFloat` + validate (`isNaN` or `<= 0`) → `triggerToast("Please enter a valid price.")` and return
      - POST `/rent/negotiate` with `{ productId: id, startDate: new Date(), endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000), dailyRate: numericOffer, securityDeposit: product.securityDeposit }`
      - On success: `setActiveNegotiationStatus("PENDING_NEGOTIATION")` and `setIsNegotiationModalOpen(true)`
      - On 409: `alert(...)`, `setActiveNegotiationStatus("PENDING_NEGOTIATION")`, return
      - On other errors: `triggerToast(...)`
    - The function name stays `handleNegotiateClick` — only the body changes
    - `handleSecondHandNegotiateClick` is NOT modified
    - `handleAction` (Rent Now) is NOT modified
    - _Bug_Condition: isBugCondition_DetailPageNegotiate — X.productType = "RENT" AND X.button = "💬 Propose Custom Price Negotiation"_
    - _Expected_Behavior: result.promptShown = true AND result.postedDailyRate = user_entered_value AND result.postedDailyRate ≠ product.rentalPrice (unless user matched it)_
    - _Preservation: handleSecondHandNegotiateClick unchanged; handleAction (Rent Now) unchanged_
    - _Requirements: 2.5, 3.2, 3.6_

- [ ] 4. Verify bug condition exploration tests now pass
  - **Property 1: Expected Behavior** - Rent Catalog Card Two-Button Layout & Detail Page Prompt
  - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
  - The tests from task 1 encode the expected behavior; when they pass, it confirms the fix is correct
  - Run `npm run test` (or `npx vitest --run src/pages/__tests__/RentNegotiationFlow.bug.test.jsx`) from the `frontend/` directory
  - **EXPECTED OUTCOME**: All 4 tests (1a, 1b, 1c, 1d) now PASS
    - Test 1a: `ProductCard` renders two buttons, both with onClick handlers ✓  
    - Test 1b: PBT confirms for all random RENT products, two wired buttons are present ✓
    - Test 1c: `userNegotiations` state exists and "✓ Negotiation Sent" disabled state is reachable ✓
    - Test 1d: `window.prompt` IS called when "💬 Propose Custom Rate" is clicked on RENT detail page ✓
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. Verify preservation tests still pass after fix
  - **Property 2: Preservation** - All Non-Bug-Condition Inputs Unchanged
  - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
  - Run `npm run test` (or `npx vitest --run src/pages/__tests__/RentNegotiationFlow.preservation.test.jsx`) from the `frontend/` directory
  - **EXPECTED OUTCOME**: All preservation tests (2a–2f) still PASS (no regressions)
    - Test 2a: Locked cards still show "Temporarily Unavailable" ✓
    - Test 2b: Owner cards still show "Your Listing" ✓
    - Test 2c: Card body click still navigates to `/product/:id` ✓
    - Test 2d: `SecondHandCatalogPage` Buy + Negotiate layout is identical ✓
    - Test 2e: SECOND_HAND detail page negotiate still calls `window.prompt` ✓
    - Test 2f: RENT "Rent Now" still POSTs at listed price with duration ✓
  - Confirm no regressions introduced by the fix
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 6. Checkpoint — Run full test suite and confirm all tests pass
  - Run `npm run test` from the `frontend/` directory to execute the full test suite
  - Ensure all existing tests continue to pass (including `RequestedCatalogPage.bug.test.jsx` and `RequestedCatalogPage.preservation.test.jsx`)
  - Ensure the two new test files both pass: `RentNegotiationFlow.bug.test.jsx` and `RentNegotiationFlow.preservation.test.jsx`
  - If any test fails, inspect the failure, identify whether it is a regression in the fix or a test setup issue, and resolve before marking complete
  - Confirm: no TypeScript/lint errors in the two modified source files (`RentCatalogPage.jsx`, `ProductDetailPage.jsx`)
  - Ask the user if any questions arise before marking complete

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"] },
    { "wave": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8"] },
    { "wave": 3, "tasks": ["4", "5"] },
    { "wave": 4, "tasks": ["6"] }
  ]
}
```

Tasks 1 and 2 are independent and can be written concurrently. All implementation sub-tasks (3.1–3.8) must follow tasks 1 and 2. Tasks 4 and 5 depend on task 3 being complete. Task 6 depends on tasks 4 and 5.

## Notes

- No backend changes — `/rent/negotiate` route and all backend endpoints are untouched.
- `SecondHandCatalogPage.jsx` is the authoritative reference implementation — it must not be modified.
- The `ProductCard` component in `RentCatalogPage.jsx` is a `React.memo` component — all new props must be listed in the destructured signature.
- Tests live in `frontend/src/pages/__tests__/` alongside the existing `RequestedCatalogPage` tests.
- Run tests from the `frontend/` directory: `npm run test` or `npx vitest --run`.
- The bug exploration tests (task 1) are intentionally expected to fail on unfixed code — this is correct and expected.
