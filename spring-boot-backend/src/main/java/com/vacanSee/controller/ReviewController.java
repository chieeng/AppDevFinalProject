package com.vacanSee.controller;

import com.vacanSee.model.PropertyReview;
import com.vacanSee.dto.ReviewDTO;
import com.vacanSee.repository.PropertyReviewRepository;
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
@RequestMapping("/api/reviews")
@CrossOrigin(origins = {"http://localhost:3000","http://127.0.0.1:3000","http://localhost:3001","http://127.0.0.1:3001"})
public class ReviewController {

    @Autowired private PropertyReviewRepository reviewRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UserRepository userRepository;

    // GET /api/reviews/property/{propertyId}
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<?> getByProperty(@PathVariable Long propertyId) {
        List<ReviewDTO> dtos = reviewRepository.findByPropertyId(propertyId)
                .stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // POST /api/reviews — body: { propertyId, userId, rating, comment }
    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Map<String, Object> body) {
        Long propertyId = Long.valueOf(body.get("propertyId").toString());
        Long userId     = Long.valueOf(body.get("userId").toString());
        Integer rating  = Integer.valueOf(body.get("rating").toString());
        String comment  = body.getOrDefault("comment", "").toString();

        var property = propertyRepository.findById(propertyId);
        var user     = userRepository.findById(userId);

        if (property.isEmpty() || user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Property or User not found"));
        }

        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("message", "Rating must be between 1 and 5"));
        }

        PropertyReview review = new PropertyReview();
        review.setProperty(property.get());
        review.setReviewer(user.get());
        review.setRating(rating);
        review.setComment(comment);

        PropertyReview saved = reviewRepository.save(review);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(saved));
    }

    // DELETE /api/reviews/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        if (!reviewRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Review not found"));
        }
        reviewRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Review deleted"));
    }

    private ReviewDTO toDTO(PropertyReview r) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(r.getId());
        if (r.getProperty() != null) { dto.setPropertyId(r.getProperty().getId()); dto.setPropertyTitle(r.getProperty().getTitle()); }
        if (r.getReviewer()  != null) { dto.setUserId(r.getReviewer().getId()); dto.setUserName(r.getReviewer().getFullName()); }
        dto.setRating(r.getRating());
        dto.setComment(r.getComment());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
