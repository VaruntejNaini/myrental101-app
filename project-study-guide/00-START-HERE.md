# RentIt Exhaustive Codebase Study

Welcome to your study guide. This document repository contains a complete, deep-dive analysis of the **RentIt** codebase, built based on a repository-wide mapping scan. 

Everything here is extracted directly from the actual code running in `frontend/src` and `backend/`.

## How to use this guide
Start by reading the overview and architecture documents to understand the system at a high level. Then, dive into specific systems and features before tackling the mentor preparation questions.

## Navigation Index

### Overview & Architecture
- [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) - What RentIt is, who uses it, and the problems it solves.
- [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) - Complete system architecture, ASCII diagrams, and request-response lifecycle.
- [03-REPOSITORY-MAP.md](./03-REPOSITORY-MAP.md) - Full repository structure, file purposes, and active/legacy status.
- [04-DEPENDENCIES.md](./04-DEPENDENCIES.md) - Every package installed, what it does, and if it's actually used.

### Core Systems
- [05-FRONTEND.md](./05-FRONTEND.md) - React component tree, state management, props, and side effects.
- [06-BACKEND.md](./06-BACKEND.md) - Express setup, middleware, routing, and controller logic.
- [07-DATABASE.md](./07-DATABASE.md) - Mongoose schemas, relationships, fields, indexes, and hooks.
- [08-API-REFERENCE.md](./08-API-REFERENCE.md) - Complete inventory of every API endpoint.

### Security & Access
- [09-AUTHENTICATION.md](./09-AUTHENTICATION.md) - Login, registration, OAuth, and JWT handling.
- [10-AUTHORIZATION.md](./10-AUTHORIZATION.md) - Role checks, ownership validation, and protected routes.
- [23-SECURITY.md](./23-SECURITY.md) - Security gaps, risks, and current protections.
- [24-ERROR-HANDLING.md](./24-ERROR-HANDLING.md) - How errors are caught, formatted, and displayed.

### Features & Flows
- [11-RENTAL-SYSTEM.md](./11-RENTAL-SYSTEM.md) - The core transaction state machine.
- [12-NEGOTIATION.md](./12-NEGOTIATION.md) - Price negotiation logic.
- [13-CHAT.md](./13-CHAT.md) - Real-time messaging implementation.
- [14-NOTIFICATIONS.md](./14-NOTIFICATIONS.md) - User alerts and platform events.
- [15-OTP-SYSTEMS.md](./15-OTP-SYSTEMS.md) - Email, handoff, and return OTPs.
- [16-RETURN-FLOW.md](./16-RETURN-FLOW.md) - Item return, damage reports, and settlement.
- [17-SECOND-HAND.md](./17-SECOND-HAND.md) - The second-hand purchasing flow.
- [18-AUCTIONS.md](./18-AUCTIONS.md) - Live bidding, WebSockets, and Agenda scheduling.
- [19-REPUTATION.md](./19-REPUTATION.md) - User scoring and history.

### Technical Deep Dives
- [20-BACKGROUND-JOBS.md](./20-BACKGROUND-JOBS.md) - Agenda job definitions and processing.
- [21-EXTERNAL-SERVICES.md](./21-EXTERNAL-SERVICES.md) - Gemini AI, Cloudinary, NodeMailer, etc.
- [22-LOCALSTORAGE-AND-STATE.md](./22-LOCALSTORAGE-AND-STATE.md) - Client-side persistence and caching.
- [25-CONCURRENCY.md](./25-CONCURRENCY.md) - Race conditions and optimistic locking.
- [26-BUG-RISK-WATCHLIST.md](./26-BUG-RISK-WATCHLIST.md) - Known bugs, tech debt, and legacy code.

### Indexes & Maps
- [27-FUNCTION-INDEX.md](./27-FUNCTION-INDEX.md) - Directory of all important functions.
- [28-STATUS-ENUM-INDEX.md](./28-STATUS-ENUM-INDEX.md) - Master list of all statuses and enums.
- [29-FEATURE-MAP.md](./29-FEATURE-MAP.md) - Cross-reference between UI, API, and Database by feature.

### Mentor Prep & Priority
- [30-MENTOR-QUESTIONS-BASIC.md](./30-MENTOR-QUESTIONS-BASIC.md) - Foundational codebase questions.
- [31-MENTOR-QUESTIONS-INTERMEDIATE.md](./31-MENTOR-QUESTIONS-INTERMEDIATE.md) - Mid-level architectural questions.
- [32-MENTOR-QUESTIONS-ADVANCED.md](./32-MENTOR-QUESTIONS-ADVANCED.md) - Hard technical and security questions.
- [33-MENTOR-QUESTIONS-TRICK.md](./33-MENTOR-QUESTIONS-TRICK.md) - Edge case and trick questions.
- [34-FUNDAMENTALS-USING-MY-CODE.md](./34-FUNDAMENTALS-USING-MY-CODE.md) - Core web concepts taught using RentIt code.
- [35-STUDY-PRIORITY.md](./35-STUDY-PRIORITY.md) - What to study first.
- [36-REVISION-SHEETS.md](./36-REVISION-SHEETS.md) - 5m, 15m, 30m, and 1h quick revision guides.
