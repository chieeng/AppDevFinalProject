package com.vacanSee.controller;

import com.vacanSee.model.Inquiry;
import com.vacanSee.repository.InquiryRepository;
import com.vacanSee.repository.PropertyRepository;
import com.vacanSee.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inquiries")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"})
public class InquiryController {

    @Autowired private InquiryRepository inquiryRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UserRepository userRepository;

    // GET /api/inquiries  — all inquiries (admin)
    @GetMapping
    public ResponseEntity<?> getAllInquiries() {
        return ResponseEntity.ok(inquiryRepository.findAll());
    }

    // GET /api/inquiries/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getInquiry(@PathVariable Long id) {
        return inquiryRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Inquiry not found")));
    }

    // POST /api/inquiries
    // Body: { "property": {"id": 1}, "inquirer": {"id": 2},
    //         "subject": "...", "message": "...", "email": "...", "phone": "..." }
    @PostMapping
    public ResponseEntity<?> createInquiry(@RequestBody Inquiry inquiry) {
        var property = propertyRepository.findById(inquiry.getProperty().getId());
        var user = userRepository.findById(inquiry.getInquirer().getId());

        if (property.isEmpty() || user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Property or User not found"));
        }

        inquiry.setProperty(property.get());
        inquiry.setInquirer(user.get());
        inquiry.setStatus("pending");
        inquiry.setIsRead(false);
        // Default subject if not provided
        if (inquiry.getSubject() == null || inquiry.getSubject().isBlank()) {
            inquiry.setSubject("Inquiry about " + property.get().getTitle());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(inquiryRepository.save(inquiry));
    }

    // PUT /api/inquiries/{id}  — general update
    @PutMapping("/{id}")
    public ResponseEntity<?> updateInquiry(@PathVariable Long id, @RequestBody Inquiry inquiryDetails) {
        var opt = inquiryRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Inquiry not found"));
        }
        Inquiry existing = opt.get();
        if (inquiryDetails.getSubject() != null) existing.setSubject(inquiryDetails.getSubject());
        if (inquiryDetails.getMessage() != null) existing.setMessage(inquiryDetails.getMessage());
        if (inquiryDetails.getStatus()  != null) existing.setStatus(inquiryDetails.getStatus());
        if (inquiryDetails.getPhone()   != null) existing.setPhone(inquiryDetails.getPhone());
        if (inquiryDetails.getEmail()   != null) existing.setEmail(inquiryDetails.getEmail());
        return ResponseEntity.ok(inquiryRepository.save(existing));
    }

    // PATCH /api/inquiries/{id}/reply  — admin sends a reply
    // Body: { "reply": "Thank you for your inquiry..." }
    @PatchMapping("/{id}/reply")
    public ResponseEntity<?> replyToInquiry(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var opt = inquiryRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Inquiry not found"));
        }
        String reply = body.get("reply");
        if (reply == null || reply.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "reply field is required"));
        }
        Inquiry inquiry = opt.get();
        inquiry.setAdminReply(reply);
        inquiry.setReplyDate(LocalDateTime.now());
        inquiry.setStatus("replied");
        inquiry.setIsRead(true);
        return ResponseEntity.ok(inquiryRepository.save(inquiry));
    }

    // PATCH /api/inquiries/{id}/read  — mark inquiry as read
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        var opt = inquiryRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Inquiry not found"));
        }
        Inquiry inquiry = opt.get();
        inquiry.setIsRead(true);
        return ResponseEntity.ok(inquiryRepository.save(inquiry));
    }

    // DELETE /api/inquiries/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInquiry(@PathVariable Long id) {
        if (!inquiryRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Inquiry not found"));
        }
        inquiryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Inquiry deleted"));
    }

    // GET /api/inquiries/property/{propertyId}
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<?> getByProperty(@PathVariable Long propertyId) {
        return ResponseEntity.ok(inquiryRepository.findByPropertyId(propertyId));
    }

    // GET /api/inquiries/user/{userId}  — inquiries sent by a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(inquiryRepository.findByInquirerId(userId));
    }

    // GET /api/inquiries/status/{status}
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(inquiryRepository.findByStatus(status));
    }

    // GET /api/inquiries/owner/{ownerId} — all inquiries for properties owned by this user
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<?> getByOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(inquiryRepository.findByProperty_OwnerId(ownerId));
    }
}
