package com.vacanSee.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDTO {
    private Long id;
    private Long propertyId;
    private String propertyTitle;
    private Long userId;
    private String userName;
    private Integer rating;     // 1-5
    private String comment;
    private LocalDateTime createdAt;
}
