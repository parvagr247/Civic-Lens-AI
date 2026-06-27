package com.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility component for generating, signing, parsing, and validating JWT authentication tokens.
 * Employs standard Java HMAC-SHA256 cryptography to ensure portability and high performance.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret:civiclens-enterprise-secret-key-super-secure-2026-sha256}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:86400000}") // 24 hours default
    private long jwtExpirationInMs;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String HEADER_B64 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; // base64url for {"alg":"HS256","typ":"JWT"}

    /**
     * Generates a signed JWT token containing email and role claims.
     */
    public String generateToken(String email, String role) {
        log.info("JWT: Generating token for user: {}", email);
        try {
            long nowMs = System.currentTimeMillis();
            long expMs = nowMs + jwtExpirationInMs;

            Map<String, Object> claims = new HashMap<>();
            claims.put("sub", email.trim().toLowerCase());
            claims.put("role", role);
            claims.put("iat", nowMs / 1000);
            claims.put("exp", expMs / 1000);

            String payloadJson = objectMapper.writeValueAsString(claims);
            String payloadB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

            String dataToSign = HEADER_B64 + "." + payloadB64;
            String signature = sign(dataToSign);

            return dataToSign + "." + signature;
        } catch (Exception e) {
            log.error("JWT Error: Token generation failed", e);
            throw new RuntimeException("Failed to generate security token", e);
        }
    }

    /**
     * Validates a JWT signature and expiration timestamp.
     */
    public boolean validateToken(String token) {
        if (token == null) return false;
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }

            String header = parts[0];
            String payload = parts[1];
            String signature = parts[2];

            // Verify signature matches expected hash
            String expectedSignature = sign(header + "." + payload);
            if (!expectedSignature.equals(signature)) {
                log.warn("JWT: Validation failed - Invalid signature");
                return false;
            }

            // Verify expiration
            String payloadJson = new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8);
            Map<String, Object> claims = objectMapper.readValue(payloadJson, Map.class);
            Number exp = (Number) claims.get("exp");
            if (exp == null || exp.longValue() < (System.currentTimeMillis() / 1000)) {
                log.warn("JWT: Validation failed - Token expired");
                return false;
            }

            return true;
        } catch (Exception e) {
            log.warn("JWT: Validation threw error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extracts the user email claim from the token.
     */
    public String getEmailFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Map<String, Object> claims = objectMapper.readValue(payloadJson, Map.class);
            return (String) claims.get("sub");
        } catch (Exception e) {
            log.error("JWT: Failed to extract email from token", e);
            return null;
        }
    }

    /**
     * Extracts the user role claim from the token.
     */
    public String getRoleFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Map<String, Object> claims = objectMapper.readValue(payloadJson, Map.class);
            return (String) claims.get("role");
        } catch (Exception e) {
            log.error("JWT: Failed to extract role from token", e);
            return null;
        }
    }

    private String sign(String data) throws Exception {
        Mac sha256 = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256.init(secretKey);
        byte[] bytes = sha256.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
