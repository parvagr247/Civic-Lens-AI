package com.configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI Swagger documentation configuration.
 * Sets up custom metadata, descriptions, contact parameters, and JWT schema placeholders.
 */
@Slf4j
@Configuration
public class OpenApiConfiguration {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        log.info("Initializing OpenAPI documentation metadata for CivicLens AI.");
        
        return new OpenAPI()
                .info(new Info()
                        .title("CivicLens AI – Municipal Intelligence Platform API")
                        .version("1.0.0")
                        .description("CivicLens AI uses Spring AI, Google Gemini, and Firebase to analyze municipal issues, estimate civic risk, and provide intelligent dashboards for city officials.")
                        .contact(new Contact()
                                .name("CivicLens Dev Team")
                                .email("support@civiclens.ai")
                                .url("https://github.com/parvagr247/Civic-Lens-AI"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                // Configure future JWT scheme support so controllers don't need configuration updates later
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT token credentials using the standard format: Bearer <token>")));
    }
}
