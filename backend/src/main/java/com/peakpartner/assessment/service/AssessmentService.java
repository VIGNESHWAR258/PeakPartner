package com.peakpartner.assessment.service;

import com.peakpartner.assessment.dto.*;
import com.peakpartner.assessment.model.Assessment;
import com.peakpartner.assessment.repository.AssessmentRepository;
import com.peakpartner.common.exception.*;
import com.peakpartner.connection.model.Connection;
import com.peakpartner.connection.repository.ConnectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final ConnectionRepository connectionRepository;

    @Transactional
    public AssessmentResponse createAssessment(UUID trainerId, CreateAssessmentRequest request) {
        Connection connection = connectionRepository.findById(request.getConnectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found"));

        if (!connection.getTrainer().getId().equals(trainerId)) {
            throw new UnauthorizedException("You can only create assessments for your clients");
        }
        if (connection.getStatus() != Connection.ConnectionStatus.ACCEPTED) {
            throw new BadRequestException("Connection must be accepted to create assessments");
        }

        Assessment assessment = Assessment.builder()
                .connection(connection)
                .trainer(connection.getTrainer())
                .client(connection.getClient())
                .title(request.getTitle())
                .questions(request.getQuestions())
                .status("PENDING")
                .build();

        assessment = assessmentRepository.save(assessment);
        return AssessmentResponse.fromEntity(assessment);
    }

    @Transactional
    public AssessmentResponse submitAssessment(UUID clientId, UUID assessmentId, SubmitAssessmentRequest request) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));

        if (!assessment.getClient().getId().equals(clientId)) {
            throw new UnauthorizedException("You can only submit your own assessments");
        }
        if (!"PENDING".equals(assessment.getStatus())) {
            throw new BadRequestException("Assessment has already been submitted");
        }

        assessment.setAnswers(request.getAnswers());
        assessment.setStatus("SUBMITTED");
        assessment = assessmentRepository.save(assessment);
        return AssessmentResponse.fromEntity(assessment);
    }

    @Transactional
    public AssessmentResponse reviewAssessment(UUID trainerId, UUID assessmentId, String notes) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));

        if (!assessment.getTrainer().getId().equals(trainerId)) {
            throw new UnauthorizedException("You can only review your own assessments");
        }

        assessment.setTrainerNotes(notes);
        assessment.setStatus("REVIEWED");
        assessment = assessmentRepository.save(assessment);
        return AssessmentResponse.fromEntity(assessment);
    }

    public List<AssessmentResponse> getAssessmentsForTrainer(UUID trainerId) {
        return assessmentRepository.findByTrainerIdOrderByCreatedAtDesc(trainerId)
                .stream().map(AssessmentResponse::fromEntity).collect(Collectors.toList());
    }

    public List<AssessmentResponse> getAssessmentsForClient(UUID clientId) {
        return assessmentRepository.findByClientIdOrderByCreatedAtDesc(clientId)
                .stream().map(AssessmentResponse::fromEntity).collect(Collectors.toList());
    }

    public AssessmentResponse getAssessment(UUID userId, UUID assessmentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));

        if (!assessment.getTrainer().getId().equals(userId) && !assessment.getClient().getId().equals(userId)) {
            throw new UnauthorizedException("You don't have access to this assessment");
        }

        return AssessmentResponse.fromEntity(assessment);
    }
}
