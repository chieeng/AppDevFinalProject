package com.vacanSee.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyDTO {
    private Long id;
    private Long ownerId;
    private String title;
    private String description;
    private BigDecimal price;
    private String propertyType;
    private String status;
    private String location;
    private String city;
    private String state;
    private String country;
    private Float latitude;
    private Float longitude;
    private Integer bedrooms;
    private Integer bathrooms;
    private Float areaSqft;
    private Integer yearBuilt;
    private Boolean hasParking;
    private Boolean hasGym;
    private Boolean hasPool;
    private Boolean hasGarden;
    private Boolean hasBalcony;
    // New fields added to match Property model
    private Boolean hasWifi;
    private Boolean hasMeals;
    private Boolean petFriendly;
    private String featuredImage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
