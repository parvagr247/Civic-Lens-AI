package com.configuration;

import com.security.JwtAuthenticationFilter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security configuration.
 * Configures stateless session management, BCrypt hashing, JWT filters, and role-based route access controls.
 */
@Slf4j
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    private final CorsConfigurationSource corsConfigurationSource;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfiguration(
            CorsConfigurationSource corsConfigurationSource,
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.corsConfigurationSource = corsConfigurationSource;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configuring Spring Security Filter Chain for CivicLens AI.");

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow public access to health, swagger docs, auth, anonymous tracking, and dev seeds
                .requestMatchers(
                    "/api/health",
                    "/actuator/**",
                    "/api/version",
                    "/api/status",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/api/auth/**",
                    "/api/issues/anonymous/**",
                    "/api/issues/track/**",
                    "/api/dev/seed"
                ).permitAll()
                // Restrict Admin dashboard operations and re-analysis to ROLE_ADMIN
                .requestMatchers(
                    "/api/dashboard/admin",
                    "/api/issues/*/risk/reanalyze"
                ).hasAuthority("ROLE_ADMIN")
                // Citizens require authenticated access to report and view details, statistics, and risk indicators
                .requestMatchers(
                    "/api/issues/**",
                    "/api/dashboard/user",
                    "/api/profile/**",
                    "/api/leaderboard/**",
                    "/api/achievements/**",
                    "/api/risk/**"
                ).authenticated()
                .anyRequest().authenticated()
            );

        // Bind the JWT filter to check Bearer tokens on each request
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
