package com.vacanSee.repository;

import com.vacanSee.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByPropertyId(Long propertyId);
    List<Booking> findByUserId(Long userId);
    List<Booking> findByStatus(String status);
    // Traverse property → owner → id to fetch all bookings for an owner's properties
    List<Booking> findByProperty_OwnerId(Long ownerId);
}
