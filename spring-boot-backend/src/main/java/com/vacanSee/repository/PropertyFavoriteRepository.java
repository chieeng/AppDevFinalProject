package com.vacanSee.repository;

import com.vacanSee.model.PropertyFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyFavoriteRepository extends JpaRepository<PropertyFavorite, Long> {
    List<PropertyFavorite> findByUserId(Long userId);
    List<PropertyFavorite> findByPropertyId(Long propertyId);
    Optional<PropertyFavorite> findByUserIdAndPropertyId(Long userId, Long propertyId);
}
