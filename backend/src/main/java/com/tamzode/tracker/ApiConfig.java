package com.tamzode.tracker;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ApiConfig implements WebMvcConfigurer {
    @Value("${app.cors-origin}") private String origin;
    @Override public void addCorsMappings(CorsRegistry registry) {
        var origins = java.util.Arrays.stream(origin.split(",")).map(String::trim).toArray(String[]::new);
        registry.addMapping("/api/**").allowedOrigins(origins).allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS").allowedHeaders("Content-Type");
    }
}
