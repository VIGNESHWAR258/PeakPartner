package com.peakpartner.profile.dto;

import com.peakpartner.profile.model.Profile;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ProfileResponse {
    private UUID id;
    private Profile.Role role;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String bio;
    private String[] specializations;
    private Integer experienceYears;
    private String[] certifications;
    private String[] fitnessGoals;
    private BigDecimal avgRating;
    private Integer totalReviews;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProfileResponse fromEntity(Profile profile) {
        ProfileResponse response = new ProfileResponse();
        response.setId(profile.getId());
        response.setRole(profile.getRole());
        response.setFullName(profile.getFullName());
        response.setEmail(profile.getEmail());
        response.setPhone(profile.getPhone());
        response.setAvatarUrl(profile.getAvatarUrl());
        response.setBio(profile.getBio());
        response.setSpecializations(profile.getSpecializations());
        response.setExperienceYears(profile.getExperienceYears());
        response.setCertifications(profile.getCertifications());
        response.setFitnessGoals(profile.getFitnessGoals());
        response.setAvgRating(profile.getAvgRating());
        response.setTotalReviews(profile.getTotalReviews());
        response.setCreatedAt(profile.getCreatedAt());
        response.setUpdatedAt(profile.getUpdatedAt());
        return response;
    }
}
