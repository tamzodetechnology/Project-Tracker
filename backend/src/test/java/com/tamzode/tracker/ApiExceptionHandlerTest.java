package com.tamzode.tracker;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

class ApiExceptionHandlerTest {
    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void validationErrorsReturnFieldMessages() {
        var binding = new BeanPropertyBindingResult(new Object(), "request");
        binding.addError(new FieldError("request", "title", "A title is required"));
        var exception = new MethodArgumentNotValidException(null, binding);

        var response = handler.invalid(exception);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("A title is required", ((java.util.Map<?, ?>)((java.util.Map<?, ?>)response.getBody()).get("fields")).get("title"));
    }

    @Test
    void missingRecordsReturnConsistentNotFoundResponse() {
        var response = handler.status(new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        assertEquals(404, response.getStatusCode().value());
        assertEquals("Project not found", ((java.util.Map<?, ?>)response.getBody()).get("error"));
    }
}
