package com.service;

import com.dto.AdminDashboardResponse;
import com.dto.CitizenDashboardResponse;

/**
 * Service interface specifying aggregated metrics retrieval operations for both Citizen and Admin views.
 */
public interface DashboardService {

    /**
     * Aggregates dynamic points details, rankings, and personal milestone listings for a citizen.
     *
     * @param userId Unique citizen user account ID.
     * @return CitizenDashboardResponse dashboard package.
     */
    CitizenDashboardResponse getCitizenDashboard(String userId);

    /**
     * Aggregates administrative diagnostics, category counts, risk averages, and workload metrics.
     *
     * @return AdminDashboardResponse admin package.
     */
    AdminDashboardResponse getAdminDashboard();
}
