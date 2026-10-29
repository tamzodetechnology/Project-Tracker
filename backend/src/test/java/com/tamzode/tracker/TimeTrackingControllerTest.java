package com.tamzode.tracker;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class TimeTrackingControllerTest {
    @Test
    void computesManualEntryDurationFromActualTimestamps() {
        var start = OffsetDateTime.parse("2026-10-29T09:00:00+05:30");
        var end = OffsetDateTime.parse("2026-10-29T10:15:30+05:30");

        assertEquals(4530, TimeTrackingController.durationSeconds(start, end));
    }

    @Test
    void rejectsNonPositiveManualEntryDuration() {
        var start = OffsetDateTime.parse("2026-10-29T10:00:00+05:30");
        var end = OffsetDateTime.parse("2026-10-29T09:59:59+05:30");

        assertThrows(ResponseStatusException.class, () -> TimeTrackingController.durationSeconds(start, end));
    }
}
