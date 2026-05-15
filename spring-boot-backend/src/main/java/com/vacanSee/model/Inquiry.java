package com.vacanSee.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "inquiries")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "property_id", nullable = false)
    @JsonIgnoreProperties({"owner", "bookings", "images", "reviews", "favorites", "hibernateLazyInitializer"})
    private Property property;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inquirer_id", nullable = false)
    @JsonIgnoreProperties({"password", "bookings", "inquiries", "favorites", "hibernateLazyInitializer"})
    private User inquirer;

    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private String status;   // "pending", "replied", "closed"

    private String phone;

    @Column(nullable = false)
    private String email;

    // Admin reply fields
    @Column(name = "admin_reply", columnDefinition = "TEXT")
    private String adminReply;

    @Column(name = "reply_date")
    private LocalDateTime replyDate;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
