package com.saho.foundation.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private String resourceLocation(Path path) {
        String location = path.toAbsolutePath().normalize().toUri().toString();
        return location.endsWith("/") ? location : location + "/";
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
                registry.addMapping("/uploads/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
                registry.addMapping("/students/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                String uploadPath = resourceLocation(Paths.get(uploadDir));
                String repoUploadPath = resourceLocation(Paths.get("backend", "saho-foundation-backend", uploadDir));
                String backendUploadPath = Path.of("").toAbsolutePath().getFileName().toString().equals("saho-foundation-backend")
                        ? uploadPath
                        : repoUploadPath;
                registry.addResourceHandler("/uploads/**", "/students/**")
                        .addResourceLocations(uploadPath, backendUploadPath);
            }
        };
    }
}
