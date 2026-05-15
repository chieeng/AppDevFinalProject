package com.vacanSee.repository;

import com.vacanSee.model.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {
    List<Property> findByOwnerId(Long ownerId);
    Page<Property> findByCity(String city, Pageable pageable);
    Page<Property> findByStatus(String status, Pageable pageable);
    List<Property> findByPropertyType(String propertyType);
}
