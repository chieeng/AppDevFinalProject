package com.vacanSee.repository;

import com.vacanSee.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByPropertyId(Long propertyId);
    List<Booking> findByUserId(Long userId);
    List<Booking> findByStatus(String status);
    List<Booking> findByProperty_OwnerId(Long ownerId);

    // Confirmed bookings whose rental period has ended — used by the nightly status revert
    @Query("SELECT b FROM Booking b WHERE b.status = 'confirmed' AND b.checkOutDate <= :today")
    List<Booking> findExpiredConfirmedBookings(@Param("today") LocalDate today);
}
