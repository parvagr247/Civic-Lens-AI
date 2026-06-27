package com.service;

import com.dto.LoginRequest;
import com.dto.LoginResponse;
import com.dto.RegisterRequest;

/**
 * Service defining authentication operations (Registration, Login, and profile provisioning).
 */
public interface AuthService {

    /**
     * Registers a new user, hashes password, and provisions a default CitizenProfile.
     *
     * @param request Registration payload details.
     * @return LoginResponse containing the JWT token.
     */
    LoginResponse register(RegisterRequest request);

    /**
     * Validates credentials and generates a signed JWT.
     *
     * @param request Authentication credentials.
     * @return LoginResponse containing the JWT token.
     */
    LoginResponse login(LoginRequest request);

    /**
     * Promotes a citizen account to admin authorization.
     * Used for testing/configuration.
     *
     * @param email Target user email.
     */
    void promoteToAdmin(String email);
}
