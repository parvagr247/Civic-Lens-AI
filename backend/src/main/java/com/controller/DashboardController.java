package com.controller;

import com.dto.AdminDashboardResponse;
import com.dto.ApiResponse;
import com.dto.CitizenDashboardResponse;
import com.model.User;
import com.repository.UserFirestoreRepository;
import com.exception.ResourceNotFoundException;
import com.service.DashboardService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for retrieving aggregated stats configurations for user and admin panels.
 */
@Slf4j
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserFirestoreRepository userRepository;

    public DashboardController(DashboardService dashboardService, UserFirestoreRepository userRepository) {
        this.dashboardService = dashboardService;
        this.userRepository = userRepository;
    }

    /**
     * Aggregates contributions, podiums, and weekly activity charts for the authenticated citizen.
     */
    @GetMapping("/user")
    public ResponseEntity<ApiResponse<CitizenDashboardResponse>> getCitizenDashboard() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        log.info("REST: Received request to fetch Citizen Dashboard for email: {}", email);

        User user = userRepository.findByEmail(email);
        if (user == null) {
            log.warn("REST Error: Authenticated user credentials not found for email: {}", email);
            throw new ResourceNotFoundException("Authenticated account details not found.");
        }

        CitizenDashboardResponse response = dashboardService.getCitizenDashboard(user.getId());

        return ResponseEntity.ok(ApiResponse.success(
                response,
                "Citizen dashboard metrics compiled successfully.",
                HttpStatus.OK.value()
        ));
    }

    /**
     * Aggregates city-wide workload, priority distributions, and diagnostic recommendations for administrators.
     */
    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAdminDashboard() {
        log.info("REST: Received request to fetch Admin Analytics Dashboard.");
        
        AdminDashboardResponse response = dashboardService.getAdminDashboard();

        return ResponseEntity.ok(ApiResponse.success(
                response,
                "Municipal admin dashboard metrics compiled successfully.",
                HttpStatus.OK.value()
        ));
    }
}
