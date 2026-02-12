-- Initial schema for PeakPartner
-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    role VARCHAR(10) NOT NULL CHECK (role IN ('TRAINER', 'CLIENT')),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    specializations TEXT[],
    experience_years INTEGER,
    certifications TEXT[],
    fitness_goals TEXT[],
    avg_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRAINER AVAILABILITY
CREATE TABLE trainer_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    specific_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONNECTIONS
CREATE TYPE connection_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');
CREATE TYPE program_type AS ENUM ('FAT_LOSS', 'MUSCLE_GAIN', 'STRENGTH_TRAINING', 'GENERAL_FITNESS', 'FLEXIBILITY', 'CUSTOM');

CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status connection_status DEFAULT 'PENDING',
    program program_type NOT NULL,
    notes TEXT,
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONVERSATIONS & MESSAGES
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(connection_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WORKOUT PLANS
CREATE TYPE plan_duration AS ENUM ('WEEKLY', 'MONTHLY', 'CUSTOM');
CREATE TYPE plan_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

CREATE TABLE workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    program program_type NOT NULL,
    duration plan_duration NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status plan_status DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    day_name VARCHAR(20),
    focus_area VARCHAR(100),
    notes TEXT
);

CREATE TABLE plan_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_day_id UUID NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
    exercise_name VARCHAR(200) NOT NULL,
    sets INTEGER,
    reps VARCHAR(50),
    weight_suggestion VARCHAR(50),
    rest_seconds INTEGER,
    notes TEXT,
    sort_order INTEGER DEFAULT 0
);

-- EXERCISE LOGS
CREATE TABLE exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    plan_exercise_id UUID REFERENCES plan_exercises(id) ON DELETE SET NULL,
    logged_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_name VARCHAR(200) NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sets_completed INTEGER,
    reps_completed INTEGER,
    weight_used DECIMAL(10,2),
    weight_unit VARCHAR(5) DEFAULT 'kg',
    duration_seconds INTEGER,
    is_pr BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DIET PLANS
CREATE TYPE diet_plan_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

CREATE TABLE diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    daily_calorie_target INTEGER,
    protein_grams INTEGER,
    carbs_grams INTEGER,
    fat_grams INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status diet_plan_status DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE diet_plan_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    meal_name VARCHAR(100) NOT NULL,
    meal_time TIME,
    sort_order INTEGER DEFAULT 0,
    notes TEXT
);

CREATE TABLE diet_meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diet_meal_id UUID NOT NULL REFERENCES diet_plan_meals(id) ON DELETE CASCADE,
    food_name VARCHAR(200) NOT NULL,
    quantity VARCHAR(50),
    calories INTEGER,
    protein_grams DECIMAL(5,1),
    carbs_grams DECIMAL(5,1),
    fat_grams DECIMAL(5,1),
    alternatives TEXT,
    sort_order INTEGER DEFAULT 0
);

-- MEAL LOGS
CREATE TYPE meal_compliance AS ENUM ('ON_PLAN', 'PARTIAL', 'OFF_PLAN', 'SKIPPED');

CREATE TABLE meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    diet_meal_id UUID REFERENCES diet_plan_meals(id) ON DELETE SET NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_name VARCHAR(100) NOT NULL,
    compliance meal_compliance DEFAULT 'ON_PLAN',
    photo_url TEXT,
    items_consumed TEXT,
    estimated_calories INTEGER,
    protein_grams DECIMAL(5,1),
    carbs_grams DECIMAL(5,1),
    fat_grams DECIMAL(5,1),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRAINER REVIEWS
CREATE TABLE trainer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(connection_id)
);

-- SESSION BOOKINGS
CREATE TYPE booking_status AS ENUM ('BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE session_type AS ENUM ('IN_PERSON', 'VIRTUAL');

CREATE TABLE session_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    availability_slot_id UUID REFERENCES trainer_availability(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_type session_type DEFAULT 'IN_PERSON',
    status booking_status DEFAULT 'BOOKED',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROGRESS PHOTOS
CREATE TYPE photo_category AS ENUM ('FRONT', 'BACK', 'SIDE_LEFT', 'SIDE_RIGHT', 'CUSTOM');

CREATE TABLE progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    category photo_category DEFAULT 'CUSTOM',
    caption TEXT,
    taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
    body_weight DECIMAL(5,2),
    weight_unit VARCHAR(5) DEFAULT 'kg',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BODY MEASUREMENTS
CREATE TABLE body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
    measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
    body_weight DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,1),
    chest DECIMAL(5,1),
    waist DECIMAL(5,1),
    hips DECIMAL(5,1),
    bicep_left DECIMAL(5,1),
    bicep_right DECIMAL(5,1),
    thigh_left DECIMAL(5,1),
    thigh_right DECIMAL(5,1),
    unit VARCHAR(5) DEFAULT 'cm',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    type VARCHAR(50) NOT NULL,
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALL INDEXES
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_availability_trainer ON trainer_availability(trainer_id);
CREATE INDEX idx_availability_day ON trainer_availability(day_of_week, is_active);
CREATE INDEX idx_connections_client ON connections(client_id);
CREATE INDEX idx_connections_trainer ON connections(trainer_id);
CREATE INDEX idx_connections_status ON connections(status);
CREATE INDEX idx_conversations_connection ON conversations(connection_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_workout_plans_connection ON workout_plans(connection_id);
CREATE INDEX idx_workout_plans_client ON workout_plans(client_id);
CREATE INDEX idx_workout_plans_trainer ON workout_plans(trainer_id);
CREATE INDEX idx_plan_days_plan ON plan_days(plan_id);
CREATE INDEX idx_plan_exercises_day ON plan_exercises(plan_day_id);
CREATE INDEX idx_exercise_logs_connection ON exercise_logs(connection_id);
CREATE INDEX idx_exercise_logs_date ON exercise_logs(log_date);
CREATE INDEX idx_exercise_logs_exercise ON exercise_logs(exercise_name);
CREATE INDEX idx_diet_plans_connection ON diet_plans(connection_id);
CREATE INDEX idx_diet_plan_meals_plan ON diet_plan_meals(diet_plan_id);
CREATE INDEX idx_diet_meal_items_meal ON diet_meal_items(diet_meal_id);
CREATE INDEX idx_meal_logs_client ON meal_logs(client_id, log_date);
CREATE INDEX idx_meal_logs_connection ON meal_logs(connection_id, log_date);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_reviews_trainer ON trainer_reviews(trainer_id);
CREATE INDEX idx_reviews_client ON trainer_reviews(client_id);
CREATE INDEX idx_bookings_trainer ON session_bookings(trainer_id, session_date);
CREATE INDEX idx_bookings_client ON session_bookings(client_id, session_date);
CREATE INDEX idx_progress_photos_client ON progress_photos(client_id, taken_at);
CREATE INDEX idx_body_measurements_client ON body_measurements(client_id, measured_at);
