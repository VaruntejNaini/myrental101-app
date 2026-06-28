# Rent Negotiation Flow Unification Bugfix Design

## Overview

Two related defects prevent users from initiating rent negotiations in the same fluid way the second-hand flow supports:

1. **RentCatalogPage** — `ProductCard` renders a single dead "Rent" button (no `onClick`) and has no "Negotiate" button. The parent has no `userNegotiations` state, so sent negotiations are never tracked.
2. **ProductDetailPage (RENT path)** — `handleNegotiateClick` POSTs the product's listed `rentalPrice` directly, with no `window.prompt()`, so the user can never submit a custom daily rate.

The fix mirrors the second-hand flow exactly. `SecondHandCatalogPage.jsx` is the authoritative reference: `ProductCard` receives `handleRentClick`, `handleNegotiationClick`, and `userNegotiations` props; the parent manages `userNegotiations` state and defines both handlers. On `ProductDetailPage`, the RENT negotiate path is updated to match `handleSecondHandNegotiateClick` — a `window.prompt()` for a custom rate before POSTing. No backend changes and no changes to `SecondHandCatalogPage` are required.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the defect — either a rent catalog card rendering without wired action buttons, or a rent detail page negotiate click that skips the custom-rate prompt.
- **Property (P)**: The desired correct behavior — rent catalog cards render two wired buttons (Rent + Negotiate) and the detail page negotiate handler shows a `window.prompt()` before POSTing.
- **Preservation**: All behaviors outside the bug condition that must remain byte-for-byte identical after the fix, including `SecondHandCatalogPage`, the SECOND_HAND detail page path, card nav, locked-card state, and owner-card state.
- **`ProductCard` (RentCatalogPage)**: The `React.memo` component in `RentCatalogPage.jsx` that renders a single rent product card. Currently accepts no action-handler props.
- **`handleNegotiateClick` (ProductDetailPage)**: The async function in `ProductDetailPage.jsx` that fires when the RENT-type negotiate button is clicked. Currently POSTs at `product.rentalPrice` with no prompt.
- **`handleSecondHandNegotiateClick` (ProductDetailPage)**: The reference implementation in `ProductDetailPage.jsx` — uses `window.prompt()` to collect a custom price before POSTing.
- **`userNegotiations`**: A `{ [productId]: status }` map tracked in the parent page component that drives the disabled / sent state of the Negotiate button in each card.
- **`handleNegotiationClick` (SecondHandCatalogPage)**: The reference parent-level handler that calls `window.prompt()`, validates input, POSTs, and updates `userNegotiations`.

---

## Bug Details

### Bug Condition

The defect manifests in two distinct render/interaction contexts on the rent path.

**Catalog Card Bug Condition:**
```
FUNCTION isBugCondition_CatalogCard(X)
  INPUT: X of type RentProductCard render context
  OUTPUT: boolean

  RETURN X.page = "RentCatalogPage"
    AND NOT X.isVisuallyLocked
    AND NOT X.isOwner
END FUNCTION
```

**Detail Page Negotiate Bug Condition:**
```
FUNCTION isBugCondition_DetailPageNegotiate(X)
  INPUT: X of type NegotiateButtonClick
  OUTPUT: boolean

  RETURN X.productType = "RENT"
    AND X.button = "💬 Propose Custom Price Negotiation"
END FUNCTION
```

### Examples

- **Catalog — Dead Rent button**: User views a RENT card, clicks "Rent" — nothing happens. No network call, no navigation. Expected: POST `/rent/negotiate` at listed price + navigate to checkout.
- **Catalog — No Negotiate button**: User wants to propose a custom daily rate from the catalog — there is no Negotiate button at all. Expected: A "Negotiate" button opens `window.prompt()` and POSTs the custom rate.
- **Catalog — No negotiation tracking**: User sends a negotiation, revisits the page — the button still shows "Negotiate" instead of "✓ Negotiation Sent". Expected: `userNegotiations` state disables the button.
- **Detail Page — No prompt on negotiate**: User clicks "💬 Propose Custom Price Negotiation" on a RENT detail page — a POST fires immediately at the listed price with no input from the user. Expected: A `window.prompt()` collects a custom daily rate first.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `SecondHandCatalogPage.jsx` must not be touched — Buy + Negotiate two-button layout continues to work exactly as today.
- The SECOND_HAND section of `ProductDetailPage` (Buy Out Now + 💬 Propose Buyout Offer Price) must continue to behave exactly as today.
- Clicking the body of a rent catalog card (not a button) must continue to navigate to `/product/:id`.
- A visually locked rent card (`isRentedOrReserved && !isOwner`) must continue to show "Temporarily Unavailable".
- An owner-viewed rent card must continue to show "Your Listing" instead of action buttons.
- "Rent Now" on `ProductDetailPage` for RENT (the `handleAction` path) must continue to POST at listed price with duration and navigate to checkout — this button is not touched.
- All backend routes under `/rent/negotiate` and related endpoints are unchanged.

**Scope:**
All inputs where `isBugCondition_CatalogCard` and `isBugCondition_DetailPageNegotiate` both return `false` must be completely unaffected by the fix.

---

## Hypothesized Root Cause

1. **Missing prop wiring on `ProductCard` (RentCatalogPage)**: The `ProductCard` component signature does not include `handleRentClick`, `handleNegotiationClick`, or `userNegotiations`. The button rendered in the card bottom-right section has no `onClick` and no second button is rendered, because those prop-driven branches simply don't exist. The equivalent branches in `SecondHandCatalogPage.ProductCard` are fully wired.

2. **Missing `userNegotiations` state in parent (RentCatalogPage)**: The `RentCatalogPage` function component never declares `const [userNegotiations, setUserNegotiations] = useState({})` and never fetches active negotiations in its `useEffect`. Without this state, even if a handler were wired, the sent/disabled feedback loop cannot function.

3. **Missing `handleRentClick` and `handleNegotiationClick` handlers in parent (RentCatalogPage)**: No parent-level async functions equivalent to `SecondHandCatalogPage`'s `handleBuyClick` / `handleNegotiationClick` are defined, so there is nothing to pass down as props.

4. **`handleNegotiateClick` in `ProductDetailPage` bypasses the prompt**: The RENT path calls `API.post("/rent/negotiate", { ..., dailyRate: product.rentalPrice, ... })` directly, without calling `window.prompt()`. The SECOND_HAND path (`handleSecondHandNegotiateClick`) correctly does call `window.prompt()` first. The fix is to replace the RENT path's implementation with the same prompt-then-POST pattern.

---

## Correctness Properties

Property 1: Bug Condition — Rent Catalog Card Wired Two-Button Layout

_For any_ render context where `isBugCondition_CatalogCard` returns true (non-owner, non-locked rent card on `RentCatalogPage`), the fixed `ProductCard` SHALL render both a "Rent" button (wired to `handleRentClick`) and a "Negotiate" button (wired to `handleNegotiationClick`), and the parent SHALL track sent negotiations in `userNegotiations` so the Negotiate button transitions to a disabled "✓ Negotiation Sent" state after submission.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Bug Condition — Detail Page Rent Negotiate Uses Prompt

_For any_ negotiate button click where `isBugCondition_DetailPageNegotiate` returns true (RENT product, negotiate button on detail page), the fixed `handleNegotiateClick` SHALL call `window.prompt()` to collect a custom daily rate, validate the input, and POST `/rent/negotiate` with that user-entered rate — NOT the listed `product.rentalPrice`.

**Validates: Requirements 2.5**

Property 3: Preservation — All Non-Bug-Condition Inputs Unchanged

_For any_ input where both `isBugCondition_CatalogCard` and `isBugCondition_DetailPageNegotiate` return false, the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing `SecondHandCatalogPage` behavior, SECOND_HAND detail page behavior, card navigation, locked-card state, owner-card state, and the RENT "Rent Now" (`handleAction`) button.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

---

## Fix Implementation

### Changes Required

#### File: `frontend/src/pages/RentCatalogPage.jsx`

**1. Extend `ProductCard` component signature**

Add `userNegotiations`, `handleRentClick`, and `handleNegotiationClick` to the destructured props — identical to `SecondHandCatalogPage.ProductCard`.

```
const ProductCard = React.memo(({ p, isNight, bookmarkedIds, handleBookmarkToggle,
  navigate, coordsLoading, coordsError, calculateDistance, userCoords,
  currentUser, userNegotiations, handleRentClick, handleNegotiationClick }) => {
```

**2. Replace the dead single "Rent" button with the two-button layout**

In the bottom-right action section of `ProductCard`, replace:
```jsx
<button className="...">Rent</button>
```
with the exact pattern from `SecondHandCatalogPage.ProductCard`:
```jsx
isOwner ? (
  <span className="...">Your Listing</span>
) : (
  <div className="flex flex-col gap-1 w-20">
    <button onClick={(e) => { e.stopPropagation(); handleRentClick(p._id, p.rentalPrice, p.securityDeposit); }}
      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[10px] py-1.5 rounded-lg ...">
      Rent
    </button>
    {userNegotiations[p._id] ? (
      <button disabled className="... cursor-not-allowed opacity-60">✓ Negotiation Sent</button>
    ) : (
      <button onClick={(e) => { e.stopPropagation(); handleNegotiationClick(p._id, p.rentalPrice, p.title); }}
        className="w-full bg-slate-800 hover:bg-slate-700 ... text-white font-bold text-[10px] py-1.5 rounded-lg">
        Negotiate
      </button>
    )}
  </div>
)
```

**3. Add `userNegotiations` state in `RentCatalogPage`**

In the parent function component, add alongside existing state declarations:
```js
const [userNegotiations, setUserNegotiations] = useState({});
```

**4. Populate `userNegotiations` in the session-loading `useEffect`**

Inside the `activeToken` branch of the geolocation/session `useEffect`, add the same transactions fetch as `SecondHandCatalogPage`:
```js
API.get("/auth/me").then((userRes) => {
  const user = userRes.data;
  setCurrentUser(user);
  return API.get("/rent/transactions").then((txRes) => {
    const activeStates = ["PENDING_NEGOTIATION", "NEGOTIATING", "ACCEPTED", "AWAITING_PAYMENT", "RESERVED"];
    const negotiationsMap = {};
    txRes.data.forEach((t) => {
      const borrowerId = t.borrower?._id || t.borrower;
      const prodId = t.product?._id || t.product;
      if (activeStates.includes(t.status) && prodId && borrowerId &&
          String(borrowerId) === String(user._id)) {
        negotiationsMap[String(prodId)] = t.status;
      }
    });
    setUserNegotiations(negotiationsMap);
  });
});
```

**5. Add `handleRentClick` handler in `RentCatalogPage`**

Mirror `SecondHandCatalogPage.handleBuyClick`, but with RENT-appropriate payload (3-day default + securityDeposit):
```js
const handleRentClick = async (productId, price, securityDeposit) => {
  try {
    await API.post("/rent/negotiate", {
      productId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      dailyRate: price,
      securityDeposit: securityDeposit || 0
    });
    triggerToast(`Rental request submitted!`);
    setTimeout(() => navigate(`/rent/checkout/${productId}`), 1500);
  } catch (err) {
    triggerToast(err.response?.data?.msg || "Rental request failed");
  }
};
```

**6. Add `handleNegotiationClick` handler in `RentCatalogPage`**

Mirror `SecondHandCatalogPage.handleNegotiationClick`, but with RENT-appropriate payload (dailyRate + securityDeposit):
```js
const handleNegotiationClick = async (productId, currentPrice, title) => {
  if (userNegotiations[productId]) {
    triggerToast("You already have an active negotiation for this product.");
    return;
  }
  const offer = window.prompt(`Enter your custom daily rate for "${title}" (Current: ₹${currentPrice}/day):`);
  if (!offer) return;
  const numericOffer = parseFloat(offer);
  if (isNaN(numericOffer) || numericOffer <= 0) {
    triggerToast("Please enter a valid price.");
    return;
  }
  try {
    await API.post("/rent/negotiate", {
      productId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      dailyRate: numericOffer,
      securityDeposit: 0
    });
    triggerToast(`Negotiation request of ₹${numericOffer}/day sent!`);
    setUserNegotiations(prev => ({ ...prev, [productId]: "PENDING_NEGOTIATION" }));
  } catch (err) {
    if (err.response?.status === 409) {
      alert("You already have an active negotiation for this product.");
      setUserNegotiations(prev => ({ ...prev, [productId]: "PENDING_NEGOTIATION" }));
      return;
    }
    triggerToast(err.response?.data?.msg || "Negotiation request failed");
  }
};
```

**7. Pass new props to `<ProductCard>` in the render map**

```jsx
<ProductCard
  key={p._id}
  p={p}
  ...existingProps...
  userNegotiations={userNegotiations}
  handleRentClick={handleRentClick}
  handleNegotiationClick={handleNegotiationClick}
/>
```

---

#### File: `frontend/src/pages/ProductDetailPage.jsx`

**8. Replace `handleNegotiateClick` for RENT type with prompt-based pattern**

Replace the current `handleNegotiateClick` body with the same pattern as `handleSecondHandNegotiateClick`:
```js
const handleNegotiateClick = async () => {
  if (!product) return;
  if (activeNegotiationStatus !== null) {
    triggerToast("You already have an active negotiation for this product.");
    return;
  }
  const offer = window.prompt(
    `Enter your custom daily rate for "${product.title}" (Current: ₹${product.rentalPrice}/day):`
  );
  if (!offer) return;
  const numericOffer = parseFloat(offer);
  if (isNaN(numericOffer) || numericOffer <= 0) {
    triggerToast("Please enter a valid price.");
    return;
  }
  try {
    await API.post("/rent/negotiate", {
      productId: id,
      startDate: new Date(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      dailyRate: numericOffer,
      securityDeposit: product.securityDeposit
    });
    setActiveNegotiationStatus("PENDING_NEGOTIATION");
    setIsNegotiationModalOpen(true);
  } catch (err) {
    if (err.response?.status === 409) {
      alert("You already have an active negotiation for this product.");
      setActiveNegotiationStatus("PENDING_NEGOTIATION");
      return;
    }
    triggerToast(err.response?.data?.msg || "Negotiation request failed");
  }
};
```

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Render `RentCatalogPage.ProductCard` with a non-owner, non-locked RENT product and assert button presence and handler wiring. Simulate a negotiate click on `ProductDetailPage` for a RENT product and assert that `window.prompt` was called. Run these tests on UNFIXED code to observe failures and confirm root cause.

**Test Cases**:
1. **Dead Rent Button Test**: Render `ProductCard` for a non-owner, non-locked RENT product — assert only one button exists and it has no `onClick`. (Will fail assertion that it has two buttons and wired handlers.)
2. **Missing Negotiate Button Test**: Render `ProductCard` — assert no Negotiate button is present. (Confirms bug 1.2.)
3. **No `userNegotiations` State Test**: Check `RentCatalogPage` render output — assert `userNegotiations` is not in state. (Confirms bug 1.3.)
4. **Detail Page No-Prompt Test**: Simulate click on "💬 Propose Custom Price Negotiation" for RENT product — spy on `window.prompt` — assert it was NOT called. (Confirms bug 1.4.)

**Expected Counterexamples**:
- `ProductCard` renders a single non-wired "Rent" button, no "Negotiate" button.
- `window.prompt` is never invoked when the detail page negotiate button is clicked for RENT.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed code produces the expected behavior.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition_CatalogCard(X) DO
  rendered := renderProductCard_fixed(X)
  ASSERT rendered.rentButton.hasOnClickHandler = true
  ASSERT rendered.negotiateButton.exists = true
  ASSERT rendered.parent.hasUserNegotiationsState = true
END FOR

FOR ALL X WHERE isBugCondition_DetailPageNegotiate(X) DO
  result := handleNegotiateClick_fixed(X)
  ASSERT result.promptShown = true
  ASSERT result.postedDailyRate = user_entered_value
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition_CatalogCard(X)
              AND NOT isBugCondition_DetailPageNegotiate(X) DO
  ASSERT originalCode(X) = fixedCode(X)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for locked cards, owner cards, card navigation, and second-hand paths — then write property-based tests capturing that behavior.

**Test Cases**:
1. **Locked Card Preservation**: Verify that a visually locked RENT card still shows "Temporarily Unavailable" and no action buttons after the fix.
2. **Owner Card Preservation**: Verify that an owner-viewed RENT card still shows "Your Listing" after the fix.
3. **Card Navigation Preservation**: Verify that clicking the card body (not a button) still navigates to `/product/:id` after the fix.
4. **SecondHandCatalogPage Untouched**: Verify that `SecondHandCatalogPage` renders identically before and after the fix (file is not modified).
5. **SECOND_HAND Detail Page Preservation**: Verify that `handleSecondHandNegotiateClick` and the Buy Out Now button on `ProductDetailPage` behave identically after the fix.
6. **RENT "Rent Now" Preservation**: Verify that `handleAction` on `ProductDetailPage` for RENT still POSTs at listed price with duration and navigates to checkout.

### Unit Tests

- Render `ProductCard` with `isOwner=false`, `isVisuallyLocked=false` — assert two buttons present with correct labels and `onClick` handlers.
- Render `ProductCard` with `userNegotiations[p._id]` set — assert Negotiate button is disabled showing "✓ Negotiation Sent".
- Render `ProductCard` with `isVisuallyLocked=true` — assert "Temporarily Unavailable" shown, no Rent/Negotiate buttons.
- Render `ProductCard` with `isOwner=true` — assert "Your Listing" shown, no action buttons.
- Unit test `handleNegotiateClick` on detail page: mock `window.prompt` returning a valid value — assert POST called with that value, not `product.rentalPrice`.
- Unit test `handleNegotiateClick` on detail page: mock `window.prompt` returning null/empty — assert POST is NOT called.
- Unit test `handleNegotiateClick` on detail page: mock `window.prompt` returning a non-numeric string — assert POST is NOT called and toast shown.

### Property-Based Tests

- Generate random RENT product objects with random `rentalPrice` values — for any non-owner, non-locked render, assert the Negotiate button always exists and is wired.
- Generate random valid offer prices (positive floats) via property test — assert `handleNegotiateClick` always POSTs the prompted value, never the product's listed price.
- Generate random `userNegotiations` maps and random product IDs — assert that when `userNegotiations[p._id]` is truthy, the Negotiate button is always disabled regardless of other product state.
- Generate random non-RENT, non-negotiate-button click scenarios — assert original behavior is preserved (no regression).

### Integration Tests

- Full flow: Visit `RentCatalogPage`, click "Rent" on a card — assert POST fires with correct payload and page navigates to checkout.
- Full flow: Visit `RentCatalogPage`, click "Negotiate" — enter a value in prompt — assert POST fires with user-entered rate, button transitions to "✓ Negotiation Sent".
- Full flow: Visit `ProductDetailPage` for RENT product, click "💬 Propose Custom Rate" — enter rate in prompt — assert POST fires with that rate and modal appears.
- Regression: Visit `SecondHandCatalogPage` after fix deployed — assert Buy + Negotiate layout is identical to pre-fix baseline.
- Regression: Visit `ProductDetailPage` for SECOND_HAND product after fix — assert "💬 Propose Buyout Offer Price" still uses its original prompt-based flow unchanged.
