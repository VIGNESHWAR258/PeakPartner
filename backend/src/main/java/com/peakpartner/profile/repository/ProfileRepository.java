package com.peakpartner.profile.repository;

import com.peakpartner.profile.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    
    Optional<Profile> findByEmail(String email);
    
    List<Profile> findByRole(Profile.Role role);
    
    @Query(value = "SELECT * FROM profiles p WHERE p.role = 'TRAINER' " +
           "AND (:specialization IS NULL OR :specialization = ANY(p.specializations))",
           nativeQuery = true)
    List<Profile> findTrainersBySpecialization(@Param("specialization") String specialization);
}
