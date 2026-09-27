# Insurance Policy Management Service

A Node.js, Express & MongoDB REST API for insurance policy management, asynchronous worker thread file imports, and scheduled notifications.

## Features

- **File Import via Worker Threads:** Ingests `.csv` and `.xlsx` files using Node.js `worker_threads` without blocking the main event loop.
- **Idempotent Imports:** Uses MongoDB upserts so re-uploading the same file does not create duplicate records; tracks `addedRows` and `skippedRows`.
- **6 Separate Collections:** Maps data into `agents`, `users`, `useraccounts`, `policycategories`, `policycarriers`, and `policies`.
- **Policy Search:** Search policies by username / first name or email (supports both full and paginated results).
- **Policy Aggregation:** Groups and counts policies by user.
- **Scheduled Messages:** Schedules messages via POST endpoint and writes them to the database at the specified date and time.
- **CPU Monitoring & Auto-Restart:** Continuously monitors CPU usage; restarts the server via PM2 when utilization hits 70%.

---

## Tech Stack

- **Runtime:** Node.js version 22+ (ES Modules)
- **Framework:** Express 5
- **Database:** MongoDB (Local or MongoDB Atlas) via Mongoose 8
- **Concurrency:** Node.js Worker Threads
- **File Upload:** Multer, XLSX, csv-parser
- **Process Manager:** PM2
- **Linter & Formatter:** ESLint 9 & Prettier

---

## Getting Started

### 1. Prerequisites

- Node.js version 22+ installed
- MongoDB running locally on port 27017 (or MongoDB Atlas connection string)

### 2. Installation

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
# macOS / Linux / PowerShell:
cp .env.example .env

# Windows Command Prompt:
copy .env.example .env
```

Verify your `.env` settings:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/insurance_assessment
CPU_THRESHOLD=70
CPU_CHECK_INTERVAL=5000
UPLOAD_DIR=uploads
```

### 4. Running the Server

**Development mode (auto-reload on file save):**

```bash
npm run dev
```

**Standard start:**

```bash
npm start
```

**Supervised mode with PM2 (recommended for CPU restart testing):**

```bash
npm run pm2:start
npx pm2 status
npx pm2 logs insurance-assessment
npm run pm2:stop
```

> **Note:** Run one mode at a time. If switching between `npm run dev` and PM2, ensure the other is stopped (`npm run pm2:stop` or `Ctrl + C`) to avoid port 5000 conflicts.


### 5. Linting & Formatting

```bash
npm run lint          # Run ESLint checks
npm run lint:fix      # Auto-fix lint issues
npm run format:check  # Check formatting
npm run format        # Format files with Prettier
```

---

## API Endpoints

Base URL: `http://localhost:5000` (or `http://127.0.0.1:5000`)

> **Tip for Evaluators:**
>
> - You can copy and paste any `curl` command below directly into **Postman** via **Import → Raw text**.
> - In Windows PowerShell, use `curl.exe` if default `curl` is aliased.

### 1. Health Check

```http
GET /api/v1/health
```

**cURL:**

```bash
curl http://localhost:5000/api/v1/health
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 12.34,
    "timestamp": "2026-09-26T18:30:00.000+05:30"
  }
}
```

---

### 2. Upload CSV / XLSX (Worker Threads)

Uploads a policy data file (`.csv`, `.xlsx`, or `.xls`). The server queues an import job and delegates parsing to a Worker Thread.

```http
POST /api/v1/import
Content-Type: multipart/form-data
```

- **Body (form-data):** `file` (File)

**cURL:**

```bash
curl -X POST -F "file=@data-sheet.csv" http://localhost:5000/api/v1/import
```

> _Replace `@data-sheet.csv` with the path to your `.csv` or `.xlsx` file._

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "jobId": "6ab759c443ebe375db9e05d0",
    "status": "queued",
    "message": "File accepted for processing. Check job status for progress."
  }
}
```

**Error (400 Bad Request - Invalid Extension):**

```json
{
  "success": false,
  "message": "Invalid file format. Only .csv, .xlsx, and .xls files are supported."
}
```

---

### 3. Check Import Status

Check the status of an ongoing or completed import job.

```http
GET /api/v1/import/:jobId
```

**cURL:**

```bash
curl http://localhost:5000/api/v1/import/6ab759c443ebe375db9e05d0
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "6ab759c443ebe375db9e05d0",
    "status": "completed",
    "fileName": "data-sheet.csv",
    "totalRows": 1198,
    "processedRows": 1198,
    "addedRows": 1198,
    "skippedRows": 0,
    "failedRows": 0,
    "createdAt": "2026-09-26T18:06:04.741+05:30",
    "updatedAt": "2026-09-26T18:07:48.274+05:30",
    "__v": 0
  }
}
```

_Note: If the same file is uploaded again, `addedRows` will be `0` and `skippedRows` will be `1198`, preventing duplicate entries._

---

### 4. Search Policy by Username

Searches policies by user's first name or email address. Returns policy info populated with user, carrier, and category details.

```http
GET /api/v1/policies/search?username=John
```

- **Query params:**
  - `username` (required): Name or email to search.
  - `page` (optional): Page number (e.g. `1`).
  - `limit` (optional): Items per page (e.g. `10`).

**cURL (Full Results):**

```bash
curl "http://localhost:5000/api/v1/policies/search?username=Minh"
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "policyNumber": "NITUPZRUVNKK",
      "policyStartDate": "2018-11-15",
      "policyEndDate": "2019-11-15",
      "user": {
        "_id": "6ab75b36cab84ee8969692b5",
        "firstName": "Minh Lovering",
        "email": "eidac@hotmail.com"
      },
      "policyCategory": "Commercial Package",
      "carrier": "Nationwide Mut Ins Co"
    }
  ]
}
```

**cURL (Paginated):**

```bash
curl "http://localhost:5000/api/v1/policies/search?username=Minh&page=1&limit=2"
```

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 2,
    "totalRecords": 3,
    "totalPages": 2
  },
  "data": [ ... ]
}
```

---

### 5. Aggregate Policies by User

Groups policies by each user and returns their total policy count and list of policies.

```http
GET /api/v1/policies/summary
```

- **Query params:**
  - `page` (optional): Page number.
  - `limit` (optional): Items per page.

**cURL (Paginated):**

```bash
curl "http://localhost:5000/api/v1/policies/summary?page=1&limit=5"
```

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 5,
    "totalRecords": 1149,
    "totalPages": 230
  },
  "data": [
    {
      "userId": "6ab75b36cab84ee8969692b5",
      "userName": "Minh Lovering",
      "email": "eidac@hotmail.com",
      "policyCount": 3,
      "policies": [
        {
          "policyNumber": "NITUPZRUVNKK",
          "policyStartDate": "2018-11-15",
          "policyEndDate": "2019-11-15",
          "policyCategoryId": "6ab75b34cab84ee896968bd1",
          "carrierId": "6ab75b33cab84ee896968bc1"
        }
      ]
    }
  ]
}
```

---

### 6. Schedule Message

Takes a message, day, and time, stores it in the database, and automatically inserts it into the `messages` collection when that specific day and time arrives.

```http
POST /api/v1/messages
Content-Type: application/json
```

**Request Body:**

```json
{
  "message": "Policy premium renewal notice",
  "day": "2026-09-26",
  "time": "12:30"
}
```

> **Note for testing:** Set `day` and `time` to a future time relative to your current local time (e.g., 1-2 minutes ahead) to observe the background worker automatically deliver the message.

**cURL:**

```bash
curl -X POST http://localhost:5000/api/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "Policy premium renewal notice", "day": "2026-09-26", "time": "12:30"}'
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "6ab76a38ce4a8c57b57dd401",
    "message": "Policy premium renewal notice",
    "scheduledAt": "2026-09-26T12:30:00.000+05:30",
    "status": "pending",
    "createdAt": "2026-09-26T12:00:00.000+05:30",
    "updatedAt": "2026-09-26T12:00:00.000+05:30",
    "__v": 0
  }
}
```

_A background worker checks every 5 seconds. Once the scheduled time is reached, it creates the message in `messages` and marks the schedule as `completed`._

#### View Delivered Messages:

```http
GET /api/v1/messages
```

**cURL:**

```bash
curl http://localhost:5000/api/v1/messages
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6ab76d20ce4a8c57b57dd405",
      "message": "Policy premium renewal notice",
      "scheduledMessageId": "6ab76a38ce4a8c57b57dd401",
      "postedAt": "2026-09-26T12:30:00.123+05:30",
      "createdAt": "2026-09-26T12:30:00.124+05:30",
      "updatedAt": "2026-09-26T12:30:00.124+05:30",
      "__v": 0
    }
  ]
}
```

---

## CPU Monitoring & Auto-Restart

The app samples CPU usage every 5 seconds using `os.cpus()`. When usage reaches the configured threshold (default 70%), the process sends a `SIGTERM` signal.

Under PM2 supervision, PM2 catches the exit and restarts the process automatically.

### How to test:

1. Temporarily set `CPU_THRESHOLD=10` in `.env`.
2. Start the app with PM2:
   ```bash
   npm run pm2:start
   ```
3. Watch the logs:
   ```bash
   npx pm2 logs insurance-assessment
   ```
   You will see:
   ```text
   [Monitor] CPU usage: 14.52% (limit: 10%)
   [Monitor] CPU threshold exceeded (14.52% >= 10%). Initiating restart for PM2 recovery...
   [Server] Service is online and listening at http://localhost:5000
   ```
4. Verify the restart count increased:
   ```bash
   npx pm2 status
   ```
5. Reset `CPU_THRESHOLD=70` in `.env` and stop PM2:
   ```bash
   npm run pm2:stop
   ```

---

## Database Collections

### Primary Collections:

- **`agents`**: Agent name.
- **`users`**: First name, DOB, address, phone number, state, zip code, email, gender, userType.
- **`useraccounts`**: Account name and userId reference.
- **`policycategories`**: Category / LOB name.
- **`policycarriers`**: Company name.
- **`policies`**: Policy number, start date, end date, policyCategoryId, carrierId, and userId.

### Supporting Collections:

- **`importjobs`**: File import status and progress metrics.
- **`scheduledmessages`**: Pending and processed message schedules.
- **`messages`**: Log of delivered messages.

---

## Project Structure

```text
insurance-policy-assessment/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── import.controller.js
│   │   ├── message.controller.js
│   │   └── policy.controller.js
│   ├── jobs/
│   │   ├── cpu-monitor.job.js
│   │   └── scheduled-message.job.js
│   ├── middleware/
│   │   ├── error.middleware.js
│   │   └── upload.middleware.js
│   ├── models/
│   │   ├── Agent.js
│   │   ├── ImportJob.js
│   │   ├── Message.js
│   │   ├── Policy.js
│   │   ├── PolicyCarrier.js
│   │   ├── PolicyCategory.js
│   │   ├── ScheduledMessage.js
│   │   ├── User.js
│   │   └── UserAccount.js
│   ├── repositories/
│   │   ├── import.repository.js
│   │   ├── message.repository.js
│   │   └── policy.repository.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── health.routes.js
│   │   ├── import.routes.js
│   │   ├── message.routes.js
│   │   └── policy.routes.js
│   ├── services/
│   │   ├── cpu.service.js
│   │   ├── import.service.js
│   │   ├── message.service.js
│   │   ├── policy.service.js
│   │   └── scheduled-message.service.js
│   ├── utils/
│   │   ├── app-error.js
│   │   ├── async-handler.js
│   │   ├── cpu.js
│   │   ├── date.js
│   │   ├── file.js
│   │   └── response.js
│   └── workers/
│       └── import.worker.js
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc
├── eslint.config.js
├── package-lock.json
├── package.json
└── README.md
```
