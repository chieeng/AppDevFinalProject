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

        booking.setProperty(property.get());
        booking.setUser(user.get());
        booking.setStatus(booking.getStatus() != null ? booking.getStatus() : "pending");

        // ── Conflict check: a tenant with an approved (confirmed) booking cannot
        //    book another property whose dates overlap with their active stay.
        if (booking.getCheckInDate() != null && booking.getCheckOutDate() != null) {
            List<Booking> confirmed = bookingRepository.findByUserId(booking.getUser().getId())
                    .stream()
                    .filter(b -> "confirmed".equals(b.getStatus()))
                    .collect(Collectors.toList());

            for (Booking existing : confirmed) {
                if (existing.getCheckInDate() == null || existing.getCheckOutDate() == null) continue;
                // Standard interval overlap: newStart < existEnd && newEnd > existStart
                boolean overlaps = booking.getCheckInDate().isBefore(existing.getCheckOutDate())
                        && booking.getCheckOutDate().isAfter(existing.getCheckInDate());
                if (overlaps) {
                    String msg = "You already have a confirmed stay at \""
                            + existing.getProperty().getTitle() + "\" ("
                            + existing.getCheckInDate() + " – " + existing.getCheckOutDate()
                            + "). You cannot book another property while an approved stay is ongoing.";
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", msg));
                }
            }
        }

        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(saved));
    }

    // ── PATCH status only — admin approve/reject, owner approve/reject their own ──
    // Body: { "status": "confirmed", "requesterId": 5 }
    // If requesterId is provided, validates the booking belongs to that owner's property.
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        var opt = bookingRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Booking not found"));
        }
        String status = (String) body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "status field is required"));
        }
        Booking b = opt.get();

        // Ownership check: if requesterId is supplied, ensure this is their property
        Object requesterIdRaw = body.get("requesterId");
        if (requesterIdRaw != null) {
            Long requesterId = Long.valueOf(requesterIdRaw.toString());
            Long propertyOwnerId = b.getProperty().getOwner().getId();
            if (!propertyOwnerId.equals(requesterId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "You do not own this property"));
            }
        }

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

    // ── GET by status ─────────────────────────────────
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getBookingsByStatus(@PathVariable String status) {
        List<BookingDTO> dtos = bookingRepository.findByStatus(status)
                .stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ── GET by owner — all bookings across all properties owned by this user ──
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<?> getBookingsByOwner(@PathVariable Long ownerId) {
        List<BookingDTO> dtos = bookingRepository.findByProperty_OwnerId(ownerId)
                .stream().map(this::toDTO).collect(Collectors.toList());
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
