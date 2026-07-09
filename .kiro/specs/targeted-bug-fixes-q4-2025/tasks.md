# Targeted Bug Fixes — Q4 2025

## Overview
Fix exactly three issues:
1. **Bug 1** — Request posts incorrectly appear as normal rental products in Landing Page and Rent Catalog
2. **Bug 2** — Borrowers don't receive notifications when owners accept/reject/negotiate
3. **Bug 3** — Guest users can enter rent/negotiate flows before being redirected to /register

## Tasks

### Bug 1 — Request Posts Filtering

- [x] 1.1 Trace Landing Page rental feed
  - Trace: LandingPage → API request → backend route → Product query → frontend filtering → ProductCard
  - Identify: backend route for rental products, query filter, discriminator field/schema
  - Output: affected files, query logic, discriminator field name and values

- [x] 1.2 Trace Rent Catalog Page rental feed
  - Trace: RentCatalogPage → API request → backend route → query → ProductCard rendering
  - Identify: same or different API endpoint, query filter
  - Output: affected files, query logic, discriminator handling

- [x] 1.3 Identify request post discriminator
  - Inspect Product/Request model schema
  - Find: field that distinguishes normal RENT from REQUEST posts
  - Confirm: exact field name and stored value in MongoDB

- [x] 1.4 Fix Landing Page rental query
  - Backend: modify query to exclude request posts from rental-product API
  - Add filter: `type !== "REQUEST"` or equivalent discriminator check
  - Verify: only applies to normal rental product endpoints

- [x] 1.5 Fix Rent Catalog Page rental query
  - Backend: modify query to exclude request posts
  - Apply same discriminator filter as Landing Page

- [x] 1.6 Verify filtering behavior
  - Normal RENT product → visible in Landing renting row
  - Request post → NOT visible in Landing renting row
  - Normal RENT product → visible in Rent Catalog
  - Request post → NOT visible in Rent Catalog normal grid
  - Dedicated request feature → request remains visible in intended location

### Bug 2 — Borrower Negotiation Notifications

- [x] 2.1 Trace negotiation Accept handler
  - Frontend: Owner Accept button click handler
  - API request/endpoint → backend route
  - Backend: negotiation mutation, existing notification helper
  - Output: complete flow, notification creation point

- [x] 2.2 Trace negotiation Reject handler
  - Frontend: Owner Reject button click handler
  - API request/endpoint → backend route
  - Backend: negotiation mutation, existing notification helper
  - Output: complete flow

- [x] 2.3 Trace Chat Now/continue negotiation handler
  - Frontend: Owner Chat Now button click handler
  - API request/endpoint → backend route
  - Backend: negotiation mutation, existing notification helper
  - Output: complete flow

- [x] 2.4 Inspect Notification schema
  - Find: Notification model/schema
  - Identify: notification type field, existing enum/values
  - Output: schema structure, type values

- [x] 2.5 Create notification types (if needed)
  - Add enum values for: `NEGOTIATION_ACCEPTED`, `NEGOTIATION_REJECTED`, `OWNER_WANTS_TO_NEGOTIATE`
  - Follow existing notification type conventions

- [x] 2.6 Implement Accept notification
  - Backend: in Accept route, call createNotification for borrower
  - Message: "The owner accepted your negotiation request for {product title}"
  - Recipient: derived from Transaction.requesterId (not from frontend)

- [x] 2.7 Implement Reject notification
  - Backend: in Reject route, call createNotification for borrower
  - Message: "The owner rejected your negotiation request for {product title}"

- [x] 2.8 Implement Chat Now notification
  - Backend: in Chat Now route, call createNotification for borrower
  - Message: "The owner wants to negotiate with you for {product title}"

- [x] 2.9 Verify single notification per action
  - Test: Accept from Notification Panel → one notification
  - Test: Accept from Chat UI → one notification (same backend flow)
  - Test: No duplicate notifications

### Bug 3 — Guest Redirect for Rent/Negotiate

- [x] 3.1 Trace Landing Page Rent handler
  - Find: Rent click handler in Landing Page / ProductCard
  - Output: current handler code, auth check location (if any)

- [x] 3.2 Trace Landing Page Negotiate handler
  - Find: Negotiate click handler
  - Output: current handler code, auth check location

- [x] 3.3 Trace Rent Catalog Page handlers
  - Find: Rent and Negotiate handlers in RentCatalogPage
  - Output: current implementation

- [x] 3.4 Trace Product Detail Page handlers
  - Find: Rent Now and Negotiate handlers in ProductDetailPage
  - Output: current implementation

- [x] 3.5 Identify auth detection mechanism
  - Find: how frontend determines if user is authenticated
  - Output: auth context, localStorage key, or helper function

- [x] 3.6 Fix Landing Page Rent handler
  - Add: auth check at start of handler
  - If not authenticated: `navigate("/register")` and return
  - Preserve: authenticated behavior unchanged

- [x] 3.7 Fix Landing Page Negotiate handler
  - Add: auth check at start of handler
  - If not authenticated: `navigate("/register")` and return
  - Prevent: window.prompt from appearing

- [x] 3.8 Fix Rent Catalog Page handlers
  - Apply same auth guard pattern to Rent and Negotiate handlers

- [x] 3.9 Fix Product Detail Page handlers
  - Apply same auth guard pattern to Rent Now and Negotiate

- [x] 3.10 Verify guest redirect behavior
  - Guest clicks Rent from Landing → redirects to /register
  - Guest clicks Negotiate from Landing → redirects to /register (no prompt)
  - Guest clicks Rent from Rent Catalog → redirects to /register
  - Guest clicks Negotiate from Rent Catalog → redirects to /register
  - Guest clicks RENT from Product Detail → redirects to /register
  - Authenticated user Rent flow → unchanged
  - Authenticated user Negotiate flow → unchanged (prompt appears)

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "2.4", "3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "wave": 2, "tasks": ["1.4", "1.5", "1.6", "2.5", "2.6", "2.7", "2.8", "3.6", "3.7", "3.8", "3.9"] },
    { "wave": 3, "tasks": ["1.7", "2.9", "3.10"] }
  ]
}
```

Wave 1: Investigation only — no code changes  
Wave 2: Implement fixes  
Wave 3: Verification