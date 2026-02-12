package com.peakpartner.profile.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    private String avatarUrl;
    private String bio;
    private String[] specializations;
    private Integer experienceYears;
    private String[] certifications;
    private String[] fitnessGoals;
}
