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
import java.util.UUID;

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

        String role = registerRequest.getRole();
        if (role == null || role.isBlank()) role = "TENANT";
        role = role.toUpperCase();
        if (!role.equals("TENANT") && !role.equals("LANDLORD")) role = "TENANT";

        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFullName(registerRequest.getFullName());
        user.setPhone(registerRequest.getPhone());
        user.setRole(role);

        User savedUser = userRepository.save(user);

        AuthResponseDTO response = new AuthResponseDTO();
        response.setUserId(savedUser.getId());
        response.setEmail(savedUser.getEmail());
        response.setFullName(savedUser.getFullName());
        response.setRole(savedUser.getRole());
        response.setMessage("User registered successfully");

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
        AuthResponseDTO response = new AuthResponseDTO();
        response.setUserId(loggedInUser.getId());
        response.setEmail(loggedInUser.getEmail());
        response.setFullName(loggedInUser.getFullName());
        response.setRole(loggedInUser.getRole() != null ? loggedInUser.getRole() : "TENANT");
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
        userDTO.setCreatedAt(userData.getCreatedAt());
        userDTO.setUpdatedAt(userData.getUpdatedAt());

        return ResponseEntity.ok(userDTO);
    }

    // PUT /api/auth/user/{id} — update profile (fullName, phone, bio, profileImage)
    @PutMapping("/user/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }
        User user = opt.get();
        if (body.containsKey("fullName")     && body.get("fullName")     != null) user.setFullName(body.get("fullName").trim());
        if (body.containsKey("phone")        && body.get("phone")        != null) user.setPhone(body.get("phone").trim());
        if (body.containsKey("bio")          && body.get("bio")          != null) user.setBio(body.get("bio").trim());
        if (body.containsKey("profileImage") && body.get("profileImage") != null) user.setProfileImage(body.get("profileImage"));

        User saved = userRepository.save(user);

        UserDTO dto = new UserDTO();
        dto.setId(saved.getId());
        dto.setEmail(saved.getEmail());
        dto.setFullName(saved.getFullName());
        dto.setPhone(saved.getPhone());
        dto.setBio(saved.getBio());
        dto.setProfileImage(saved.getProfileImage());
        dto.setCreatedAt(saved.getCreatedAt());
        dto.setUpdatedAt(saved.getUpdatedAt());
        return ResponseEntity.ok(dto);
    }

    // PATCH /api/auth/user/{id}/password — change password
    @PatchMapping("/user/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (oldPassword == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "New password must be at least 6 characters"));
        }
        User user = opt.get();
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Current password is incorrect"));
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    // POST /api/auth/forgot-password — generate a temp password and return it
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        var opt = userRepository.findByEmail(email.trim());
        if (opt.isEmpty()) {
            // Return generic message to avoid email enumeration
            return ResponseEntity.ok(Map.of("message", "If this email is registered, a temporary password has been sent."));
        }
        // Generate a readable temp password
        String tempPassword = "Temp" + UUID.randomUUID().toString().replace("-", "").substring(0, 6);
        User user = opt.get();
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(user);
        // In a real app this would be emailed — here we return it directly for the demo
        return ResponseEntity.ok(Map.of(
            "message", "Temporary password generated. Use it to log in, then change your password.",
            "tempPassword", tempPassword
        ));
    }
}
