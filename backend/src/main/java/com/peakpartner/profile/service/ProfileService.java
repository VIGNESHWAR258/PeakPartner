package com.peakpartner.profile.service;

import com.peakpartner.common.exception.ResourceNotFoundException;
import com.peakpartner.profile.dto.ProfileResponse;
import com.peakpartner.profile.dto.UpdateProfileRequest;
import com.peakpartner.profile.model.Profile;
import com.peakpartner.profile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileResponse getProfile(UUID id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        return ProfileResponse.fromEntity(profile);
    }

    public ProfileResponse getMyProfile(UUID userId) {
        return getProfile(userId);
    }

    @Transactional
    public ProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if (request.getFullName() != null) {
            profile.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            profile.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getSpecializations() != null) {
            profile.setSpecializations(request.getSpecializations());
        }
        if (request.getExperienceYears() != null) {
            profile.setExperienceYears(request.getExperienceYears());
        }
        if (request.getCertifications() != null) {
            profile.setCertifications(request.getCertifications());
        }
        if (request.getFitnessGoals() != null) {
            profile.setFitnessGoals(request.getFitnessGoals());
        }

        profile = profileRepository.save(profile);
        return ProfileResponse.fromEntity(profile);
    }

    public List<ProfileResponse> getTrainers(String specialization) {
        List<Profile> trainers;
        if (specialization != null && !specialization.isEmpty()) {
            trainers = profileRepository.findTrainersBySpecialization(specialization);
        } else {
            trainers = profileRepository.findByRole(Profile.Role.TRAINER);
        }
        return trainers.stream()
                .map(ProfileResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
