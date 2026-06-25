# Request Wish Catalog Visibility Bugfix Design

## Overview

This design formalizes the fix for a silent filter bug in `RequestedCatalogPage.jsx`. The page initializes `maxPrice` to `1000`, which pre-excludes all wishes with `budget > ₹1000` from the catalog on initial load. The landing page (`/dashboard`) has no such filter, creating an inconsistency: wishes appear on the landing page but are invisible in the catalog. The fix changes the initial `maxPrice` value to one that does not pre-exclude any wish (e.g., `Infinity`, `999999`, or dynamically computed from fetched data). This ensures all active wishes are visible on page load, subject only to explicit user-applied filters.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — when a wish's budget exceeds the default `maxPrice` of ₹1000
- **Property (P)**: The desired behavior for buggy inputs — wishes with `budget > 1000` must be visible in the catalog on initial load (no user filter applied)
- **Preservation**: Existing filter behavior (search, category, user-adjusted maxPrice) and wish creation workflow must remain unchanged
- **RequestedCatalogPage**: The React component in `frontend/src/pages/RequestedCatalogPage.jsx` that renders the wish catalog and manages filter state
- **filteredRequests**: The computed array of wishes after applying all active filters (search, selectedCategory, maxPrice)
- **syncWishes**: The function that fetches all active wishes from `GET /api/wishes` and updates the `wishes` state
- **WishCard**: The child component that displays an individual wish card with offer/delete actions

## Bug Details

### Bug Condition

The bug manifests when a user or foreign user navigates to `/requested-catalog` and a wish with `budget > ₹1000` exists in the database. The `RequestedCatalogPage` component initializes the `maxPrice` state to `1000` on line 167:

```javascript
const [maxPrice, setMaxPrice] = useState(1000);
```

The filter logic on lines 233-238 computes `filteredRequests` by applying:

```javascript
const matchesPrice = p.budget <= maxPrice;
```

This silently excludes any wish with `budget > 1000` before the user interacts with any filter control. The landing page fetches the same data via `GET /api/wishes` but applies no budget filter, so the wish appears there correctly.

**Formal Specification:**
```
FUNCTION isBugCondition(wish)
  INPUT: wish of type WishDocument
  OUTPUT: boolean
  
  RETURN wish.budget > 1000
         AND wish.status === "ACTIVE"
         AND currentRoute === "/requested-catalog"
         AND NOT userHasInteractedWithMaxPriceFilter
END FUNCTION
```

### Examples

- **Example 1**: User creates a wish for "Professional Camera" with budget ₹2500/day. The wish appears on `/dashboard` but is invisible on `/requested-catalog` until the user manually adjusts the maxPrice filter (which is not rendered in the current UI).
- **Example 2**: Foreign user navigates to `/requested-catalog` and sees only wishes with budget ≤ ₹1000, even though wishes with higher budgets exist and are visible on the landing page.
- **Example 3**: User posts a wish with budget ₹999/day — this appears correctly on both pages (not a bug condition).
- **Edge Case**: User posts a wish with budget ₹1000/day — this is included because `matchesPrice` uses `<=`, so `1000 <= 1000` is true.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Search filter: When a user types a search term, the catalog SHALL filter wishes by title matching that term
- Category filter: When a user selects a category, the catalog SHALL show only wishes in that category
- User-adjusted maxPrice filter: If a user explicitly changes the maxPrice value (future feature), wishes with budget exceeding that value SHALL be excluded
- Landing page: Continues to fetch and display all active wishes without budget filtering
- Wish creation: Submitting the "Broadcast a Wish Request" form SHALL refresh the wish list and display the newly created wish
- WishCard component: No changes to the component's internal logic, layout, or functionality

**Scope:**
All existing filter logic (`matchesSearch`, `matchesCategory`, `matchesPrice`) must continue to work exactly as before. The only change is the initial value of `maxPrice` — once set correctly, the filter logic itself is untouched.

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Arbitrary Default Value**: The `maxPrice` state is initialized to `1000` (line 167), which was likely chosen arbitrarily or as a placeholder during development. There is no business requirement that limits wish budgets to ₹1000.

2. **No UI Control for Max Budget Filter**: Unlike the search input and category dropdown, there is no rendered slider or input for `maxPrice` in the current UI. This means users cannot adjust the filter, making the pre-exclusion permanent and invisible.

3. **No Dynamic Initialization**: The component does not compute a safe initial value from the fetched data (e.g., `Math.max(...wishes.map(w => w.budget)) + 1` or `Infinity`). The hardcoded `1000` is applied before the user has a chance to see all wishes.

4. **Inconsistency with Landing Page**: The landing page (`/dashboard`) fetches the same API (`GET /api/wishes`) but has no budget filter state, so all wishes are always visible there. The catalog page should mirror this behavior on initial load.

## Correctness Properties

Property 1: Bug Condition - High-Budget Wishes Visible on Initial Load

_For any_ wish where the bug condition holds (wish.budget > 1000 and wish.status === "ACTIVE"), the fixed RequestedCatalogPage SHALL include that wish in the filteredRequests array immediately on mount, without requiring any user interaction with filter controls.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing Filter Behavior Unchanged

_For any_ combination of user-applied filters (search term, category selection, explicit maxPrice adjustment), the fixed component SHALL produce exactly the same filteredRequests output as the original component when the wish.budget <= 1000, preserving all existing filter logic for search, category, and price constraints.

**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, the fix is minimal and localized:

**File**: `frontend/src/pages/RequestedCatalogPage.jsx`

**Function**: Component state initialization (line 167)

**Specific Changes**:

1. **Change Initial maxPrice Value**: Replace `useState(1000)` with `useState(Infinity)`
   - **Rationale**: `Infinity` is a safe JavaScript value that will never exclude a wish with a finite budget. The filter logic `p.budget <= maxPrice` will evaluate to `true` for all realistic budget values.
   - **Alternative Approaches**:
     - Use `useState(999999)` — a large finite number that is effectively unbounded for this domain
     - Dynamically compute the initial value: `useState(() => Math.max(...wishes.map(w => w.budget), 1000))`
       - **Caveat**: This requires `wishes` to be available synchronously during initialization, which is not the case (wishes are fetched asynchronously in `useEffect`). A dynamic approach would require refactoring state initialization.
   - **Chosen Approach**: Use `Infinity` for simplicity and correctness. No additional logic or async handling required.

2. **No Changes to Filter Logic**: The `filteredRequests` computation remains identical:
   ```javascript
   const filteredRequests = wishes.filter(p => {
     const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
     const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
     const matchesPrice = p.budget <= maxPrice;
     return matchesSearch && matchesCategory && matchesPrice;
   });
   ```

3. **No Changes to WishCard Component**: The `WishCard` component is defined within the same file but is not modified. It continues to render offer buttons, delete buttons, and view tracking exactly as before.

4. **No Changes to API Routes or Backend**: The bug is purely client-side. The backend `GET /api/wishes` route correctly returns all active wishes. No server-side changes are required.

5. **Future Consideration**: If a maxPrice filter UI control (slider or input) is added later, the initial value of `Infinity` will be replaced with the user's chosen value as soon as they interact with the control. This preserves the fix's intent: show all wishes until the user explicitly filters them.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (exploratory checking), then verify the fix works correctly (fix checking) and preserves existing behavior (preservation checking).

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that wishes with `budget > 1000` are excluded from the catalog on initial load.

**Test Plan**: Write unit tests that render `RequestedCatalogPage` with mock API responses containing wishes with budgets above and below ₹1000. Run these tests on the UNFIXED code to observe failures and confirm the root cause.

**Test Cases**:
1. **High Budget Wish Excluded**: Create a wish with `budget: 2500` and verify it does NOT appear in `filteredRequests` on initial render (will fail on unfixed code — wish is excluded)
2. **Low Budget Wish Included**: Create a wish with `budget: 500` and verify it DOES appear in `filteredRequests` on initial render (will pass on unfixed code — wish is included)
3. **Boundary Value Test**: Create a wish with `budget: 1000` and verify it DOES appear (will pass on unfixed code — `1000 <= 1000` is true)
4. **Edge Value Test**: Create a wish with `budget: 1001` and verify it does NOT appear (will fail on unfixed code — excluded by one rupee)

**Expected Counterexamples**:
- Test case 1 will fail: wish with budget ₹2500 is missing from the catalog
- Test case 4 will fail: wish with budget ₹1001 is missing from the catalog
- Possible root causes confirmed: hardcoded `maxPrice: 1000` initialization, no dynamic ceiling computation

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (wishes with `budget > 1000`), the fixed component produces the expected behavior (wish is visible in the catalog).

**Pseudocode:**
```
FOR ALL wish WHERE isBugCondition(wish) DO
  renderedCatalog := renderRequestedCatalogPage_fixed([wish, ...otherWishes])
  filteredWishes := extractFilteredRequests(renderedCatalog)
  ASSERT wish._id IN filteredWishes
END FOR
```

**Implementation Approach**:
- Unit test: Render the component with a mock API response containing wishes with budgets [500, 1000, 1500, 3000]
- Assert that all four wishes appear in `filteredRequests` on initial render
- Verify that no user interaction with filters occurred before the assertion

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (wishes with `budget <= 1000`), the fixed component produces the same result as the original component. Additionally, verify that all existing filter behaviors (search, category) remain unchanged.

**Pseudocode:**
```
FOR ALL wish WHERE NOT isBugCondition(wish) DO
  ASSERT originalComponent(wish).isVisible = fixedComponent(wish).isVisible
END FOR

FOR ALL (searchTerm, category, wishList) DO
  ASSERT originalComponent.filteredRequests = fixedComponent.filteredRequests
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (different search terms, categories, budget values)
- It catches edge cases that manual unit tests might miss (e.g., empty search, special characters, boundary category values)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Write property-based tests that generate random combinations of:
- Wish budgets (both ≤ 1000 and > 1000)
- Search terms (empty, partial matches, no matches)
- Category selections ("All", "Electronics", "Tools", "Music")

For each combination, verify:
1. **Search Preservation**: Wishes not matching the search term are excluded
2. **Category Preservation**: Wishes not matching the selected category are excluded
3. **Low-Budget Visibility Preservation**: Wishes with `budget <= 1000` have identical visibility before and after the fix
4. **Wish Creation Preservation**: Submitting the form triggers `syncWishes` and displays the new wish

**Test Cases**:
1. **Search Filter Works**: Set `search: "camera"`, verify only wishes with "camera" in title appear
2. **Category Filter Works**: Set `selectedCategory: "Electronics"`, verify only Electronics wishes appear
3. **Combined Filters Work**: Set search + category + maxPrice (if user adjusts it), verify all three filters are applied
4. **Wish Creation Refresh**: Submit the form, verify `syncWishes` is called and the new wish appears in the catalog

### Unit Tests

- Render `RequestedCatalogPage` with mock API responses containing wishes with various budgets
- Test initial `filteredRequests` includes all wishes (no pre-exclusion)
- Test search filter excludes non-matching titles
- Test category filter excludes non-matching categories
- Test edge case: empty wish list renders "No active wish requests" message
- Test edge case: wish with `budget: 0` is included (no negative budget exclusion)

### Property-Based Tests

- Generate random wish lists with budgets in range [0, 10000]
- For each list, verify all wishes are visible on initial render (no filter applied)
- Generate random (searchTerm, category, maxPrice) tuples
- For each tuple, verify the filter logic produces correct results
- Verify that wishes with `budget <= 1000` have identical visibility in original and fixed component

### Integration Tests

- Full user flow: Navigate to `/requested-catalog`, verify all wishes load
- User creates a wish with budget ₹5000, verify it appears immediately after form submission
- User navigates to `/dashboard`, then to `/requested-catalog`, verify the same wishes are visible in both locations
- Foreign user (different account) navigates to catalog, verifies they see all active wishes including those with high budgets
