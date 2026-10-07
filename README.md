# UniRegister (hfrs-) - Unified Freshers Registration System

UniRegister is a production-ready, full-stack web application designed for **UNICROSS (University of Cross River State)** to automate and streamline the registration process for newly admitted freshers. Built in strict accordance with the project specification (Chapters 1–3: Waterfall methodology, use case diagram, existing/proposed system flowcharts, high-level model).

---

## 🛠️ Tech Stack & Key Constraints

- **Backend Architecture**: Pure Node.js + Express.js with a dedicated business logic engine (`engine/hfrsEngine.js`).
- **Templating & Partials**: EJS with standard modular partials (`header.ejs`, `footer.ejs`, `navbar.ejs`, `sidebar.ejs`).
- **Design System**: 100% Solid Flat CSS Design System (`public/css/hfrs-style.css`) with custom `hfrs-*` CSS class prefixing. **Zero gradients** used per permanent UI constraints. Typography powered by Google's Inter font.
- **Database & Storage**: MySQL with parameterized queries via `mysql2/promise`. Document files uploaded via `multer` to physical disk volume (`uploads/`) with DB path references.
- **Authentication & Authorization**: `express-session` + `bcryptjs` password hashing. Strict role-based route access controls.
- **API Separation**: HTML page rendering routes (`routes/pages/*.js`) and JSON API endpoints (`routes/api/*.js`) are kept strictly separated.
- **Simulated Payment Gateway**: Built-in simulated payment flow (clearly labeled) to generate unique payment references and manage payment status transitions without external dependencies.

---

## 🔑 Default Test Credentials

| Role | Email | Password | Status / Access |
|---|---|---|---|
| **Administrator** | `admin@unicross.edu.ng` | `password123` | Full Admin Panel, Pending Queue, Payment Gate, Reports, CSV Export |
| **Fresher Student (Jane)** | `jane.smith@student.unicross.edu.ng` | `password123` | Pending Verification (Payment Confirmed) |
| **Fresher Student (Michael)** | `michael.j@student.unicross.edu.ng` | `password123` | Pending Verification (Payment Pending) |
| **Fresher Student (Sarah)** | `sarah.w@student.unicross.edu.ng` | `password123` | Fully Approved Fresher |
| **Fresher Student (David)** | `david.o@student.unicross.edu.ng` | `password123` | Rejected Application with Reason |

---

## 🚀 Quick Setup & Execution

### Option A: Running with Docker Compose (Recommended)

1. Clone or navigate to the repository directory.
2. Build and launch the containerized application and MySQL database:
   ```bash
   docker-compose up --build
   ```
3. Access the application in your browser:
   `http://localhost:3000`

---

### Option B: Local Node.js Execution

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Ensure `.env` contains your MySQL database credentials:
   ```env
   PORT=3000
   SESSION_SECRET=unicross_hfrs_secret_key_2026_super_secure
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=unicross_hfrs_db
   DB_PORT=3306
   ```

3. **Initialize Database Schema & Seed Data**:
   You can seed the database directly via npm:
   ```bash
   npm run seed
   ```
   *Or manually via MySQL CLI:*
   ```bash
   mysql -u root -p < schema.sql
   mysql -u root -p < seed.sql
   ```

4. **Start the Application**:
   ```bash
   npm start
   # or development mode with watch:
   npm run dev
   ```

---

## 🏛️ Project Directory Architecture

```
Freshers Registration System/
├── app.js                   # Main Express application initialization & middleware
├── Dockerfile               # Container setup
├── docker-compose.yml       # Docker Compose for MySQL + Node app
├── package.json             # Dependencies & scripts
├── schema.sql               # Normalized MySQL database schema definition
├── seed.sql                 # Sample users & registrations seed data
├── .env.example             # Template environment variables
├── .env                     # Local environment configuration
├── config/
│   └── database.js          # mysql2 connection pool with parameterized query helper
├── engine/
│   └── hfrsEngine.js        # Core Business Logic Engine (workflow transitions, payment simulation, validation)
├── middleware/
│   ├── authMiddleware.js    # Session & role-based authentication check
│   └── uploadMiddleware.js  # Multer configuration for file size (5MB) & type validation
├── routes/
│   ├── api/                 # Pure JSON REST API routes
│   │   ├── authApi.js
│   │   ├── studentApi.js
│   │   ├── adminApi.js
│   │   └── reportsApi.js
│   └── pages/               # Page rendering routes
│       ├── authPages.js
│       ├── studentPages.js
│       └── adminPages.js
├── public/
│   ├── css/
│   │   └── hfrs-style.css   # Solid Flat CSS design system (hfrs-* prefix, zero gradients)
│   └── js/                  # Frontend interactive scripts
│       ├── auth.js
│       ├── student.js
│       └── admin.js
├── uploads/                 # File storage location for uploaded student credentials
└── views/
    ├── partials/            # Reusable header, footer, navbar, sidebar templates
    ├── pages/               # Page EJS templates (login, register, dashboards, tracking, verification, reports)
    ├── 404.ejs
    └── 500.ejs
```

---

## ⚙️ Core Business Logic & Workflow Rules

1. **Duplicate Registration Prevention**: The system enforces uniqueness checks on student full name + date of birth, email, and application number at account creation and profile saving to prevent duplicate student entries.
2. **Server-Enforced Payment Gate**: An application in the admin queue **cannot** be marked as `approved` until the payment status is explicitly set to `confirmed` by an administrator (`hfrsEngine.js`). Attempting to approve an application with unconfirmed payment raises a server error (`PAYMENT_UNCONFIRMED`).
3. **Real-Time Registration Tracking**: The student dashboard polls the status endpoint (`/api/student/status`) and updates live badges upon state transitions (`pending_verification` -> `approved` / `rejected`).
4. **CSV Data Export**: Administrators can export student registration statistics and details directly into CSV format.
