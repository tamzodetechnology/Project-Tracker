package com.tamzode.tracker;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class DatabaseConfig {

    @Value("${DATABASE_URL_UNPOOLED:${DATABASE_URL:jdbc:postgresql://localhost:5432/tamzode_tracker}}")
    private String databaseUrl;

    @Value("${DATABASE_USERNAME:}")
    private String configuredUsername;

    @Value("${DATABASE_PASSWORD:}")
    private String configuredPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        ParsedDbConnection conn = parseConnection(databaseUrl, configuredUsername, configuredPassword);
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(conn.jdbcUrl);
        if (conn.username != null && !conn.username.isEmpty()) {
            config.setUsername(conn.username);
        }
        if (conn.password != null && !conn.password.isEmpty()) {
            config.setPassword(conn.password);
        }
        config.setMaximumPoolSize(8);
        return new HikariDataSource(config);
    }

    @Bean
    public FlywayConfigurationCustomizer flywayConfigurationCustomizer() {
        return configuration -> {
            configuration.configuration(Map.of("flyway.postgresql.transactional.lock", "false"));
        };
    }

    public static class ParsedDbConnection {
        public final String jdbcUrl;
        public final String username;
        public final String password;

        public ParsedDbConnection(String jdbcUrl, String username, String password) {
            this.jdbcUrl = jdbcUrl;
            this.username = username;
            this.password = password;
        }
    }

    public static ParsedDbConnection parseConnection(String rawUrl, String defaultUser, String defaultPass) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return new ParsedDbConnection("jdbc:postgresql://localhost:5432/tamzode_tracker", defaultUser, defaultPass);
        }
        String cleanUrl = rawUrl.trim();
        if (cleanUrl.startsWith("\"") && cleanUrl.endsWith("\"") && cleanUrl.length() >= 2) {
            cleanUrl = cleanUrl.substring(1, cleanUrl.length() - 1);
        }
        if (cleanUrl.startsWith("'") && cleanUrl.endsWith("'") && cleanUrl.length() >= 2) {
            cleanUrl = cleanUrl.substring(1, cleanUrl.length() - 1);
        }

        if (cleanUrl.startsWith("postgres://") || cleanUrl.startsWith("postgresql://")) {
            try {
                URI uri = URI.create(cleanUrl.replaceFirst("^postgres(ql)?://", "http://"));
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath() != null && !uri.getPath().isEmpty() ? uri.getPath() : "/neondb";
                String query = uri.getQuery();

                String username = defaultUser != null && !defaultUser.isBlank() ? defaultUser : null;
                String password = defaultPass != null && !defaultPass.isBlank() ? defaultPass : null;
                String userInfo = uri.getUserInfo();
                if (userInfo != null) {
                    String[] parts = userInfo.split(":", 2);
                    if (username == null) username = parts[0];
                    if (password == null && parts.length > 1) password = parts[1];
                }

                StringBuilder jdbc = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append(path);

                if (query != null && !query.isEmpty()) {
                    jdbc.append("?").append(query);
                } else {
                    jdbc.append("?sslmode=require");
                }

                return new ParsedDbConnection(jdbc.toString(), username, password);
            } catch (Exception e) {
                // Ignore and fall through to standard prefix handling
            }
        }

        if (!cleanUrl.startsWith("jdbc:")) {
            cleanUrl = "jdbc:" + cleanUrl;
        }
        return new ParsedDbConnection(cleanUrl, defaultUser, defaultPass);
    }
}
