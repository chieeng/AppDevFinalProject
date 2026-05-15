package com.vacanSee.repository;

import com.vacanSee.model.PropertyReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PropertyReviewRepository extends JpaRepository<PropertyReview, Long> {
    List<PropertyReview> findByPropertyId(Long propertyId);
    List<PropertyReview> findByUserId(Long userId);
}
