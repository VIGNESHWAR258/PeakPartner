package com.peakpartner.assessment.controller;

import com.peakpartner.assessment.dto.*;
import com.peakpartner.assessment.service.AssessmentService;
import com.peakpartner.common.dto.ApiResponse;
import com.peakpartner.profile.model.Profile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/assessments")
@RequiredArgsConstructor
public class AssessmentController {

    private final AssessmentService assessmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<AssessmentResponse>> createAssessment(
            @AuthenticationPrincipal Profile currentUser,
            @Valid @RequestBody CreateAssessmentRequest request) {
        AssessmentResponse response = assessmentService.createAssessment(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Assessment created", response));
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<AssessmentResponse>> submitAssessment(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id,
            @RequestBody SubmitAssessmentRequest request) {
        AssessmentResponse response = assessmentService.submitAssessment(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Assessment submitted", response));
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<ApiResponse<AssessmentResponse>> reviewAssessment(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        AssessmentResponse response = assessmentService.reviewAssessment(
                currentUser.getId(), id, body.get("notes"));
        return ResponseEntity.ok(ApiResponse.success("Assessment reviewed", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AssessmentResponse>>> getMyAssessments(
            @AuthenticationPrincipal Profile currentUser) {
        List<AssessmentResponse> list;
        if (currentUser.getRole() == Profile.Role.TRAINER) {
            list = assessmentService.getAssessmentsForTrainer(currentUser.getId());
        } else {
            list = assessmentService.getAssessmentsForClient(currentUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssessmentResponse>> getAssessment(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id) {
        AssessmentResponse response = assessmentService.getAssessment(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
