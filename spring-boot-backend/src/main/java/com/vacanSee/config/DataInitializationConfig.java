package com.vacanSee.config;

import com.vacanSee.model.Property;
import com.vacanSee.model.User;
import com.vacanSee.repository.PropertyRepository;
import com.vacanSee.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

@Configuration
public class DataInitializationConfig {

    @Bean
    public CommandLineRunner initializeDatabase(
            UserRepository userRepository,
            PropertyRepository propertyRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {

            // ── 1. Create admin account ───────────────────────────────
            String adminEmail = "admin@vacansee.com";
            User admin;

            if (!userRepository.existsByEmail(adminEmail)) {
                User a = new User();
                a.setEmail(adminEmail);
                a.setPassword(passwordEncoder.encode("admin123"));
                a.setFullName("VacanSee Admin");
                a.setPhone("+63 900 000 0000");
                a.setBio("Official VacanSee administrator account");
                admin = userRepository.save(a);
                System.out.println("✅ Admin created (ID=" + admin.getId() + ")");
            } else {
                admin = userRepository.findByEmail(adminEmail).orElseThrow();
                System.out.println("✅ Admin exists (ID=" + admin.getId() + ")");
            }

            // ── 2. Seed sample properties if none exist ───────────────
            // This ensures property IDs exist in MySQL so bookings and
            // inquiries can reference them by real database IDs.
            if (propertyRepository.count() == 0) {
                System.out.println("📋 Seeding sample properties...");
                seedProperty(propertyRepository, admin,
                    "Cozy Boarding House near UP Diliman",
                    "Clean and comfortable boarding house with 6 rooms. Includes free WiFi, weekly laundry, and meals. Walking distance to UP Diliman.",
                    3500, "Boarding House", "118 Katipunan Avenue", "Quezon City", "Metro Manila",
                    2, 2, true, true, false, false, false, true, true, false);

                seedProperty(propertyRepository, admin,
                    "Budget Room near UST",
                    "Affordable student-friendly room with free WiFi and 24/7 security. Minutes away from UST and Espana Blvd.",
                    2500, "Bed Space", "45 Espana Blvd", "Manila", "Metro Manila",
                    1, 1, false, false, false, false, false, true, false, false);

                seedProperty(propertyRepository, admin,
                    "Spacious Apartment in BGC",
                    "Modern 2-bedroom apartment in the heart of BGC. Gym access, parking included, and pet-friendly.",
                    8500, "Apartment", "30th Street", "Taguig", "Metro Manila",
                    2, 2, true, true, true, false, true, true, false, true);

                seedProperty(propertyRepository, admin,
                    "Female Dorm near Ateneo",
                    "Safe, female-only dormitory with 24/7 guard. Meals included, WiFi, and near Ateneo de Manila.",
                    4000, "Dormitory", "65 Katipunan Ave", "Quezon City", "Metro Manila",
                    1, 2, false, false, false, true, false, true, true, false);

                seedProperty(propertyRepository, admin,
                    "Studio near IT Park Cebu",
                    "Fully furnished studio unit near Cebu IT Park. Ideal for BPO workers. Free WiFi, with balcony.",
                    5500, "Studio", "Cebu IT Park", "Cebu City", "Cebu",
                    1, 1, true, true, false, false, true, true, false, false);

                seedProperty(propertyRepository, admin,
                    "House with Garden in Davao",
                    "Pet-friendly house with garden in a quiet subdivision. 3 bedrooms, near Ateneo de Davao.",
                    6000, "House for Rent", "Matina District", "Davao City", "Davao del Sur",
                    3, 2, true, false, false, true, false, false, false, true);

                System.out.println("✅ Sample properties seeded!");
            } else {
                System.out.println("✅ Properties already exist (" + propertyRepository.count() + " total)");
            }

            System.out.println("================================================");
            System.out.println(" VacanSee Backend running on http://localhost:8000");
            System.out.println(" Admin login: admin@vacansee.com / admin123");
            System.out.println("================================================");
        };
    }

    private void seedProperty(
            PropertyRepository repo, User owner,
            String title, String description, double price, String type,
            String location, String city, String state,
            int bedrooms, int bathrooms,
            boolean hasParking, boolean hasGym, boolean hasPool,
            boolean hasGarden, boolean hasBalcony,
            boolean hasWifi, boolean hasMeals, boolean petFriendly) {

        Property p = new Property();
        p.setOwner(owner);
        p.setTitle(title);
        p.setDescription(description);
        p.setPrice(BigDecimal.valueOf(price));
        p.setPropertyType(type);
        p.setStatus("available");
        p.setLocation(location);
        p.setCity(city);
        p.setState(state);
        p.setCountry("Philippines");
        p.setBedrooms(bedrooms);
        p.setBathrooms(bathrooms);
        p.setHasParking(hasParking);
        p.setHasGym(hasGym);
        p.setHasPool(hasPool);
        p.setHasGarden(hasGarden);
        p.setHasBalcony(hasBalcony);
        p.setHasWifi(hasWifi);
        p.setHasMeals(hasMeals);
        p.setPetFriendly(petFriendly);
        repo.save(p);
        System.out.println("   → " + title);
    }
}
