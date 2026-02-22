package com.peakpartner.session.model;

import com.peakpartner.profile.model.Profile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "reschedule_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleRequest {

    public enum RescheduleStatus { PENDING, ACCEPTED, DECLINED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private SessionBooking session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    private Profile requestedBy;

    @Column(name = "proposed_date", nullable = false)
    private LocalDate proposedDate;

    @Column(name = "proposed_start_time", nullable = false)
    private LocalTime proposedStartTime;

    @Column(name = "proposed_end_time", nullable = false)
    private LocalTime proposedEndTime;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "reschedule_status")
    private RescheduleStatus status = RescheduleStatus.PENDING;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
