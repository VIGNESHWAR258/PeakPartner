# PeakPartner

A full-stack mobile-first web application that bridges the gap between gym trainers and clients, featuring workout planning, diet management, session booking, progress tracking, and assessments.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Spring Boot 3.2.0 (Java 23) with Maven |
| **Frontend** | React 19 with TypeScript + Vite 7.3 |
| **UI Framework** | Tailwind CSS v4 |
| **Database** | PostgreSQL 17+ |
| **Migrations** | Flyway |
| **Auth** | JWT with Spring Security |
| **PWA** | Service worker for installable mobile-first experience |

## ✨ Key Features

### For Trainers
- **Client Management**: Manage multiple clients with customized programs (GENERAL_FITNESS, WEIGHT_LOSS, MUSCLE_BUILDING, etc.)
- **Workout Planning**: Create detailed workout plans with day-by-day exercises, sets, reps, and weight suggestions
- **Diet Planning**: Design meal plans with per-meal items, macros, and calorie targets
- **Plan Lifecycle**: Draft → Active → Completed/Cancelled with overlap detection
- **Availability Management**: Set recurring weekly time slots for sessions
- **Session Booking**: Schedule in-person or virtual sessions with clients
- **Session Management**: Cancel with reason, reschedule with approval workflow
- **Assessments**: Create multi-question assessments (text, single/multi-choice, scale) for clients
- **Client Daily Logs**: View plan vs actual comparison for exercises and meals with compliance tracking
- **Meal Verification**: Verify client meal photo uploads

### For Clients
- **Trainer Discovery**: Browse and connect with trainers by specialization
- **Plan-Based Exercise Logging**: Log exercises directly from active workout plan with pre-filled sets/reps
- **Plan-Based Meal Logging**: Log meals from diet plan with required photo upload and compliance status
- **Session Booking**: Book available trainer time slots
- **Session Actions**: Request reschedule or cancel with reason
- **Contact Trainer**: Quick call, WhatsApp, or email buttons for connected trainers
- **Assessments**: Complete trainer-assigned assessments
- **Profile Management**: Edit personal details, fitness goals, and contact info

## 🏗️ Project Structure

```
PeakPartner/
├── backend/                   # Spring Boot backend
│   ├── src/main/java/com/peakpartner/
│   │   ├── auth/              # Authentication (JWT, filters, login/signup)
│   │   ├── profile/           # User profiles (TRAINER/CLIENT)
│   │   ├── availability/      # Trainer availability slots
│   │   ├── connection/        # Trainer-client connections
│   │   ├── session/           # Session bookings & rescheduling
│   │   ├── plan/              # Workout plans, diet plans, exercise & meal logs
│   │   ├── assessment/        # Client assessments
│   │   ├── config/            # CORS, Security, Supabase config
│   │   └── common/            # DTOs, exception handling
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/      # Flyway migrations (V1-V5)
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # ProtectedRoute
│   │   ├── hooks/             # useAuth
│   │   ├── pages/
│   │   │   ├── auth/          # LoginPage, SignUpPage
│   │   │   ├── trainer/       # Dashboard, Connections, ClientManage, ProfileEdit
│   │   │   └── client/        # Dashboard, Connections, DailyLog, Plans,
│   │   │                      #   ProfileEdit, TrainerDiscovery
│   │   ├── services/          # API client, Supabase client
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── public/                # PWA manifest & service worker
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

## 🛠️ Setup & Installation

### Prerequisites
- Java 23 (required for Lombok 1.18.36 compatibility — Java 25 breaks it)
- Node.js 20+
- Maven 3.9+
- PostgreSQL 17+

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/VIGNESHWAR258/PeakPartner.git
   cd PeakPartner
   ```

2. **Create database**
   ```bash
   psql -h localhost -U postgres -c "CREATE DATABASE peakpartner;"
   ```

3. **Run with Maven**
   ```bash
   cd backend
   JAVA_HOME=/path/to/openjdk-23 mvn spring-boot:run \
     -Dspring-boot.run.jvmArguments="-DDATABASE_URL=jdbc:postgresql://localhost:5432/peakpartner -DDATABASE_USERNAME=postgres -DDATABASE_PASSWORD=postgres"
   ```

   The backend will be available at `http://localhost:8080` (API base path: `/api`)

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Run development server**
   ```bash
   VITE_API_URL=http://localhost:8080/api npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Docker Setup

```bash
docker-compose up -d    # Start all services
docker-compose down     # Stop services
```

## 📊 Database Schema

PostgreSQL with Flyway migrations (V1–V5). Key tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles for trainers and clients |
| `connections` | Trainer-client relationships with program type |
| `trainer_availability` | Weekly time slot management |
| `session_bookings` | Session scheduling (in-person/virtual) |
| `reschedule_requests` | Session reschedule approval workflow |
| `workout_plans` | Workout plan structure with status lifecycle |
| `plan_days` / `plan_exercises` | Day-by-day workout breakdown with exercises |
| `exercise_logs` | Exercise tracking with PR detection |
| `diet_plans` / `diet_plan_meals` / `diet_meal_items` | Meal planning with macros |
| `meal_logs` | Meal compliance tracking with photo uploads |
| `assessments` | Multi-question client assessments |

PostgreSQL enum types are used for roles, statuses, and categories.
Migrations are located in `backend/src/main/resources/db/migration/`

## 🔐 Authentication

JWT-based authentication with Spring Security:

1. Users sign up via `POST /api/auth/signup` with role (TRAINER/CLIENT)
2. Login via `POST /api/auth/login` returns a JWT access token
3. Include token in `Authorization: Bearer <token>` header for protected endpoints
4. Backend `JwtAuthFilter` validates token and sets `Profile` as authentication principal

## 📡 Key API Endpoints

**Authentication**
- `POST /api/auth/signup` — Register new user
- `POST /api/auth/login` — User login

**Profiles**
- `GET /api/profiles/me` — Get current user profile
- `PUT /api/profiles/me` — Update profile
- `GET /api/profiles/trainers` — List trainers (for discovery)

**Connections**
- `POST /api/connections` — Send connection request
- `GET /api/connections` — List connections (filterable by status)
- `PUT /api/connections/{id}/accept` — Accept connection

**Sessions**
- `POST /api/sessions` — Book a session
- `GET /api/sessions` — List sessions
- `GET /api/sessions/upcoming` — Next upcoming session
- `GET /api/sessions/upcoming-list` — All upcoming sessions
- `PUT /api/sessions/{id}/cancel` — Cancel with reason
- `POST /api/sessions/{id}/reschedule` — Request reschedule

**Workout Plans**
- `POST /api/plans/workout` — Create workout plan
- `GET /api/plans/workout?connectionId=` — List workout plans
- `PUT /api/plans/workout/{id}/activate` — Activate plan

**Diet Plans**
- `POST /api/plans/diet` — Create diet plan
- `GET /api/plans/diet?connectionId=` — List diet plans
- `PUT /api/plans/diet/{id}/activate` — Activate plan

**Exercise & Meal Logs**
- `POST /api/plans/exercise-logs` — Log exercise
- `GET /api/plans/exercise-logs?connectionId=&date=` — Get exercise logs
- `POST /api/plans/meal-logs` — Log meal (with photo)
- `GET /api/plans/meal-logs?connectionId=&date=` — Get meal logs
- `PUT /api/plans/meal-logs/{id}/verify` — Trainer verify meal

**Assessments**
- `POST /api/assessments` — Create assessment
- `GET /api/assessments` — List assessments
- `PUT /api/assessments/{id}/submit` — Client submit answers
- `PUT /api/assessments/{id}/review` — Trainer review

## 🎨 UI Design

Mobile-first approach with custom design system:

- **Gradient Header**: Deep blue-to-teal gradient (`gradient-bg`)
- **Card Layout**: Clean card-based sections (`card`)
- **Tags**: Color-coded status tags (`tag-green`, `tag-blue`, `tag-orange`)
- **Buttons**: Primary gradient buttons (`btn-primary`)
- **Responsive**: Optimized for mobile screens
- **PWA**: Installable as a mobile app

## 🧪 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Trainer | mike@trainer.com | Trainer123! |
| Client | sarah@client.com | Client123! |

## 🚀 Deployment

### Backend
```bash
cd backend
mvn clean package -DskipTests
java -jar target/*.jar
```

### Frontend
```bash
cd frontend
npm run build
# Deploy dist/ to static hosting (Vercel, Netlify, etc.)
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL JDBC URL |
| `DATABASE_USERNAME` | Database username |
| `DATABASE_PASSWORD` | Database password |
| `VITE_API_URL` | Backend API URL (frontend) |

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

**VIGNESHWAR258**

---

**Built with ❤️ for fitness enthusiasts and trainers everywhere**
