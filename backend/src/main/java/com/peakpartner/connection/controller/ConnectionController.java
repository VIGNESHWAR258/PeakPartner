package com.peakpartner.connection.controller;

import com.peakpartner.common.dto.ApiResponse;
import com.peakpartner.connection.dto.ConnectionRequest;
import com.peakpartner.connection.dto.ConnectionResponse;
import com.peakpartner.connection.service.ConnectionService;
import com.peakpartner.profile.model.Profile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    @PostMapping
    public ResponseEntity<ApiResponse<ConnectionResponse>> sendRequest(
            @AuthenticationPrincipal Profile currentUser,
            @Valid @RequestBody ConnectionRequest request) {
        ConnectionResponse response = connectionService.sendRequest(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Connection request sent", response));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<ConnectionResponse>> acceptRequest(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id) {
        ConnectionResponse response = connectionService.acceptRequest(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Connection request accepted", response));
    }

    @PutMapping("/{id}/decline")
    public ResponseEntity<ApiResponse<ConnectionResponse>> declineRequest(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id) {
        ConnectionResponse response = connectionService.declineRequest(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Connection request declined", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConnectionResponse>>> getMyConnections(
            @AuthenticationPrincipal Profile currentUser,
            @RequestParam(required = false) String status) {
        List<ConnectionResponse> connections = connectionService.getMyConnections(
                currentUser.getId(), status);
        return ResponseEntity.ok(ApiResponse.success(connections));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getActiveClientsCount(
            @AuthenticationPrincipal Profile currentUser) {
        long count = connectionService.getActiveClientsCount(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Active clients count", count));
    }
}
