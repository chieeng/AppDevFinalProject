package com.vacanSee.controller;

import com.vacanSee.dto.UserDTO;
import com.vacanSee.model.Property;
import com.vacanSee.model.User;
import com.vacanSee.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"})
public class UserController {

    @Autowired private UserRepository userRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private InquiryRepository inquiryRepository;
    @Autowired private PropertyReviewRepository reviewRepository;
    @Autowired private PropertyFavoriteRepository favoriteRepository;
    @Autowired private PropertyImageRepository imageRepository;

    private UserDTO toDTO(User u) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setFullName(u.getFullName());
        dto.setPhone(u.getPhone());
        dto.setBio(u.getBio());
        dto.setProfileImage(u.getProfileImage());
        dto.setRole(u.getRole());
        dto.setAccountStatus(u.getAccountStatus());
        dto.setBusinessPermitImage(u.getBusinessPermitImage());
        dto.setCreatedAt(u.getCreatedAt());
        dto.setUpdatedAt(u.getUpdatedAt());
        return dto;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }
        String newRole = body.get("role");
        if (!List.of("TENANT", "OWNER", "ADMIN").contains(newRole)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role — must be TENANT, OWNER, or ADMIN"));
        }
        User u = opt.get();
        u.setRole(newRole);
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Role updated", "userId", id, "role", newRole));
    }

    /** Returns all OWNER accounts that are pending admin approval. */
    @GetMapping("/owner-requests")
    public ResponseEntity<List<UserDTO>> getOwnerRequests() {
        List<UserDTO> pending = userRepository.findAll().stream()
                .filter(u -> "OWNER".equals(u.getRole()) && "pending".equals(u.getAccountStatus()))
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(pending);
    }

    /** Approve or reject a pending owner account. Body: { "accountStatus": "active" | "rejected" } */
    @PatchMapping("/users/{id}/account-status")
    public ResponseEntity<?> updateAccountStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }
        String newStatus = body.get("accountStatus");
        if (!List.of("active", "pending", "rejected").contains(newStatus)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status"));
        }
        User u = opt.get();
        u.setAccountStatus(newStatus);
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Account status updated", "accountStatus", newStatus));
    }

    /**
     * Fully deletes a user and all their owned data in FK-safe order:
     *   1. For each property the user owns → delete its images, favorites, reviews, inquiries, bookings, then the property
     *   2. Delete the user's bookings (as tenant), inquiries, reviews, favorites
     *   3. Delete the user
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        // Step 1: clean up every property this user owns
        List<Property> ownedProperties = propertyRepository.findByOwnerId(id);
        for (Property prop : ownedProperties) {
            Long propId = prop.getId();
            imageRepository.deleteAll(imageRepository.findByPropertyId(propId));
            favoriteRepository.deleteAll(favoriteRepository.findByPropertyId(propId));
            reviewRepository.deleteAll(reviewRepository.findByPropertyId(propId));
            inquiryRepository.deleteAll(inquiryRepository.findByPropertyId(propId));
            bookingRepository.deleteAll(bookingRepository.findByPropertyId(propId));
        }
        propertyRepository.deleteAll(ownedProperties);

        // Step 2: clean up data the user created as a tenant
        bookingRepository.deleteAll(bookingRepository.findByUserId(id));
        inquiryRepository.deleteAll(inquiryRepository.findByInquirerId(id));
        reviewRepository.deleteAll(reviewRepository.findByReviewerId(id));
        favoriteRepository.deleteAll(favoriteRepository.findByUserId(id));

        // Step 3: delete the user itself
        userRepository.deleteById(id);

        return ResponseEntity.ok(Map.of("message", "User and all associated data deleted", "userId", id));
    }
}
