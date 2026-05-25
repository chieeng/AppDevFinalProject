package com.vacanSee.scheduler;

import com.vacanSee.model.Booking;
import com.vacanSee.model.Property;
import com.vacanSee.repository.BookingRepository;
import com.vacanSee.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Runs every hour and reverts any property whose confirmed booking
 * has expired (checkOutDate <= today) back to "available".
 */
@Component
public class PropertyStatusScheduler {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private PropertyRepository propertyRepository;

    // Also run once 10 seconds after startup to catch any expirations missed while the server was down
    @Scheduled(initialDelay = 10_000, fixedRate = 3_600_000)
    public void revertExpiredBookings() {
        LocalDate today = LocalDate.now();
        List<Booking> expired = bookingRepository.findExpiredConfirmedBookings(today);

        for (Booking booking : expired) {
            Property property = booking.getProperty();
            if (property == null) continue;

            if ("occupied".equals(property.getStatus())) {
                property.setStatus("available");
                propertyRepository.save(property);
            }

            // Mark booking as completed so it no longer participates in expiry scans
            booking.setStatus("completed");
            bookingRepository.save(booking);
        }

        if (!expired.isEmpty()) {
            System.out.printf("[Scheduler] Reverted %d expired booking(s) to available%n", expired.size());
        }
    }
}
