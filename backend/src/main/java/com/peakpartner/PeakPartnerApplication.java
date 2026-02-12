package com.peakpartner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class PeakPartnerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PeakPartnerApplication.class, args);
    }
}
