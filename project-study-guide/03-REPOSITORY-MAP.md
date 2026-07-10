# Repository Map

This document explains the structure and purpose of the entire active codebase.

## Top-Level Structure
- `frontend/`: Contains the React SPA, Tailwind configuration, and Vite build settings.
- `backend/`: Contains the Node.js/Express server, Mongoose models, and Agenda job scheduler.

---

## Backend Directory Map

### `backend/server.js`
- **Purpose**: The main entry point for the backend. Bootstraps Express, connects to MongoDB, mounts all route files, initializes Socket.io, and starts the Agenda scheduler.
- **Status**: ACTIVE
- **Features Using This**: Entire application.

### `backend/models/` (Data Schemas)
Contains the exact shapes of data stored in MongoDB.

- `Address.js`
  - **Purpose**: Stores user physical addresses with geolocation.
  - **Status**: ACTIVE
  - **Features**: Address Management, Checkout.
- `AdminAction.js`
  - **Purpose**: Audit logging for admin actions.
  - **Status**: ACTIVE
  - **Features**: Admin Dashboard.
- `Auction.js` & `Bid.js`
  - **Purpose**: Core data for the live auction engine and competitive bids.
  - **Status**: ACTIVE
  - **Features**: Auctions.
- `AuctionAuditLog.js` & `AuctionEligibility.js`
  - **Purpose**: Tracking auction security/fraud metrics and dynamically determining if a product should be auctioned.
  - **Status**: ACTIVE
  - **Features**: Auctions, Admin Dashboard.
- `Bookmark.js`
  - **Purpose**: Stores products a user has saved for later.
  - **Status**: ACTIVE
  - **Features**: Catalog, Product Discovery.
- `Message.js`
  - **Purpose**: Stores individual chat messages tied to a specific transaction.
  - **Status**: ACTIVE
  - **Features**: Negotiation, Chat.
- `Notification.js`
  - **Purpose**: Stores system alerts and user-to-user notifications.
  - **Status**: ACTIVE
  - **Features**: Universal.
- `Product.js`
  - **Purpose**: The primary item listing (rental or second-hand).
  - **Status**: ACTIVE
  - **Features**: Catalog, Posting.
- `Review.js`
  - **Purpose**: User ratings and text reviews for completed transactions.
  - **Status**: ACTIVE
  - **Features**: Reputation.
- `Transaction.js`
  - **Purpose**: The core state machine tracking the lifecycle from request to settlement.
  - **Status**: ACTIVE
  - **Features**: Rentals, Returns, Negotiations, Escrow.
- `User.js`
  - **Purpose**: User accounts, authentication hashes, and profile data.
  - **Status**: ACTIVE
  - **Features**: Auth, Profile.
- `Wish.js`
  - **Purpose**: Reverse marketplace requests created by buyers.
  - **Status**: ACTIVE
  - **Features**: Requested Catalog.

### `backend/routes/` & `backend/controllers/`
The API layers mapping URLs to business logic.

- `auth.js`
  - **Purpose**: Registration, login, OAuth, password reset.
  - **Status**: ACTIVE
- `addresses.js`
  - **Purpose**: CRUD for `Address` model.
  - **Status**: ACTIVE
- `admin.js` / `adminController.js`
  - **Purpose**: Dispute resolution, metric fetching, user blocking.
  - **Status**: ACTIVE
- `auctions.js` (Inline in Rent) / `auctionController.js`
  - **Purpose**: Bid processing, auction initiation.
  - **Status**: ACTIVE
- `rent.js`
  - **Purpose**: A massive route file handling Products, Transactions, Chat, Notifications, and Checkout.
  - **Status**: ACTIVE (Warning: Technical debt due to file size).
- `wishes.js`
  - **Purpose**: CRUD for Wishes and accepting pitches.
  - **Status**: ACTIVE

### `backend/middleware/`
- `auth.js` (`verifyToken`, `requireAdmin`)
  - **Purpose**: Extracts JWT, verifies signature, blocks unauthorized access.
  - **Status**: ACTIVE
- `upload.js`
  - **Purpose**: Multer configuration for parsing multipart/form-data image uploads.
  - **Status**: ACTIVE
- `adminLimiter.js`
  - **Purpose**: Rate limiting to prevent brute force on sensitive admin routes.
  - **Status**: ACTIVE

### `backend/services/` & `backend/utils/`
- `auctionSchedulerService.js`
  - **Purpose**: Configures Agenda and defines background jobs (`auction-end`).
  - **Status**: ACTIVE
- `cloudinary.js`
  - **Purpose**: Cloudinary SDK integration for image hosting.
  - **Status**: ACTIVE
- `mailer.js`
  - **Purpose**: Nodemailer configuration for sending emails.
  - **Status**: ACTIVE

### `backend/sockets/`
- `auctionSockets.js`
  - **Purpose**: Socket.io handlers for real-time bid broadcasting.
  - **Status**: ACTIVE

---

## Frontend Directory Map

### `frontend/src/`
- `main.jsx`
  - **Purpose**: React Root injection and Google OAuth provider wrap.
  - **Status**: ACTIVE
- `App.jsx`
  - **Purpose**: React Router configuration and global theme management.
  - **Status**: ACTIVE
- `api.js`
  - **Purpose**: Axios instance configuration with automatic Authorization headers.
  - **Status**: ACTIVE

### `frontend/src/components/`
- `DesktopChatbox.jsx`
  - **Purpose**: Global chat UI managed via CustomEvents.
  - **Status**: ACTIVE
- `ChatBell.jsx` & `ChatDrawer.jsx`
  - **Purpose**: Notifications specifically for unread chat messages.
  - **Status**: ACTIVE
- `NotificationBell.jsx` & `NotificationDrawer.jsx`
  - **Purpose**: General system/transaction notification display.
  - **Status**: ACTIVE
- `PostProductModal.jsx`
  - **Purpose**: Form for creating new items.
  - **Status**: ACTIVE
- `ProductCard.jsx`
  - **Purpose**: Display unit for items in catalogs, heavily logic-driven based on transaction status.
  - **Status**: ACTIVE

### `frontend/src/pages/`
- `LandingPage.jsx`
  - **Purpose**: Home dashboard (mixed catalog).
  - **Status**: ACTIVE
- `RentCatalogPage.jsx` & `SecondHandCatalogPage.jsx`
  - **Purpose**: Dedicated search/filter pages for specific item types.
  - **Status**: ACTIVE
- `RequestedCatalogPage.jsx`
  - **Purpose**: View and pitch to Wishes.
  - **Status**: ACTIVE
- `AddressManagement.jsx`
  - **Purpose**: Google Maps powered address entry.
  - **Status**: ACTIVE
- `AdminDashboard.jsx`
  - **Purpose**: Admin control panel for disputes.
  - **Status**: ACTIVE
- `RentCheckout.jsx` & `MyOrders.jsx`
  - **Purpose**: Transaction lifecycle UI (payments, OTP handoffs).
  - **Status**: ACTIVE
- `Login.jsx`, `Register.jsx`, `ResetPassword.jsx`, `Profile.jsx`
  - **Purpose**: Authentication and user management flows.
  - **Status**: ACTIVE

### `frontend/src/hooks/`
- `useAuctionSocket.js`
  - **Purpose**: Reusable logic for connecting components to the Socket.io live auction feed.
  - **Status**: ACTIVE

### `frontend/src/utils/`
- `addressSync.js`
  - **Purpose**: Dispatches CustomEvents to keep address lists synced across components.
  - **Status**: ACTIVE
