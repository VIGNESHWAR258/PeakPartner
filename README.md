# PeakPartner

A full-stack mobile-first web application that bridges the gap between gym trainers and clients, featuring workout planning, diet management, progress tracking, and real-time communication.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Spring Boot 3.x (Java 17+) with Maven |
| **Frontend** | React 18+ with TypeScript + Vite |
| **UI Framework** | Tailwind CSS + shadcn/ui components |
| **Database** | PostgreSQL (Supabase compatible) |
| **Real-time Chat** | Supabase Realtime |
| **Auth** | JWT with Spring Security |
| **State Management** | TanStack Query (React Query) |
| **PWA** | Service worker for installable mobile-first experience |

## ✨ Key Features

### For Trainers
- **Client Management**: Manage multiple clients with customized programs
- **Workout Planning**: Create detailed weekly/monthly workout plans
- **Diet Planning**: Design comprehensive meal plans with macro tracking
- **Availability Management**: Set recurring and one-time availability slots
- **Progress Monitoring**: Track client progress, PRs, and compliance
- **Session Booking**: Schedule and manage in-person or virtual sessions
- **Real-time Chat**: Communicate with clients instantly

### For Clients
- **Trainer Discovery**: Browse and filter trainers by specialization
- **Workout Tracking**: Log exercises with automatic PR detection
- **Meal Logging**: Track daily meals with compliance status
- **Progress Photos**: Upload and compare before/after photos
- **Body Measurements**: Record and track body metrics over time
- **Session Booking**: Book available trainer slots
- **Review System**: Rate and review trainers
- **Real-time Chat**: Stay connected with your trainer

## 🏗️ Project Structure

```
PeakPartner/
├── backend/                 # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/peakpartner/
│   │   │   │   ├── auth/            # Authentication & JWT
│   │   │   │   ├── profile/         # User profiles
│   │   │   │   ├── availability/    # Trainer availability
│   │   │   │   ├── connection/      # Trainer-client connections
│   │   │   │   ├── chat/            # Messaging
│   │   │   │   ├── plan/            # Workout plans
│   │   │   │   ├── exercise/        # Exercise logging
│   │   │   │   ├── diet/            # Diet plans
│   │   │   │   ├── booking/         # Session bookings
│   │   │   │   ├── review/          # Trainer reviews
│   │   │   │   ├── progress/        # Progress tracking
│   │   │   │   ├── notification/    # Notifications
│   │   │   │   ├── dashboard/       # Dashboards
│   │   │   │   ├── config/          # Configuration
│   │   │   │   └── common/          # Common utilities
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/    # Flyway migrations
│   │   └── test/
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── layout/          # Layout components
│   │   │   ├── auth/            # Auth components
│   │   │   ├── chat/            # Chat components
│   │   │   ├── plan/            # Plan components
│   │   │   ├── diet/            # Diet components
│   │   │   ├── progress/        # Progress components
│   │   │   └── common/          # Common components
│   │   ├── pages/
│   │   │   ├── auth/            # Login, Signup
│   │   │   ├── trainer/         # Trainer pages
│   │   │   ├── client/          # Client pages
│   │   │   ├── chat/            # Chat page
│   │   │   └── profile/         # Profile page
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API services
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Utility functions
│   │   └── store/               # State management
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

## 🛠️ Setup & Installation

### Prerequisites
- Java 17+
- Node.js 20+
- Maven 3.9+
- PostgreSQL 15+ (or Docker)
- Supabase account (for realtime features, optional)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/VIGNESHWAR258/PeakPartner.git
   cd PeakPartner
   ```

2. **Configure environment variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database and Supabase credentials
   ```

3. **Run with Maven**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

   The backend will be available at `http://localhost:8080`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL and Supabase credentials
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Docker Setup (Recommended)

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Backend API on port 8080
   - Frontend app on port 5173

2. **Stop services**
   ```bash
   docker-compose down
   ```

## 📊 Database Schema

The application uses PostgreSQL with Flyway migrations. Key tables include:

- **profiles**: User profiles for trainers and clients
- **trainer_availability**: Trainer time slot management
- **connections**: Trainer-client relationships
- **workout_plans**: Workout plan structure
- **exercise_logs**: Exercise tracking with PR detection
- **diet_plans**: Meal planning with macros
- **meal_logs**: Meal compliance tracking
- **session_bookings**: Session scheduling
- **trainer_reviews**: Rating and review system
- **progress_photos**: Progress photo tracking
- **body_measurements**: Body metric tracking
- **notifications**: In-app notifications

Migrations are located in `backend/src/main/resources/db/migration/`

## 🔐 Authentication

The application uses JWT-based authentication with Spring Security:

1. Users sign up with email and role (TRAINER/CLIENT)
2. Login returns an access token
3. Token must be included in Authorization header for protected endpoints
4. Refresh token endpoint available for token renewal

## 📡 API Documentation

Once the backend is running, access the Swagger UI at:
```
http://localhost:8080/api/swagger-ui.html
```

### Key Endpoints

**Authentication**
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

**Profiles**
- `GET /api/profiles/me` - Get current user profile
- `PUT /api/profiles/me` - Update profile
- `GET /api/profiles/trainers` - List trainers

**Workout Plans**
- `POST /api/plans` - Create workout plan
- `GET /api/plans` - List plans
- `GET /api/plans/{id}` - Get plan details
- `PUT /api/plans/{id}/activate` - Activate plan

**Exercise Logs**
- `POST /api/exercise-logs` - Log exercise
- `GET /api/exercise-logs/prs` - Get personal records

**Diet Plans**
- `POST /api/diet-plans` - Create diet plan
- `GET /api/diet-plans` - List diet plans

**Session Bookings**
- `POST /api/bookings` - Book session
- `GET /api/bookings` - List bookings

*(Full API documentation available in Swagger UI)*

## 🎨 UI Design

The application follows a mobile-first approach with:

- **Color Scheme**: Deep blue to vibrant teal gradient (primary), energetic orange (accent)
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Dark Mode**: Full dark mode support
- **Animations**: Smooth transitions and micro-interactions
- **Components**: Card-based layouts with shadcn/ui components
- **Navigation**: Bottom tab bar for mobile users

## 🧪 Testing

### Backend Tests
```bash
cd backend
mvn test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment

1. Build JAR file:
   ```bash
   mvn clean package
   ```

2. Deploy JAR to your server or cloud platform

### Frontend Deployment

1. Build for production:
   ```bash
   npm run build
   ```

2. Deploy `dist/` folder to your static hosting service (Vercel, Netlify, etc.)

### Environment Variables for Production

Ensure all production environment variables are properly set:
- Database credentials
- JWT secret (256-bit key)
- Supabase credentials
- CORS allowed origins

## 📝 Development Guidelines

- **Backend**: Follow Spring Boot best practices, use DTOs for API responses
- **Frontend**: Use TypeScript strictly, leverage React Query for data fetching
- **Code Style**: Use Prettier for frontend, checkstyle for backend
- **Commits**: Write descriptive commit messages
- **Pull Requests**: Include tests and documentation updates

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

**VIGNESHWAR258**

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- React team for the powerful UI library
- Supabase for real-time capabilities
- shadcn/ui for beautiful components

---

**Built with ❤️ for fitness enthusiasts and trainers everywhere**
