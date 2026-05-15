package com.vacanSee.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Safe DTO for Booking responses.
 * Only exposes what the frontend needs — no password, no circular refs.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingDTO {
    private Long id;

    // Property info
    private Long propertyId;
    private String propertyTitle;
    private BigDecimal propertyPrice;
    private String propertyCity;

    // User info
    private Long userId;
    private String userName;
    private String userEmail;

    // Booking details
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer numberOfGuests;
    private BigDecimal totalPrice;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
}
