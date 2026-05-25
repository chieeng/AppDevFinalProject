package com.vacanSee;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VacanSeeApplication {

    public static void main(String[] args) {
        SpringApplication.run(VacanSeeApplication.class, args);
    }
}
