package com.tamzode.tracker;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class DatabaseConfigTest {

    @Test
    void testParseNeonUrlWithQuotesAndUserPassword() {
        String neonUrl = "\"postgresql://neondb_owner:npg_vGQV0dKsy7Zm@ep-shiny-mode-az11t0e7-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require\"";
        DatabaseConfig.ParsedDbConnection conn = DatabaseConfig.parseConnection(neonUrl, null, null);

        assertEquals("neondb_owner", conn.username);
        assertEquals("npg_vGQV0dKsy7Zm", conn.password);
        assertTrue(conn.jdbcUrl.startsWith("jdbc:postgresql://ep-shiny-mode-az11t0e7-pooler.c-3.ap-southeast-1.aws.neon.tech:5432/neondb"));
        assertTrue(conn.jdbcUrl.contains("sslmode=require"));
    }

    @Test
    void testStandardJdbcUrlPassThrough() {
        String jdbc = "jdbc:postgresql://localhost:5432/tamzode_tracker";
        DatabaseConfig.ParsedDbConnection conn = DatabaseConfig.parseConnection(jdbc, "tamzode", "secret");

        assertEquals("tamzode", conn.username);
        assertEquals("secret", conn.password);
        assertEquals(jdbc, conn.jdbcUrl);
    }
}
