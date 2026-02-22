package com.peakpartner.assessment.dto;

import com.peakpartner.assessment.model.Assessment;
import com.peakpartner.profile.dto.ProfileResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AssessmentResponse {
    private UUID id;
    private UUID connectionId;
    private ProfileResponse trainer;
    private ProfileResponse client;
    private String title;
    private String questions;
    private String answers;
    private String status;
    private String trainerNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AssessmentResponse fromEntity(Assessment a) {
        return AssessmentResponse.builder()
                .id(a.getId())
                .connectionId(a.getConnection().getId())
                .trainer(ProfileResponse.fromEntity(a.getTrainer()))
                .client(ProfileResponse.fromEntity(a.getClient()))
                .title(a.getTitle())
                .questions(a.getQuestions())
                .answers(a.getAnswers())
                .status(a.getStatus())
                .trainerNotes(a.getTrainerNotes())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
