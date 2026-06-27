package com.service.impl;

import com.dto.LoginRequest;
import com.dto.LoginResponse;
import com.dto.RegisterRequest;
import com.exception.ValidationException;
import com.model.*;
import com.repository.ActivityLogFirestoreRepository;
import com.repository.CitizenProfileFirestoreRepository;
import com.repository.UserFirestoreRepository;
import com.security.JwtTokenProvider;
import com.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.UUID;

/**
 * Service implementation managing user registration, login, and profile provisioning.
 */
@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    private final UserFirestoreRepository userRepository;
    private final CitizenProfileFirestoreRepository profileRepository;
    private final ActivityLogFirestoreRepository activityLogRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(
            UserFirestoreRepository userRepository,
            CitizenProfileFirestoreRepository profileRepository,
            ActivityLogFirestoreRepository activityLogRepository,
            JwtTokenProvider tokenProvider,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.activityLogRepository = activityLogRepository;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public LoginResponse register(RegisterRequest request) {
        log.info("Auth: Initiating registration workflow for email: {}", request.getEmail());

        String email = request.getEmail().trim().toLowerCase();

        // 1. Verify email uniqueness
        if (userRepository.findByEmail(email) != null) {
            log.warn("Auth: Registration failed - Email '{}' already registered", email);
            throw new ValidationException("Email address is already registered.");
        }

        // 2. Hash password
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 3. Determine role based on request or config
        UserRole role = request.isAdmin() ? UserRole.ROLE_ADMIN : UserRole.ROLE_USER;

        // 4. Build and save User entity
        String userId = UUID.randomUUID().toString();
        User user = User.builder()
                .id(userId)
                .email(email)
                .password(hashedPassword)
                .role(role)
                .createdAt(System.currentTimeMillis())
                .build();
        userRepository.save(user);

        // 5. Provision profile if user is a normal citizen
        String avatarSeed = request.getName().trim().replaceAll("\\s+", "_");
        String avatarUrl = "https://api.dicebear.com/7.x/bottts/svg?seed=" + avatarSeed;

        CitizenProfile profile = CitizenProfile.builder()
                .userId(userId)
                .name(request.getName())
                .avatarUrl(avatarUrl)
                .bio("Civic contributor active since 2026.")
                .points(0)
                .level("New Citizen")
                .rank(0)
                .reportsSubmitted(0)
                .reportsResolved(0)
                .unlockedAchievements(new ArrayList<>())
                .updatedAt(System.currentTimeMillis())
                .build();
        profileRepository.save(profile);

        // 6. Log audit activity
        ActivityLog logEntry = ActivityLog.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .action("REGISTRATION")
                .description("Citizen profile created successfully for " + request.getName())
                .timestamp(System.currentTimeMillis())
                .build();
        activityLogRepository.save(logEntry);

        // 7. Generate JWT
        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name());

        return LoginResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(profile.getName())
                .role(user.getRole().name())
                .userId(userId)
                .build();
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        log.info("Auth: Initiating login verification for: {}", email);

        // 1. Fetch user credentials
        User user = userRepository.findByEmail(email);
        if (user == null) {
            log.warn("Auth: Login failed - User email not found");
            throw new ValidationException("Invalid email or password credentials.");
        }

        // 2. Validate password match
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Auth: Login failed - Incorrect password entered");
            throw new ValidationException("Invalid email or password credentials.");
        }

        // 3. Fetch citizen profile (or placeholder if admin has no profile)
        CitizenProfile profile = profileRepository.findByUserId(user.getId());
        String displayName = profile != null ? profile.getName() : "Administrator";

        // 4. Log audit log
        ActivityLog logEntry = ActivityLog.builder()
                .id(UUID.randomUUID().toString())
                .userId(user.getId())
                .action("LOGIN")
                .description("User session authenticated successfully.")
                .timestamp(System.currentTimeMillis())
                .build();
        activityLogRepository.save(logEntry);

        // 5. Generate token
        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name());

        return LoginResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(displayName)
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    @Override
    public void promoteToAdmin(String email) {
        log.info("Auth: Promoting account to Admin: {}", email);
        User user = userRepository.findByEmail(email.trim().toLowerCase());
        if (user == null) {
            throw new ValidationException("User not found with email: " + email);
        }
        user.setRole(UserRole.ROLE_ADMIN);
        userRepository.save(user);
        log.info("Auth: Account promoted successfully: {}", email);
    }
}
