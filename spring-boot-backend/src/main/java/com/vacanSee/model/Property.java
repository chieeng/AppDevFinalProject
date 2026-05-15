package com.vacanSee.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "properties")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"password", "bookings", "inquiries", "favorites", "hibernateLazyInitializer"})
    private User owner;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "property_type")
    private String propertyType;

    @Column(nullable = false)
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

    @Column(name = "year_built")
    private Integer yearBuilt;

    @Column(name = "has_parking")
    private Boolean hasParking = false;

    @Column(name = "has_gym")
    private Boolean hasGym = false;

    @Column(name = "has_pool")
    private Boolean hasPool = false;

    @Column(name = "has_garden")
    private Boolean hasGarden = false;

    @Column(name = "has_balcony")
    private Boolean hasBalcony = false;

    // New amenity fields used by the frontend filters
    @Column(name = "has_wifi")
    private Boolean hasWifi = false;

    @Column(name = "has_meals")
    private Boolean hasMeals = false;

    @Column(name = "pet_friendly")
    private Boolean petFriendly = false;

    @Column(name = "featured_image", columnDefinition = "LONGTEXT")
    private String featuredImage;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
