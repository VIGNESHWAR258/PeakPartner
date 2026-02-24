-- V7: Database-level constraints to prevent race conditions under concurrent access

-- 1. Prevent duplicate PENDING/ACCEPTED connections between the same client-trainer pair.
--    Without this, two rapid clicks can create duplicate connections because the
--    application-level check (existsBy...) and save() are not atomic.
CREATE UNIQUE INDEX IF NOT EXISTS uq_connection_client_trainer_active
    ON connections (client_id, trainer_id)
    WHERE status IN ('PENDING', 'ACCEPTED');

-- 2. Enable btree_gist extension for exclusion constraints on time ranges.
--    This is available on Supabase by default.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 3. Immutable helper: builds a tsrange from date + start/end time.
--    Required because index expressions must be IMMUTABLE.
CREATE OR REPLACE FUNCTION session_tsrange(d date, st time, et time)
RETURNS tsrange AS $$
  SELECT tsrange(d + st, d + et, '[)');
$$ LANGUAGE sql IMMUTABLE STRICT;

-- 4. Prevent overlapping BOOKED sessions for the same trainer.
--    Two concurrent booking requests can both pass the application-level overlap
--    check before either commits. This DB constraint catches the second insert.
ALTER TABLE session_bookings
    ADD CONSTRAINT no_trainer_overlap
    EXCLUDE USING gist (
        trainer_id WITH =,
        session_tsrange(session_date, start_time, end_time) WITH &&
    )
    WHERE (status = 'BOOKED');

-- 5. Prevent overlapping BOOKED sessions for the same client.
ALTER TABLE session_bookings
    ADD CONSTRAINT no_client_overlap
    EXCLUDE USING gist (
        client_id WITH =,
        session_tsrange(session_date, start_time, end_time) WITH &&
    )
    WHERE (status = 'BOOKED');
