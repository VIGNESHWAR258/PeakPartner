package com.peakpartner.connection.service;

import com.peakpartner.common.exception.BadRequestException;
import com.peakpartner.common.exception.ResourceNotFoundException;
import com.peakpartner.common.exception.UnauthorizedException;
import com.peakpartner.connection.dto.ConnectionRequest;
import com.peakpartner.connection.dto.ConnectionResponse;
import com.peakpartner.connection.model.Connection;
import com.peakpartner.connection.repository.ConnectionRepository;
import com.peakpartner.profile.model.Profile;
import com.peakpartner.profile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final ProfileRepository profileRepository;

    @Transactional
    public ConnectionResponse sendRequest(UUID clientId, ConnectionRequest request) {
        Profile client = profileRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found"));

        if (client.getRole() != Profile.Role.CLIENT) {
            throw new BadRequestException("Only clients can send connection requests");
        }

        Profile trainer = profileRepository.findById(request.getTrainerId())
                .orElseThrow(() -> new ResourceNotFoundException("Trainer not found"));

        if (trainer.getRole() != Profile.Role.TRAINER) {
            throw new BadRequestException("Selected user is not a trainer");
        }

        // Check for existing active connection
        boolean exists = connectionRepository.existsByClientIdAndTrainerIdAndStatusIn(
                clientId, request.getTrainerId(),
                Arrays.asList(Connection.ConnectionStatus.PENDING, Connection.ConnectionStatus.ACCEPTED));

        if (exists) {
            throw new BadRequestException("You already have an active or pending connection with this trainer");
        }

        Connection connection = Connection.builder()
                .client(client)
                .trainer(trainer)
                .status(Connection.ConnectionStatus.PENDING)
                .program(request.getProgram())
                .notes(request.getNotes())
                .build();

        try {
            connection = connectionRepository.save(connection);
        } catch (DataIntegrityViolationException e) {
            // Partial unique index caught a concurrent duplicate connection
            throw new BadRequestException("You already have an active or pending connection with this trainer");
        }
        return ConnectionResponse.fromEntity(connection);
    }

    @Transactional
    public ConnectionResponse acceptRequest(UUID trainerId, UUID connectionId) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found"));

        if (!connection.getTrainer().getId().equals(trainerId)) {
            throw new UnauthorizedException("You can only accept requests sent to you");
        }

        if (connection.getStatus() != Connection.ConnectionStatus.PENDING) {
            throw new BadRequestException("This request is no longer pending");
        }

        connection.setStatus(Connection.ConnectionStatus.ACCEPTED);
        connection.setConnectedAt(LocalDateTime.now());
        connection = connectionRepository.save(connection);

        return ConnectionResponse.fromEntity(connection);
    }

    @Transactional
    public ConnectionResponse declineRequest(UUID trainerId, UUID connectionId) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found"));

        if (!connection.getTrainer().getId().equals(trainerId)) {
            throw new UnauthorizedException("You can only decline requests sent to you");
        }

        if (connection.getStatus() != Connection.ConnectionStatus.PENDING) {
            throw new BadRequestException("This request is no longer pending");
        }

        connection.setStatus(Connection.ConnectionStatus.DECLINED);
        connection = connectionRepository.save(connection);

        return ConnectionResponse.fromEntity(connection);
    }

    public List<ConnectionResponse> getMyConnections(UUID userId, String status) {
        List<Connection> connections;

        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if (status != null && !status.isEmpty()) {
            Connection.ConnectionStatus connStatus = Connection.ConnectionStatus.valueOf(status.toUpperCase());
            if (profile.getRole() == Profile.Role.TRAINER) {
                connections = connectionRepository.findByTrainerIdAndStatus(userId, connStatus);
            } else {
                connections = connectionRepository.findByClientIdAndStatus(userId, connStatus);
            }
        } else {
            if (profile.getRole() == Profile.Role.TRAINER) {
                connections = connectionRepository.findByTrainerIdOrderByCreatedAtDesc(userId);
            } else {
                connections = connectionRepository.findByClientIdOrderByCreatedAtDesc(userId);
            }
        }

        return connections.stream()
                .map(ConnectionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public long getActiveClientsCount(UUID trainerId) {
        return connectionRepository.findByTrainerIdAndStatus(trainerId, Connection.ConnectionStatus.ACCEPTED).size();
    }
}
