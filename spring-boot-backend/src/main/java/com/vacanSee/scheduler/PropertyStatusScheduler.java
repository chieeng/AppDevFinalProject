package com.vacanSee.scheduler;

import com.vacanSee.model.Booking;
import com.vacanSee.model.Property;
import com.vacanSee.repository.BookingRepository;
import com.vacanSee.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Runs every 60 seconds and reverts any property whose confirmed booking
 * has expired (checkOutDate <= today) back to "available".
 *
 * Also exposed as POST /api/admin/sync-status so the admin dashboard
 * can trigger an immediate check without waiting for the next tick.
 */
@Component
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"})
public class PropertyStatusScheduler {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private PropertyRepository propertyRepository;

    // Run every 60 seconds so expired rentals are detected quickly.
    // Also fires immediately (initialDelay = 0) on startup.
    @Scheduled(initialDelay = 0, fixedRate = 60_000)
    public void revertExpiredBookings() {
        doRevert();
    }

    // Manual trigger — admin hits this when they want an immediate check
    @PostMapping("/sync-status")
    public ResponseEntity<?> syncNow() {
        int count = doRevert();
        return ResponseEntity.ok(Map.of(
            "message", count == 0
                ? "No expired bookings found — all listings are up to date."
                : count + " expired booking(s) reverted to available.",
            "reverted", count
        ));
    }

    private int doRevert() {
        LocalDate today = LocalDate.now();
        List<Booking> expired = bookingRepository.findExpiredConfirmedBookings(today);

        for (Booking booking : expired) {
            Property property = booking.getProperty();
            if (property == null) continue;

            if ("occupied".equals(property.getStatus())) {
                property.setStatus("available");
                propertyRepository.save(property);
            }

            booking.setStatus("completed");
            bookingRepository.save(booking);
        }

        if (!expired.isEmpty()) {
            System.out.printf("[Scheduler] Reverted %d expired booking(s) to available%n", expired.size());
        }
        return expired.size();
    }
}
