package com.peakpartner.connection.repository;

import com.peakpartner.connection.model.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, UUID> {

    List<Connection> findByClientIdOrderByCreatedAtDesc(UUID clientId);

    List<Connection> findByTrainerIdOrderByCreatedAtDesc(UUID trainerId);

    List<Connection> findByTrainerIdAndStatus(UUID trainerId, Connection.ConnectionStatus status);

    List<Connection> findByClientIdAndStatus(UUID clientId, Connection.ConnectionStatus status);

    Optional<Connection> findByClientIdAndTrainerId(UUID clientId, UUID trainerId);

    boolean existsByClientIdAndTrainerIdAndStatusIn(UUID clientId, UUID trainerId,
                                                     List<Connection.ConnectionStatus> statuses);
}
