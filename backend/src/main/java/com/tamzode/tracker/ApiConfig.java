package com.tamzode.tracker;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import java.io.IOException;
import java.sql.Array;
import java.sql.SQLException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
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

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonArrayCustomizer() {
        return builder -> {
            builder.serializerByType(Array.class, new JsonSerializer<Array>() {
                @Override
                public void serialize(Array value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
                    if (value == null) {
                        gen.writeNull();
                        return;
                    }
                    try {
                        Object arr = value.getArray();
                        if (arr instanceof Object[] objArray) {
                            gen.writeStartArray();
                            for (Object o : objArray) {
                                gen.writeObject(o);
                            }
                            gen.writeEndArray();
                        } else {
                            gen.writeStartArray();
                            gen.writeEndArray();
                        }
                    } catch (SQLException e) {
                        gen.writeStartArray();
                        gen.writeEndArray();
                    }
                }
            });
        };
    }
}
