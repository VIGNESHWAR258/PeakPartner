package com.peakpartner.auth.filter;

import com.peakpartner.auth.service.JwtService;
import com.peakpartner.profile.model.Profile;
import com.peakpartner.profile.repository.ProfileRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ProfileRepository profileRepository;

    // Short-lived profile cache to avoid DB hit on every request.
    // Each dashboard load fires 6-9 parallel API calls — without caching,
    // that's 6-9 profileRepository.findById() calls with the same UUID.
    private static final long CACHE_TTL_MS = 60_000; // 60 seconds
    private final Map<UUID, CachedProfile> profileCache = new ConcurrentHashMap<>();

    private record CachedProfile(Profile profile, long expiresAt) {
        boolean isExpired() { return System.currentTimeMillis() > expiresAt; }
    }

    private Profile getCachedProfile(UUID userId) {
        CachedProfile cached = profileCache.get(userId);
        if (cached != null && !cached.isExpired()) {
            return cached.profile();
        }
        // Evict stale entry
        if (cached != null) profileCache.remove(userId);

        Profile profile = profileRepository.findById(userId).orElse(null);
        if (profile != null) {
            profileCache.put(userId, new CachedProfile(profile, System.currentTimeMillis() + CACHE_TTL_MS));
            // Lazy eviction: remove expired entries when cache grows beyond 500
            if (profileCache.size() > 500) {
                profileCache.entrySet().removeIf(e -> e.getValue().isExpired());
            }
        }
        return profile;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userId;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        userId = jwtService.extractUserId(jwt);

        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UUID userUuid = UUID.fromString(userId);
                Profile profile = getCachedProfile(userUuid);

                if (profile != null && jwtService.isTokenValid(jwt, userUuid)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            profile,
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + profile.getRole().name()))
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (IllegalArgumentException e) {
                // Invalid UUID format
            }
        }
        filterChain.doFilter(request, response);
    }
}
