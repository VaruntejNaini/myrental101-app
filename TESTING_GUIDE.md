# Borrower/Buyer Request Cancellation - Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend running on `http://localhost:5000`
2. Frontend running on `http://localhost:5173`
3. Two test user accounts (one as borrower, one as owner)

---

## Manual Testing Scenarios

### Scenario 1: Cancel Rental Request in PENDING_NEGOTIATION

**Steps**:
1. Login as User A (Borrower)
2. Go to Dashboard and find a RENT product
3. Click "Propose Negotiation"
4. Enter terms and submit
5. Go to My Orders page
6. Find your request card with status "⏳ Waiting for Owner Response"
7. Click "Cancel Rent Request" button
8. Verify:
   - ✅ Toast shows "Request cancelled successfully. -3 reputation deducted."
   - ✅ Card status changes to "CANCELLED BY BORROWER"
   - ✅ Message shows "You cancelled this rental request. -3 reputation deducted."
   - ✅ All action buttons (Generate OTP, etc.) are hidden
   - ✅ Chat button still appears

**Backend Verification**:
1. Check MongoDB: `db.transactions.findOne({ _id: <txId> })`
   - `status` should be "CANCELLED_BY_BORROWER"
   - `cancelledAt` should be set to current timestamp
2. Check User reputation: `db.users.findOne({ _id: <borrowerId> }).reputationHistory`
   - Should have new entry: `{ action: "REQUEST_CANCELLED", points: -3, ... }`

**Owner Verification**:
1. Login as the product owner (User B)
2. Go to My Orders
3. In "Lending / Selling" section, find the transaction
4. Verify status shows "CANCELLED BY BUYER/BORROWER"
5. Check Notification Panel
   - Should see "Rental Request Cancelled" notification
   - Message: "{User A name} has cancelled their rental request for "{product name}"."

---

### Scenario 2: Cancel Purchase Request in PENDING_NEGOTIATION (SECOND_HAND)

**Steps**:
1. Login as User C (Buyer)
2. Go to Dashboard and find a SECOND_HAND product
3. Click "Propose Negotiation"
4. Enter terms and submit
5. Go to My Orders page
6. Find your request card with status "⏳ Waiting for Owner Response"
7. Click "Cancel Buy Request" button
8. Verify:
   - ✅ Toast shows "Request cancelled successfully. -3 reputation deducted."
   - ✅ Card status changes to "CANCELLED BY BUYER"
   - ✅ Message shows "You cancelled this purchase request. -3 reputation deducted."

**Owner Verification**:
1. Login as seller
2. Check notification: "Purchase Request Cancelled"
3. Message: "{User C name} has cancelled their purchase request for "{product name}"."

---

### Scenario 3: Cancel After Owner Acceptance (AWAITING_PAYMENT)

**Steps**:
1. User A creates rental request
2. User B (owner) goes to notification → accepts offer
3. User A's card status changes to "Proceed to Checkout →"
4. **NEW**: Cancel button also appears
5. User A clicks "Cancel Rent Request"
6. Verify:
   - ✅ Request cancelled successfully
   - ✅ Status becomes "CANCELLED_BY_BORROWER"
   - ✅ Owner gets notification

---

### Scenario 4: Idempotency Test (Double-Click)

**Steps**:
1. User A cancels a request
2. Immediately click the same cancel button again (before page updates)
3. Verify:
   - ✅ Second click returns 200 OK
   - ✅ Toast shows "Request cancelled successfully..."
   - ✅ Only ONE -3 deduction in reputation history

**Check**:
1. Go to User A's profile → Reputation History
2. Should see exactly one "REQUEST_CANCELLED" entry (not two)

---

### Scenario 5: Prevent Cancellation After Payment Confirmed (RESERVED+)

**Steps**:
1. User A creates request
2. User B accepts
3. User A proceeds to checkout and completes payment
4. Status becomes "RESERVED"
5. User A goes to My Orders
6. **NO cancel button should appear** (only "Generate Handoff OTP")
7. Try to manually call API: `POST /rent/transaction/{txId}/cancel`
8. Verify:
   - ✅ Returns 409 Conflict
   - ✅ Message: "Cannot cancel transaction in RESERVED status..."
   - ✅ No reputation deduction

---

### Scenario 6: Prevent Owner from Cancelling (Authorization)

**Steps**:
1. Owner gets a borrower request
2. Try to call: `POST /rent/transaction/{txId}/cancel` as owner
3. Verify:
   - ✅ Returns 403 Forbidden
   - ✅ Message: "Unauthorized: Only the borrower can cancel their request."

---

### Scenario 7: Already Cancelled Transaction

**Steps**:
1. User A cancels request (status: CANCELLED_BY_BORROWER)
2. User A calls cancel API again (network retry simulation)
3. Verify:
   - ✅ Returns 200 OK
   - ✅ Message: "Transaction already cancelled."
   - ✅ No additional reputation deduction

---

## API Testing (Using cURL or Postman)

### Test 1: Successful Cancellation

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}' | jq -r '.token')

# Cancel transaction
curl -X POST http://localhost:5000/api/rent/transaction/{txId}/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected: 200 OK with cancelled transaction
```

### Test 2: Not Cancellable State

```bash
# Assuming txId is in RESERVED state
curl -X POST http://localhost:5000/api/rent/transaction/{txId}/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected: 409 Conflict
```

### Test 3: Unauthorized (Owner trying to cancel)

```bash
# Owner token instead of borrower token
curl -X POST http://localhost:5000/api/rent/transaction/{txId}/cancel \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json"

# Expected: 403 Forbidden
```

---

## Database Verification Queries

### Check Transaction Status
```javascript
db.transactions.findOne({ _id: ObjectId("{txId}") })
// Look for: status: "CANCELLED_BY_BORROWER", cancelledAt: <date>
```

### Check Reputation History
```javascript
db.users.findOne(
  { _id: ObjectId("{borrowerId}") },
  { reputationScore: 1, reputationHistory: 1 }
)
// Look for: action: "REQUEST_CANCELLED", points: -3
```

### Check Notifications
```javascript
db.notifications.find({
  type: "REQUEST_CANCELLED",
  recipient: ObjectId("{ownerId}")
})
// Should see message about cancellation
```

### Count Cancellations
```javascript
db.transactions.countDocuments({ status: "CANCELLED_BY_BORROWER" })
```

---

## Performance Testing

### Load Test (Multiple Concurrent Cancellations)

```javascript
// Node.js script to test concurrency
const axios = require('axios');

async function testConcurrency() {
  const token = 'your_token_here';
  const txId = 'your_txId_here';
  
  // Fire 10 concurrent cancel requests
  const promises = Array(10).fill().map(() =>
    axios.post(
      `http://localhost:5000/api/rent/transaction/${txId}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
  );
  
  try {
    const results = await Promise.allSettled(promises);
    console.log('Success:', results.filter(r => r.status === 'fulfilled').length);
    console.log('Expected: 1 success, 9 already-cancelled');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testConcurrency();
```

**Expected**:
- ✅ First request: 200 OK (cancelled successfully)
- ✅ Remaining 9: 200 OK (already cancelled, idempotent)
- ✅ Total reputation deduction: -3 (not -30)

---

## UI Visual Checklist

- [ ] Cancel button appears in red for PENDING_NEGOTIATION
- [ ] Cancel button appears in red for AWAITING_PAYMENT
- [ ] Cancel button does NOT appear for RESERVED or later states
- [ ] Button label is "Cancel Rent Request" or "Cancel Buy Request" (dynamic)
- [ ] Cancelled card shows red status badge
- [ ] Cancelled card shows "✓ Request Cancelled" message
- [ ] All action buttons hidden except Chat
- [ ] Chat still functional on cancelled transactions
- [ ] Toast notification appears after cancellation
- [ ] Page updates without full reload
- [ ] Owner notification panel shows REQUEST_CANCELLED entry

---

## Edge Cases to Test

1. **Rapid Successive Cancellations**
   - Double/triple click cancel button
   - Verify only one reputation deduction

2. **Page Refresh After Cancellation**
   - Cancel request
   - Refresh page
   - Verify status persists and button hidden

3. **Network Timeout Simulation**
   - Start cancel request
   - Disconnect network mid-request
   - Reconnect and retry
   - Verify idempotency (no double deduction)

4. **Different Product Types**
   - Test with RENT product (label: "Cancel Rent Request")
   - Test with SECOND_HAND product (label: "Cancel Buy Request")

5. **Cross-User Verification**
   - Cancel as borrower
   - Login as owner
   - Verify notification appears
   - Verify transaction shows as cancelled

6. **Reputation Score Impact**
   - Check profile before cancel
   - Cancel request
   - Check profile after cancel
   - Verify score decreased by 3

---

## Common Issues & Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Cancel button not appearing | Status not in cancellable states | Verify tx status is PENDING_NEGOTIATION or AWAITING_PAYMENT |
| Multiple -3 deductions | Concurrent requests | Verify `cancelledAt` timestamp is set and checked |
| Notification not received by owner | Backend error or wrong recipient | Check MongoDB notifications collection and verify owner ID |
| "Already cancelled" error on first attempt | Transaction status already CANCELLED_BY_BORROWER | Check if already cancelled in DB |
| 403 Unauthorized | Wrong user calling endpoint | Verify calling as borrower, not owner |
| Chat button disabled | Should remain enabled | Check conditional rendering in MyOrders |

---

## Sign-Off Checklist

- [ ] RENT flow: Cancel in PENDING_NEGOTIATION
- [ ] RENT flow: Cancel in AWAITING_PAYMENT
- [ ] SECOND_HAND flow: Cancel in PENDING_NEGOTIATION
- [ ] SECOND_HAND flow: Cancel in AWAITING_PAYMENT
- [ ] Owner receives correct notification
- [ ] -3 reputation deducted exactly once
- [ ] Cannot cancel after RESERVED
- [ ] Owner cannot cancel on behalf of borrower
- [ ] Idempotency verified (no double deduction)
- [ ] UI updates reflect cancelled state
- [ ] Chat remains functional
- [ ] Transaction preserved in history
- [ ] All edge cases pass

---

**Ready to Test!** 🚀
