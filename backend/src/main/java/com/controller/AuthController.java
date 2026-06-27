package com.controller;

import com.dto.ApiResponse;
import com.dto.LoginRequest;
import com.dto.LoginResponse;
import com.dto.RegisterRequest;
import com.service.AuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for citizen and admin authentication operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Registers a new user account and creates its corresponding gamification profile.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponse>> register( @Valid @RequestBody RegisterRequest request) {
        log.info("REST: Received request to register new user: {}", request.getEmail());
        LoginResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success( response, "Account created successfully.", HttpStatus.CREATED.value() ));
    }

    /**
     * Authenticates credentials and returns a signed JWT bearer token.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login( @Valid @RequestBody LoginRequest request) {
        log.info("REST: Received login request for user: {}", request.getEmail());
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success( response, "Authentication successful.", HttpStatus.OK.value()));
    }

    /**
     * Clears user token sessions (handled statelessly by frontend clients).
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        log.info("REST: Received logout request.");
        return ResponseEntity.ok(ApiResponse.success(null, "Session logged out successfully.", HttpStatus.OK.value()));
    }
}
