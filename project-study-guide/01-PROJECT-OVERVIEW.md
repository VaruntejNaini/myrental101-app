# What is RentIt?

## 15-second explanation
RentIt is a peer-to-peer (P2P) marketplace that allows users to rent out their belongings or sell them second-hand. It includes real-time chat, location-based search, dynamic pricing negotiation, and an escrow-style transaction lifecycle to ensure safe handoffs and returns.

## 30-second explanation
RentIt is a full-stack MERN application designed for a circular economy. Instead of buying things they only need temporarily, users can rent items from people nearby. It handles the entire transaction lifecycle: product listing, location-based discovery, price negotiation, payment processing (escrow), handoff via OTP, and final return verification. It also supports direct second-hand sales and live real-time auctions for high-demand items.

## 1-minute explanation
At its core, RentIt solves the problem of underutilized assets. If you own a DSLR camera you rarely use, you can list it on RentIt. Someone in your city can find it using the location-based search, send a rental request, and negotiate the daily rate with you via a real-time chat interface. Once both parties agree, the borrower pays securely. 

To prevent fraud, the system uses an OTP (One Time Password) verification at the physical handoff. When the rental period ends, another OTP verifies the return, and any damage claims can be submitted for admin review. 

Beyond standard rentals, RentIt includes a "Wish" system where users can request items they need, and owners can pitch offers to fulfill them. It also features a robust live auction engine that automatically sells high-demand items to the highest bidder when the timer runs out.

## 3-minute technical explanation
Technically, RentIt is a client-server web application using the MERN stack (MongoDB, Express, React, Node.js). 

The frontend is a single-page application (SPA) built with React and Vite. It heavily utilizes local storage for caching (like themes and JWTs) and custom browser events to decouple components—for example, opening the global `DesktopChatbox` from anywhere in the app without complex prop drilling.

The backend is an Express REST API connected to a MongoDB database via Mongoose. It uses a robust document schema design. The most complex data structure is the `Transaction` model, which acts as a state machine moving from `PENDING_NEGOTIATION` all the way to `SETTLED` or `DISPUTED`. 

Real-time capabilities are powered by two main technologies:
1. **Socket.io**: Used primarily for the live auction bidding system to broadcast price changes to all connected clients instantly.
2. **Polling**: The chat system currently uses a 4-second API polling mechanism rather than WebSockets, pulling messages for the active transaction.

Background tasks are managed by **Agenda**, a MongoDB-backed job scheduler. This is critical for the auction system—when an auction starts, Agenda schedules a job to close the auction at the exact end time. This job executes atomically to prevent race conditions during the final milliseconds of bidding.

### What problem does RentIt solve?
It reduces waste and overconsumption by making it easy and safe to share items locally. It solves the trust issue inherent in P2P marketplaces by using OTP verifications for item handoffs, escrow payments, and a reputation scoring system.

### Who are the users?
- **Owners (Lenders/Sellers)**: People looking to monetize their underutilized assets.
- **Borrowers (Buyers)**: People who need an item temporarily and want to save money compared to buying new.
- **Admins**: Platform operators who resolve disputes, review fraud flags, and monitor metrics.

### What actions can a user perform?
- Create, edit, and delete product listings.
- Browse items based on distance (using Google Maps geocoding and MongoDB geospatial indexes).
- Request to rent an item or buy it outright.
- Negotiate prices in real-time.
- Place bids on live auctions.
- Post "Wishes" for items they need.
- Complete physical handoffs using OTPs.
- File dispute claims for damaged items.
- Chat with an AI assistant (RentBot) for help.

### What marketplace models exist?
1. **Fixed-Price Rental**: Standard daily rate rental.
2. **Negotiated Rental**: Parties haggle the rate down.
3. **Second-Hand Sale**: Direct purchase of a used item.
4. **Live Auction**: Competitive bidding with a reserve price and countdown timer.
5. **Reverse Market (Wishes)**: Buyers post a need, sellers bid to fulfill it.

### What makes this more than a basic CRUD application?
The **Transaction State Machine**. A basic CRUD app just creates a record and reads it. In RentIt, a transaction involves multi-step validation: Request -> Negotiate -> Accept -> Pay -> Generate Handoff OTP -> Meet & Verify OTP -> Possess -> Generate Return OTP -> Meet & Verify Return -> Settle Escrow. 

### What are the most technically complex systems?
1. **The Live Auction Engine**: Handling concurrent bids, preventing race conditions via optimistic locking (Mongoose version keys), and ensuring exact-time settlement via Agenda.
2. **The Negotiation & Chat System**: Merging the concept of a "Rental Request" and a "Chat Room" into a single UI flow.
3. **The Escrow & Dispute Logic**: Admin panels that allow splitting funds dynamically based on damage evidence.
