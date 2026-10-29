package com.tamzode.tracker;

import static org.junit.jupiter.api.Assertions.assertThrows;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class TrackerControllerTest {
    private final TrackerController controller = new TrackerController(null);

    @Test
    void analyticsRejectsAnInvertedDateRangeBeforeQuerying() {
        assertThrows(ResponseStatusException.class, () -> controller.taskAnalytics(null,
            LocalDate.parse("2026-10-30"), LocalDate.parse("2026-10-29")));
    }

    @Test
    void analyticsRejectsRangesLongerThanOneYearBeforeQuerying() {
        assertThrows(ResponseStatusException.class, () -> controller.taskAnalytics(null,
            LocalDate.parse("2025-01-01"), LocalDate.parse("2026-01-02")));
    }

    @Test
    void bulkUpdatesRejectInvalidStatusBeforeLoadingRecords() {
        assertThrows(ResponseStatusException.class, () -> controller.bulkTasks(
            new TrackerController.BulkTaskInput(List.of(1L), "Unknown", null)));
    }

    @Test
    void bulkUpdatesRequireAtLeastOneChange() {
        assertThrows(ResponseStatusException.class, () -> controller.bulkTasks(
            new TrackerController.BulkTaskInput(List.of(1L), null, null)));
    }

    @Test
    void taskListRejectsUnknownSortKeysBeforeQuerying() {
        assertThrows(ResponseStatusException.class, () -> controller.getTasks(
            null, null, null, null, null, null, null, "random", 0, 20));
    }

    @Test
    void taskListRejectsAnInvertedDueDateRangeBeforeQuerying() {
        assertThrows(ResponseStatusException.class, () -> controller.getTasks(
            null, null, null, null, null, LocalDate.parse("2026-10-30"),
            LocalDate.parse("2026-10-29"), "due", 0, 20));
    }
}
