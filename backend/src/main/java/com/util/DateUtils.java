package com.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Reusable date and time utility functions.
 * Designed to ensure standard timezone offsets (UTC) are maintained across the application.
 */
public final class DateUtils {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter
            .ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .withZone(ZoneOffset.UTC);

    private DateUtils() {
        // Prevent instantiation
    }

    /**
     * Obtains the current timestamp in ISO 8601 UTC format.
     *
     * @return current timestamp string
     */
    public static String getCurrentTimestampIso() {
        return ISO_FORMATTER.format(Instant.now());
    }

    /**
     * Converts a LocalDateTime to standard UTC ISO String representation.
     *
     * @param dateTime local datetime
     * @return ISO-8601 formatted string
     */
    public static String toIsoString(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return ISO_FORMATTER.format(dateTime.toInstant(ZoneOffset.UTC));
    }

    /**
     * Parses an ISO UTC date string into an Instant.
     *
     * @param isoString formatted string
     * @return Instant
     */
    public static Instant parseIsoString(String isoString) {
        if (isoString == null || isoString.isEmpty()) {
            return null;
        }
        return Instant.parse(isoString);
    }
}
