package com.vacanSee.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String bio;
    private String profileImage;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
