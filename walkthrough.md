# Walkthrough: Duplicate "Request Accepted" Notification Fix

We have resolved the bug where the "Negotiation Accepted" (or "Counter Offer Made") notification persists or appears repeatedly when users are actively chatting. 

## Changes Made

### 1. Backend API Endpoint in [rent.js](file:///c:/Users/Varuntej/Desktop/authentication-page/backend/routes/rent.js)
* Added a new endpoint: `POST /rent/notifications/transaction/:transactionId/read`.
* **Ownership Validation**: Validates that the logged-in user is either the `owner` or the `borrower` of the transaction before marking notifications as read, preventing unauthorized operations.
* **Bulk Update**: Marks all unread notifications associated with the transaction ID for the recipient as read.

### 2. Immediate Clear on "Chat Now" Click in [NotificationDrawer.jsx](file:///c:/Users/Varuntej/Desktop/authentication-page/frontend/src/components/NotificationDrawer.jsx)
* Replaced individual notification clearing with `handleClearTransactionNotifications(txId, otherUser, productTitle)`:
  * Calls the new transaction-level read API.
  * Immediately filters out any notifications related to the transaction from the drawer's React state.
  * Dispatches `refreshNotificationCount` after success to update the bell count.
  * Opens the chatbox and closes the drawer.

### 3. Clear on Chatbox Thread Load in [DesktopChatbox.jsx](file:///c:/Users/Varuntej/Desktop/authentication-page/frontend/src/components/DesktopChatbox.jsx)
* Added a `useEffect` inside `SingleChatbox` that triggers whenever the chat thread is selected/loaded and is not minimized.
* Calls the transaction-level read API to clear notifications and updates the bell count.

## Verification

To verify:
1. Trigger a negotiation acceptance flow to create a "Negotiation Accepted 🎉" notification for User B.
2. Open the notification bell. Confirm that clicking the `CHAT NOW` button on the notification immediately opens the chat window and clears the notification from the drawer and count badge with no flicker.
3. Trigger another negotiation acceptance notification, but instead of clicking `CHAT NOW` in the notification bell drawer, open the messaging drawer and click on the thread. Verify that opening the thread also clears the notification from the bell drawer immediately.
