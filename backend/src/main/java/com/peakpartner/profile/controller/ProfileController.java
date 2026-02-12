package com.peakpartner.profile.controller;

import com.peakpartner.common.dto.ApiResponse;
import com.peakpartner.profile.dto.ProfileResponse;
import com.peakpartner.profile.dto.UpdateProfileRequest;
import com.peakpartner.profile.model.Profile;
import com.peakpartner.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> getMyProfile(
            @AuthenticationPrincipal Profile currentUser) {
        ProfileResponse profile = profileService.getMyProfile(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal Profile currentUser,
            @RequestBody UpdateProfileRequest request) {
        ProfileResponse profile = profileService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(@PathVariable UUID id) {
        ProfileResponse profile = profileService.getProfile(id);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/trainers")
    public ResponseEntity<ApiResponse<List<ProfileResponse>>> getTrainers(
            @RequestParam(required = false) String specialization) {
        List<ProfileResponse> trainers = profileService.getTrainers(specialization);
        return ResponseEntity.ok(ApiResponse.success(trainers));
    }
}
