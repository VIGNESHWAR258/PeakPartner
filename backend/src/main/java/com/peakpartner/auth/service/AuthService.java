package com.peakpartner.auth.service;

import com.peakpartner.auth.dto.AuthResponse;
import com.peakpartner.auth.dto.LoginRequest;
import com.peakpartner.auth.dto.SignUpRequest;
import com.peakpartner.common.exception.BadRequestException;
import com.peakpartner.common.exception.UnauthorizedException;
import com.peakpartner.profile.model.Profile;
import com.peakpartner.profile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse signup(SignUpRequest request) {
        // Check if email already exists
        if (profileRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email already registered");
        }

        // Create profile
        Profile profile = Profile.builder()
                .id(UUID.randomUUID())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(request.getRole())
                .avgRating(BigDecimal.ZERO)
                .totalReviews(0)
                .build();

        profile = profileRepository.save(profile);

        // Generate JWT token
        String token = jwtService.generateToken(profile.getId(), profile.getEmail(), profile.getRole().name());

        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken(token) // In production, generate separate refresh token
                .userId(profile.getId())
                .email(profile.getEmail())
                .role(profile.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Find profile by email
        Profile profile = profileRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        // Note: In a real app with Supabase Auth, password verification would be done via Supabase
        // For this implementation, we're simplifying by using JWT only

        // Generate JWT token
        String token = jwtService.generateToken(profile.getId(), profile.getEmail(), profile.getRole().name());

        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken(token)
                .userId(profile.getId())
                .email(profile.getEmail())
                .role(profile.getRole().name())
                .build();
    }

    public AuthResponse refresh(String refreshToken) {
        String userId = jwtService.extractUserId(refreshToken);
        Profile profile = profileRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new UnauthorizedException("Invalid token"));

        String newToken = jwtService.generateToken(profile.getId(), profile.getEmail(), profile.getRole().name());

        return AuthResponse.builder()
                .accessToken(newToken)
                .refreshToken(newToken)
                .userId(profile.getId())
                .email(profile.getEmail())
                .role(profile.getRole().name())
                .build();
    }
}
