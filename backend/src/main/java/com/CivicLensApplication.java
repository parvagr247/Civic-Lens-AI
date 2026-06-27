package com;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * CivicLensApplication is the enterprise bootstrapper for the CivicLens AI municipal platform.
 * It initializes spring context, configures sub-components, and starts the servlet container.
 */
@SpringBootApplication
public class CivicLensApplication {

    public static void main(String[] args) {
        SpringApplication.run(CivicLensApplication.class, args);
    }
}
