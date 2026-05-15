package com.vacanSee.repository;

import com.vacanSee.model.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    List<Inquiry> findByPropertyId(Long propertyId);
    List<Inquiry> findByInquirerId(Long inquirerId);
    List<Inquiry> findByStatus(String status);
}
