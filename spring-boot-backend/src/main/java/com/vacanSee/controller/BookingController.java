package com.vacanSee.controller;

import com.vacanSee.dto.BookingDTO;
import com.vacanSee.model.Booking;
import com.vacanSee.repository.BookingRepository;
import com.vacanSee.repository.PropertyRepository;
import com.vacanSee.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"})
public class BookingController {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UserRepository userRepository;

    // ── GET all bookings (admin view) ─────────────────
    @GetMapping
    public ResponseEntity<?> getAllBookings() {
        List<BookingDTO> dtos = bookingRepository.findAll()
                .stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ── GET single booking ────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getBooking(@PathVariable Long id) {
        return bookingRepository.findById(id)
                .<ResponseEntity<?>>map(b -> ResponseEntity.ok(toDTO(b)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Booking not found")));
    }

    // ── POST — create booking ─────────────────────────
    // Body: { "property": {"id": 1}, "user": {"id": 2},
    //         "checkInDate": "2025-06-01", "checkOutDate": "2025-07-01",
    //         "numberOfGuests": 1, "totalPrice": 3500,
    //         "status": "pending", "notes": "..." }
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        if (booking.getProperty() == null || booking.getProperty().getId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "property.id is required"));
        }
        if (booking.getUser() == null || booking.getUser().getId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "user.id is required"));
        }

        var property = propertyRepository.findById(booking.getProperty().getId());
        var user     = userRepository.findById(booking.getUser().getId());

        if (property.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Property not found (id=" + booking.getProperty().getId() + ")"));
        }
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found (id=" + booking.getUser().getId() + ")"));
        }

        // Prevent double booking: block if user already has a pending or confirmed booking for this property
        // Allow rebooking after rejection or cancellation
        boolean alreadyBooked = bookingRepository
                .findByUserIdAndPropertyId(user.get().getId(), property.get().getId())
                .stream()
                .anyMatch(b -> "pending".equals(b.getStatus()) || "confirmed".equals(b.getStatus()));
        if (alreadyBooked) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "You already have an active booking for this property."));
        }

        booking.setProperty(property.get());
        booking.setUser(user.get());
        booking.setStatus(booking.getStatus() != null ? booking.getStatus() : "pending");

        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(saved));
    }

    // ── PATCH status only — admin approve / reject ────
    // Body: { "status": "confirmed" }
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        var opt = bookingRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Booking not found"));
        }
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "status field is required"));
        }
        Booking b = opt.get();
        b.setStatus(status);
        return ResponseEntity.ok(toDTO(bookingRepository.save(b)));
    }

    // ── PUT full update ───────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBooking(
            @PathVariable Long id,
            @RequestBody Booking bookingDetails) {

        var opt = bookingRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Booking not found"));
        }
        Booking b = opt.get();
        if (bookingDetails.getCheckInDate()    != null) b.setCheckInDate(bookingDetails.getCheckInDate());
        if (bookingDetails.getCheckOutDate()   != null) b.setCheckOutDate(bookingDetails.getCheckOutDate());
        if (bookingDetails.getNumberOfGuests() != null) b.setNumberOfGuests(bookingDetails.getNumberOfGuests());
        if (bookingDetails.getTotalPrice()     != null) b.setTotalPrice(bookingDetails.getTotalPrice());
        if (bookingDetails.getStatus()         != null) b.setStatus(bookingDetails.getStatus());
        if (bookingDetails.getNotes()          != null) b.setNotes(bookingDetails.getNotes());
        return ResponseEntity.ok(toDTO(bookingRepository.save(b)));
    }

    // ── PATCH cancel — tenant cancels their own booking ──
    // Only allowed if status is "pending" or "confirmed"; already-cancelled bookings are rejected
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        var opt = bookingRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Booking not found"));
        }
        Booking b = opt.get();
        if ("cancelled".equals(b.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Booking is already cancelled"));
        }
        if ("rejected".equals(b.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Rejected bookings cannot be cancelled"));
        }
        b.setStatus("cancelled");
        return ResponseEntity.ok(toDTO(bookingRepository.save(b)));
    }

    // ── DELETE ────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long id) {
        if (!bookingRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Booking not found"));
        }
        bookingRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Booking deleted"));
    }

    // ── GET by user ───────────────────────────────────
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getBookingsByUser(@PathVariable Long userId) {
        List<BookingDTO> dtos = bookingRepository.findByUserId(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ── GET by property ───────────────────────────────
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<?> getBookingsByProperty(@PathVariable Long propertyId) {
        List<BookingDTO> dtos = bookingRepository.findByPropertyId(propertyId)
                .stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ── GET check confirmed booking (used by review gate) ─────────────────
    // Returns { hasConfirmedBooking: true/false }
    @GetMapping("/check")
    public ResponseEntity<?> checkConfirmedBooking(
            @RequestParam Long userId,
            @RequestParam Long propertyId) {
        boolean has = bookingRepository
                .findByUserIdAndPropertyId(userId, propertyId)
                .stream()
                .anyMatch(b -> "confirmed".equals(b.getStatus()));
        return ResponseEntity.ok(Map.of("hasConfirmedBooking", has));
    }

    // ── GET by status ─────────────────────────────────
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getBookingsByStatus(@PathVariable String status) {
        List<BookingDTO> dtos = bookingRepository.findByStatus(status)
                .stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ── GET by owner (admin — sees all bookings for their properties) ──
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<?> getBookingsByOwner(@PathVariable Long ownerId) {
        List<Booking> bookings = new ArrayList<>();
        propertyRepository.findByOwnerId(ownerId)
                .forEach(p -> bookings.addAll(bookingRepository.findByPropertyId(p.getId())));
        List<BookingDTO> dtos = bookings.stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ── DTO converter ─────────────────────────────────
    private BookingDTO toDTO(Booking b) {
        BookingDTO dto = new BookingDTO();
        dto.setId(b.getId());
        if (b.getProperty() != null) {
            dto.setPropertyId(b.getProperty().getId());
            dto.setPropertyTitle(b.getProperty().getTitle());
            dto.setPropertyPrice(b.getProperty().getPrice());
            dto.setPropertyCity(b.getProperty().getCity());
        }
        if (b.getUser() != null) {
            dto.setUserId(b.getUser().getId());
            dto.setUserName(b.getUser().getFullName());
            dto.setUserEmail(b.getUser().getEmail());
        }
        dto.setCheckInDate(b.getCheckInDate());
        dto.setCheckOutDate(b.getCheckOutDate());
        dto.setNumberOfGuests(b.getNumberOfGuests());
        dto.setTotalPrice(b.getTotalPrice());
        dto.setStatus(b.getStatus());
        dto.setNotes(b.getNotes());
        dto.setCreatedAt(b.getCreatedAt());
        return dto;
    }
}
