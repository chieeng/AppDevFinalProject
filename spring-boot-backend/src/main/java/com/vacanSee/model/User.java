package com.vacanSee.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    private String phone;
    private String bio;

    @Column(name = "profile_image")
    private String profileImage;

    // TENANT | OWNER | ADMIN — default TENANT for all new registrations
    @Column(nullable = false, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'TENANT'")
    private String role = "TENANT";

    // active | pending (owner awaiting admin approval) | rejected
    @Column(name = "account_status", nullable = false, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'active'")
    private String accountStatus = "active";

    @Column(name = "business_permit_image", columnDefinition = "LONGTEXT")
    private String businessPermitImage;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
