# Project Architecture

## For a Beginner
Imagine RentIt as a busy restaurant.
- **The Browser (Frontend)** is the customer looking at the menu and placing orders.
- **The API (Backend Server)** is the waiter who takes the order, checks if it's allowed, and passes it to the kitchen.
- **The Database (MongoDB)** is the kitchen where all the actual food (data) is stored and prepared.
- **Background Jobs (Agenda)** are the slow cookers in the back—tasks set to finish at a specific time without needing the waiter to stand there watching them.

## Technical Architecture

RentIt uses a **Client-Server Architecture** utilizing a **RESTful API**.
- **Frontend**: A component-based single-page application (SPA) built with React. It manages local UI state and communicates with the backend via asynchronous HTTP requests (Axios/fetch).
- **Backend**: A route-oriented Express.js server acting as a stateless REST API (except for JWT-based auth state). 
- **Database**: A NoSQL document database (MongoDB) accessed via Mongoose ORM. It enforces strict schemas at the application layer.
- **Event-Driven Components**: The frontend uses a native browser event bus (`window.dispatchEvent(new CustomEvent(...))`) for cross-component communication (e.g., opening a chatbox from anywhere).
- **Job Processing**: An asynchronous job queue (Agenda) backed by MongoDB for scheduled tasks.
- **Real-time Engine**: A WebSocket server (Socket.io) dedicated specifically to live auction synchronization.

## ASCII Architecture Diagram

```text
+-----------------------------------------------------------------------------+
|                               BROWSER (REACT)                               |
|                                                                             |
|  +----------------+   +-----------------+   +---------------------------+   |
|  |                |   |                 |   |                           |   |
|  |  UI Components |<--|  React State &  |<--|  Browser CustomEvents     |   |
|  |  (Pages/Views) |   |  Local Storage  |   |  (openChatbox, etc.)      |   |
|  |                |   |                 |   |                           |   |
|  +-------+--------+   +-----------------+   +---------------------------+   |
|          |                                                                  |
|          | HTTP REST (Axios/Fetch)                                          |
|          | + Polling (Chat)                 WebSocket (Socket.io)           |
+----------|----------------------------------------|-------------------------+
           v                                        v
+----------|----------------------------------------|-------------------------+
|          |                 EXPRESS BACKEND        |                         |
|          |                                        |                         |
|  +-------v--------+                       +-------v--------+                |
|  |                |                       |                |                |
|  | Auth Middleware|                       | Socket Server  |                |
|  | (JWT check)    |                       | (Auctions)     |                |
|  |                |                       |                |                |
|  +-------+--------+                       +----------------+                |
|          |                                                                  |
|          v                                                                  |
|  +----------------+      +-----------------+      +--------------------+    |
|  |                |      |                 |      |                    |    |
|  | Route Handlers |----->| External APIs   |      | Agenda Background  |    |
|  | (Controllers)  |      | (Gemini, Mail,  |      | Job Scheduler      |    |
|  |                |      |  Cloudinary)    |      |                    |    |
|  +-------+--------+      +-----------------+      +---------+----------+    |
|          |                                                  |               |
|          | Mongoose ORM                                     |               |
+----------|--------------------------------------------------|---------------+
           v                                                  v
+----------|--------------------------------------------------|---------------+
|          |                                                  |               |
|  +-------v--------------------------------------------------v--------+      |
|  |                                                                   |      |
|  |                       MONGODB DATABASE                            |      |
|  |     (Users, Products, Transactions, Auctions, agendaJobs)         |      |
|  |                                                                   |      |
|  +-------------------------------------------------------------------+      |
+-----------------------------------------------------------------------------+
```

## The Complete Request-Response Lifecycle
*Using the endpoint: `POST /api/rent/products` (Creating a new product listing)*

1. **User Action**: The user fills out the `PostProductModal` in the frontend and clicks "Post Item".
2. **Frontend Client**: React collects the state variables, appends them to a `FormData` object (including the images), and calls Axios.
3. **HTTP Request**: A `POST` request is dispatched to `http://localhost:5000/api/rent/products` containing the `FormData` and the `Authorization: Bearer <token>` header.
4. **Backend Router (`server.js`)**: The Express server receives the request and routes it to `/api/rent` -> `routes/rent.js`.
5. **Auth Middleware (`verifyToken`)**: The request hits the authentication middleware. It extracts the JWT, verifies the signature using `process.env.JWT_SECRET`, decodes the payload, and attaches `req.user = decoded`.
6. **Upload Middleware (`upload.array('images', 5)`)**: The request hits the Multer upload middleware, which parses the multipart form data and buffers the images in memory.
7. **Controller Logic**: The route handler in `rent.js` begins processing.
8. **External Service (Cloudinary)**: A `for...of` loop iterates over the buffered images, sending them to Cloudinary via `uploadToCloudinary()`. Cloudinary returns the hosted image URLs.
9. **Database Operation (Mongoose)**: A new `Product` document is instantiated with the form text fields, the `req.user.id` as the owner, and the Cloudinary URLs. `newProduct.save()` is called.
10. **MongoDB**: The document is inserted into the `products` collection. Geospatial indexing is updated if location data is provided.
11. **HTTP Response**: The controller responds with `res.status(201).json({ message: "Product created", product: newProduct })`.
12. **Frontend UI Update**: Axios resolves the Promise. The frontend closes the modal, triggers a success toast, and likely re-fetches the product catalog or updates local state to show the new item.
