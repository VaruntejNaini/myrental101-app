# Bugfix Requirements Document

## Introduction

A request wish card posted by a user is visible on the landing page (`/dashboard`) but is NOT visible in the request wish catalog page (`/requested-catalog`). The root cause is a default `maxPrice` filter of ₹1000 in `RequestedCatalogPage` — any wish posted with a budget above ₹1000 passes through the landing page (no budget filter) but is silently excluded on the catalog page. The fix must ensure all active wishes are visible in both locations for both the poster and all other logged-in users, without altering the existing wish card component or UI.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user posts a request wish with a budget greater than ₹1000 THEN the system displays the card on the landing page but NOT on the request wish catalog page (`/requested-catalog`)

1.2 WHEN a foreign user (any other logged-in user) navigates to the request wish catalog page THEN the system does NOT display wish cards whose budget exceeds the default `maxPrice` filter value of ₹1000

1.3 WHEN the catalog page first loads THEN the system initializes `maxPrice` to `1000`, causing the `filteredRequests` computation to silently exclude any wish with `budget > 1000` before the user interacts with any filter control

### Expected Behavior (Correct)

2.1 WHEN a user posts a request wish with any valid budget THEN the system SHALL display the wish card on both the landing page and the request wish catalog page

2.2 WHEN a foreign user navigates to the request wish catalog page THEN the system SHALL display all active wish cards regardless of their budget value, subject only to explicit user-applied filter changes

2.3 WHEN the catalog page first loads THEN the system SHALL initialize `maxPrice` to a value that does not exclude any existing wish (i.e., a value greater than or equal to the maximum possible budget, or derive the ceiling dynamically from the fetched data)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user applies a search term in the catalog page's search filter THEN the system SHALL CONTINUE TO filter wishes by title matching that search term

3.2 WHEN a user selects a specific category in the catalog page's category filter THEN the system SHALL CONTINUE TO show only wishes in that category

3.3 WHEN a user adjusts the max budget filter slider/input to a specific value THEN the system SHALL CONTINUE TO filter out wishes whose budget exceeds the user-chosen value

3.4 WHEN the landing page loads THEN the system SHALL CONTINUE TO fetch and display all active wishes from `GET /api/wishes` without any budget filtering

3.5 WHEN a wish is posted via the catalog page's "Broadcast a Wish Request" form THEN the system SHALL CONTINUE TO refresh the wish list and display the newly created card in the catalog

3.6 WHEN the existing wish card UI component (`WishCard`) is rendered in the catalog page THEN the system SHALL CONTINUE TO display it with its existing layout and functionality unchanged

---

## Bug Condition Pseudocode

**Bug Condition Function** — identifies inputs that trigger the bug:

```pascal
FUNCTION isBugCondition(wish)
  INPUT: wish of type WishDocument
  OUTPUT: boolean

  // Returns true when the wish will be excluded by the catalog page's default filter
  RETURN wish.budget > 1000
END FUNCTION
```

**Property: Fix Checking** — correct behavior for buggy inputs:

```pascal
// For all wishes whose budget exceeds the default ceiling
FOR ALL wish WHERE isBugCondition(wish) DO
  catalogWishes ← fetchCatalogPage()  // GET /wishes, no user filter applied
  ASSERT wish._id IN catalogWishes
END FOR
```

**Property: Preservation Checking** — non-buggy inputs must be unaffected:

```pascal
// For all wishes whose budget is within the original default ceiling
FOR ALL wish WHERE NOT isBugCondition(wish) DO
  ASSERT F(wish visible in catalog) = F'(wish visible in catalog)
END FOR
```
