-- Session cancel reason and cancelled_by
ALTER TABLE session_bookings ADD COLUMN cancel_reason TEXT;
ALTER TABLE session_bookings ADD COLUMN cancelled_by UUID REFERENCES profiles(id);

-- Reschedule requests
CREATE TYPE reschedule_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

CREATE TABLE reschedule_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES session_bookings(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES profiles(id),
    proposed_date DATE NOT NULL,
    proposed_start_time TIME NOT NULL,
    proposed_end_time TIME NOT NULL,
    reason TEXT,
    status reschedule_status DEFAULT 'PENDING',
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reschedule_session ON reschedule_requests(session_id);
CREATE INDEX idx_reschedule_status ON reschedule_requests(status);
