# Bugfix Requirements Document

## Introduction

The rental product negotiation flow in `RentCatalogPage.jsx` and the RENT-specific section of `ProductDetailPage.jsx` is inconsistent with the working second-hand negotiation flow (the reference implementation in `SecondHandCatalogPage.jsx` and the SECOND_HAND section of `ProductDetailPage.jsx`).

On the catalog page, the rent card has a single dead "Rent" button with no `onClick` handler and no negotiate option. On the detail page, the "💬 Propose Custom Price Negotiation" button sends the listed price instead of prompting the user for a custom rate. Both defects prevent users from initiating rent negotiations in the same fluid, consistent way the second-hand flow supports.

The fix must mirror the second-hand flow exactly — two action buttons on the catalog card (Rent + Negotiate), a `userNegotiations` state to track and disable sent negotiations, and a `window.prompt()` for custom daily rate input on both the catalog card and detail page.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user views a rent product card on `RentCatalogPage` THEN the system renders a single "Rent" button with no `onClick` handler attached (dead button that does nothing)

1.2 WHEN a user views a rent product card on `RentCatalogPage` THEN the system shows no "Negotiate" button and provides no way to send a negotiation offer from the catalog

1.3 WHEN a user views a rent product card on `RentCatalogPage` THEN the system has no `userNegotiations` state, so sent negotiations are never tracked or reflected on the button

1.4 WHEN a user clicks "💬 Propose Custom Price Negotiation" on the `ProductDetailPage` for a RENT product THEN the system POSTs `negotiate` at the product's listed `rentalPrice` with no prompt, sending the fixed price instead of any custom rate the user intended

### Expected Behavior (Correct)

2.1 WHEN a user views a rent product card on `RentCatalogPage` and is not the owner and the product is not locked THEN the system SHALL render two buttons: "Rent" (instant at listed price) and "Negotiate" (custom rate via `window.prompt()`)

2.2 WHEN a user clicks the "Rent" button on a rent catalog card THEN the system SHALL POST `/rent/negotiate` with the listed `rentalPrice`, a default 3-day duration (endDate = startDate + 3 days), and the product's `securityDeposit`, then navigate to `/rent/checkout/:productId`

2.3 WHEN a user clicks the "Negotiate" button on a rent catalog card THEN the system SHALL open a `window.prompt()` asking for a custom daily rate, POST `/rent/negotiate` with that rate and `securityDeposit: product.securityDeposit`, show a toast "Negotiation sent", and disable the button to "✓ Negotiation Sent"

2.4 WHEN a user has already sent a negotiation for a rent product on `RentCatalogPage` THEN the system SHALL track that state in `userNegotiations` (keyed by product ID) and render a disabled "✓ Negotiation Sent" button in place of the "Negotiate" button

2.5 WHEN a user clicks "💬 Propose Custom Rate" on `ProductDetailPage` for a RENT product THEN the system SHALL open a `window.prompt()` asking for a custom daily rate, and POST `/rent/negotiate` with that user-entered rate (not the listed price)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user navigates to `SecondHandCatalogPage` THEN the system SHALL CONTINUE TO render the Buy + Negotiate two-button card layout exactly as it does today (no changes to this file)

3.2 WHEN a user interacts with the SECOND_HAND section of `ProductDetailPage` (Buy Out Now + 💬 Propose Buyout Offer Price buttons) THEN the system SHALL CONTINUE TO behave exactly as it does today (no changes to second-hand logic)

3.3 WHEN a user clicks on the body of a rent product card (not a button) THEN the system SHALL CONTINUE TO navigate to `/product/:id`

3.4 WHEN a rent product card is visually locked (`isRentedOrReserved && !isOwner`) THEN the system SHALL CONTINUE TO show the "Temporarily Unavailable" disabled button instead of action buttons

3.5 WHEN a rent product card is owned by the current user THEN the system SHALL CONTINUE TO show "Your Listing" instead of action buttons

3.6 WHEN a user clicks "Rent Now" on `ProductDetailPage` for a RENT product THEN the system SHALL CONTINUE TO POST negotiate at listed price with the duration slider value and navigate to checkout (this button is unchanged)

3.7 WHEN backend routes under `/rent/negotiate` and related endpoints receive requests THEN the system SHALL CONTINUE TO behave exactly as today (no backend changes)

---

## Bug Condition Derivation

**Bug Condition Function — Catalog Card:**
```pascal
FUNCTION isBugCondition_CatalogCard(X)
  INPUT: X of type RentProductCard render context
  OUTPUT: boolean

  RETURN X.page = "RentCatalogPage"
    AND NOT X.isVisuallyLocked
    AND NOT X.isOwner
END FUNCTION
```

**Property: Fix Checking — Catalog Card**
```pascal
FOR ALL X WHERE isBugCondition_CatalogCard(X) DO
  rendered ← renderCard'(X)
  ASSERT rendered.hasRentButton = true
    AND rendered.rentButton.hasOnClickHandler = true
    AND rendered.hasNegotiateButton = true
    AND rendered.parentPage.hasUserNegotiationsState = true
END FOR
```

**Bug Condition Function — Detail Page Negotiate:**
```pascal
FUNCTION isBugCondition_DetailPageNegotiate(X)
  INPUT: X of type NegotiateButtonClick
  OUTPUT: boolean

  RETURN X.productType = "RENT"
    AND X.button = "💬 Propose Custom Price Negotiation"
END FUNCTION
```

**Property: Fix Checking — Detail Page Negotiate**
```pascal
FOR ALL X WHERE isBugCondition_DetailPageNegotiate(X) DO
  result ← handleNegotiateClick'(X)
  ASSERT result.promptShown = true
    AND result.postedDailyRate = user_entered_value
    AND result.postedDailyRate ≠ X.product.rentalPrice  // unless user chose to match it
END FOR
```

**Preservation Goal:**
```pascal
FOR ALL X WHERE NOT isBugCondition_CatalogCard(X)
              AND NOT isBugCondition_DetailPageNegotiate(X) DO
  ASSERT F(X) = F'(X)
END FOR
```
