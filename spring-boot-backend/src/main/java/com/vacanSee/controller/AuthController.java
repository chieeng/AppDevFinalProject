package com.vacanSee.controller;

import com.vacanSee.model.User;
import com.vacanSee.dto.*;
import com.vacanSee.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"})
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already registered"));
        }

        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFullName(registerRequest.getFullName());
        user.setPhone(registerRequest.getPhone());
        // Accept TENANT or OWNER; anything else (or null) defaults to TENANT
        String reqRole = registerRequest.getRole();
        boolean isOwner = "OWNER".equalsIgnoreCase(reqRole);
        user.setRole(isOwner ? "OWNER" : "TENANT");

        // Owners need admin approval before they can log in
        if (isOwner) {
            user.setAccountStatus("pending");
            if (registerRequest.getBusinessPermitImage() != null && !registerRequest.getBusinessPermitImage().isBlank()) {
                user.setBusinessPermitImage(registerRequest.getBusinessPermitImage());
            }
        } else {
            user.setAccountStatus("active");
        }

        User savedUser = userRepository.save(user);

        AuthResponseDTO response = new AuthResponseDTO();
        response.setUserId(savedUser.getId());
        response.setEmail(savedUser.getEmail());
        response.setFullName(savedUser.getFullName());
        response.setRole(savedUser.getRole());
        response.setAccountStatus(savedUser.getAccountStatus());
        response.setMessage(isOwner
            ? "Owner account submitted for review. Please wait for admin approval."
            : "User registered successfully");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequestDTO loginRequest) {
        var user = userRepository.findByEmail(loginRequest.getEmail());

        if (user.isEmpty() || !passwordEncoder.matches(loginRequest.getPassword(), user.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }

        User loggedInUser = user.get();

        // Block owners who haven't been approved yet
        String accountStatus = loggedInUser.getAccountStatus();
        if ("pending".equals(accountStatus)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Your owner account is pending admin approval. You will be notified once approved."));
        }
        if ("rejected".equals(accountStatus)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Your owner account application was rejected. Please contact support for assistance."));
        }

        AuthResponseDTO response = new AuthResponseDTO();
        response.setUserId(loggedInUser.getId());
        response.setEmail(loggedInUser.getEmail());
        response.setFullName(loggedInUser.getFullName());
        response.setRole(loggedInUser.getRole());
        response.setAccountStatus(loggedInUser.getAccountStatus());
        response.setMessage("Login successful");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{id}")
    @SuppressWarnings("null")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        var user = userRepository.findById(id);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        User userData = user.get();
        UserDTO userDTO = new UserDTO();
        userDTO.setId(userData.getId());
        userDTO.setEmail(userData.getEmail());
        userDTO.setFullName(userData.getFullName());
        userDTO.setPhone(userData.getPhone());
        userDTO.setBio(userData.getBio());
        userDTO.setProfileImage(userData.getProfileImage());
        userDTO.setRole(userData.getRole());
        userDTO.setCreatedAt(userData.getCreatedAt());
        userDTO.setUpdatedAt(userData.getUpdatedAt());

        return ResponseEntity.ok(userDTO);
    }

    // PATCH /api/auth/user/{id} — update profile fields
    @PatchMapping("/user/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }
        User u = opt.get();
        if (body.containsKey("fullName") && !body.get("fullName").isBlank()) u.setFullName(body.get("fullName"));
        if (body.containsKey("phone"))  u.setPhone(body.get("phone"));
        if (body.containsKey("bio"))    u.setBio(body.get("bio"));
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Profile updated", "fullName", u.getFullName()));
    }
}
