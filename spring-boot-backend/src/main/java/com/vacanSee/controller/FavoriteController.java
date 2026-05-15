package com.vacanSee.controller;

import com.vacanSee.model.PropertyFavorite;
import com.vacanSee.repository.PropertyFavoriteRepository;
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
@RequestMapping("/api/favorites")
@CrossOrigin(origins = {"http://localhost:3000","http://127.0.0.1:3000","http://localhost:3001","http://127.0.0.1:3001"})
public class FavoriteController {

    @Autowired private PropertyFavoriteRepository favoriteRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UserRepository userRepository;

    // GET /api/favorites/user/{userId} — returns array of property IDs (not full objects)
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getFavoritesByUser(@PathVariable Long userId) {
        List<Long> propertyIds = favoriteRepository.findByUserId(userId)
                .stream()
                .map(f -> f.getProperty().getId())
                .collect(Collectors.toList());
        return ResponseEntity.ok(propertyIds);
    }

    // POST /api/favorites — body: { "userId": 1, "propertyId": 3 }
    @PostMapping
    public ResponseEntity<?> addFavorite(@RequestBody Map<String, Long> body) {
        Long userId     = body.get("userId");
        Long propertyId = body.get("propertyId");

        if (userId == null || propertyId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "userId and propertyId required"));
        }

        // Avoid duplicates
        if (favoriteRepository.findByUserIdAndPropertyId(userId, propertyId).isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Already saved", "propertyId", propertyId));
        }

        var user     = userRepository.findById(userId);
        var property = propertyRepository.findById(propertyId);

        if (user.isEmpty() || property.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Property not found"));
        }

        PropertyFavorite fav = new PropertyFavorite();
        fav.setUser(user.get());
        fav.setProperty(property.get());
        favoriteRepository.save(fav);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Saved", "propertyId", propertyId));
    }

    // DELETE /api/favorites?userId=1&propertyId=3
    @DeleteMapping
    public ResponseEntity<?> removeFavorite(@RequestParam Long userId, @RequestParam Long propertyId) {
        var existing = favoriteRepository.findByUserIdAndPropertyId(userId, propertyId);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Favorite not found"));
        }
        favoriteRepository.delete(existing.get());
        return ResponseEntity.ok(Map.of("message", "Removed", "propertyId", propertyId));
    }
}
