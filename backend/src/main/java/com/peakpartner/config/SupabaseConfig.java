package com.peakpartner.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "supabase")
public class SupabaseConfig {
    private String url;
    private String anonKey;
    private String serviceRoleKey;
    private String jwtSecret;
}
