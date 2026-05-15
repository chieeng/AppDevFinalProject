package com.vacanSee.controller;

import com.vacanSee.model.Property;
import com.vacanSee.dto.PropertyDTO;
import com.vacanSee.repository.PropertyRepository;
import com.vacanSee.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"})
public class PropertyController {

    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UserRepository userRepository;

    // GET /api/properties?page=0&size=100
    @GetMapping
    public ResponseEntity<?> getAllProperties(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        Pageable pageable = PageRequest.of(page, size);
        var properties = propertyRepository.findAll(pageable);
        // Return as DTO list inside a page-like wrapper so frontend can handle both shapes
        var dtoList = properties.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of(
            "content", dtoList,
            "totalElements", properties.getTotalElements(),
            "totalPages", properties.getTotalPages()
        ));
    }

    // GET /api/properties/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getProperty(@PathVariable Long id) {
        var property = propertyRepository.findById(id);
        if (property.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Property not found"));
        }
        return ResponseEntity.ok(convertToDTO(property.get()));
    }

    // POST /api/properties
    @PostMapping
    public ResponseEntity<?> createProperty(@RequestBody PropertyDTO propertyDTO) {
        var owner = userRepository.findById(propertyDTO.getOwnerId());
        if (owner.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Owner not found (ownerId=" + propertyDTO.getOwnerId() + ")"));
        }

        Property property = new Property();
        property.setOwner(owner.get());
        property.setTitle(propertyDTO.getTitle());
        property.setDescription(propertyDTO.getDescription());
        property.setPrice(propertyDTO.getPrice());
        property.setPropertyType(propertyDTO.getPropertyType());
        property.setStatus(propertyDTO.getStatus() != null ? propertyDTO.getStatus() : "available");
        property.setLocation(propertyDTO.getLocation());
        property.setCity(propertyDTO.getCity());
        property.setState(propertyDTO.getState());
        property.setCountry(propertyDTO.getCountry() != null ? propertyDTO.getCountry() : "Philippines");
        property.setLatitude(propertyDTO.getLatitude());
        property.setLongitude(propertyDTO.getLongitude());
        property.setBedrooms(propertyDTO.getBedrooms());
        property.setBathrooms(propertyDTO.getBathrooms());
        property.setAreaSqft(propertyDTO.getAreaSqft());
        property.setYearBuilt(propertyDTO.getYearBuilt());
        property.setHasParking(bool(propertyDTO.getHasParking()));
        property.setHasGym(bool(propertyDTO.getHasGym()));
        property.setHasPool(bool(propertyDTO.getHasPool()));
        property.setHasGarden(bool(propertyDTO.getHasGarden()));
        property.setHasBalcony(bool(propertyDTO.getHasBalcony()));
        property.setHasWifi(bool(propertyDTO.getHasWifi()));
        property.setHasMeals(bool(propertyDTO.getHasMeals()));
        property.setPetFriendly(bool(propertyDTO.getPetFriendly()));
        property.setFeaturedImage(propertyDTO.getFeaturedImage());

        Property saved = propertyRepository.save(property);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(saved));
    }

    // PUT /api/properties/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProperty(@PathVariable Long id, @RequestBody PropertyDTO dto) {
        var opt = propertyRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Property not found"));
        }
        Property p = opt.get();
        if (dto.getTitle()        != null) p.setTitle(dto.getTitle());
        if (dto.getDescription()  != null) p.setDescription(dto.getDescription());
        if (dto.getPrice()        != null) p.setPrice(dto.getPrice());
        if (dto.getStatus()       != null) p.setStatus(dto.getStatus());
        if (dto.getPropertyType() != null) p.setPropertyType(dto.getPropertyType());
        if (dto.getLocation()     != null) p.setLocation(dto.getLocation());
        if (dto.getCity()         != null) p.setCity(dto.getCity());
        if (dto.getState()        != null) p.setState(dto.getState());
        if (dto.getBedrooms()     != null) p.setBedrooms(dto.getBedrooms());
        if (dto.getBathrooms()    != null) p.setBathrooms(dto.getBathrooms());
        if (dto.getAreaSqft()     != null) p.setAreaSqft(dto.getAreaSqft());
        if (dto.getYearBuilt()    != null) p.setYearBuilt(dto.getYearBuilt());
        if (dto.getHasParking()   != null) p.setHasParking(dto.getHasParking());
        if (dto.getHasGym()       != null) p.setHasGym(dto.getHasGym());
        if (dto.getHasPool()      != null) p.setHasPool(dto.getHasPool());
        if (dto.getHasGarden()    != null) p.setHasGarden(dto.getHasGarden());
        if (dto.getHasBalcony()   != null) p.setHasBalcony(dto.getHasBalcony());
        if (dto.getHasWifi()      != null) p.setHasWifi(dto.getHasWifi());
        if (dto.getHasMeals()     != null) p.setHasMeals(dto.getHasMeals());
        if (dto.getPetFriendly()  != null) p.setPetFriendly(dto.getPetFriendly());
        return ResponseEntity.ok(convertToDTO(propertyRepository.save(p)));
    }

    // DELETE /api/properties/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProperty(@PathVariable Long id) {
        if (!propertyRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Property not found"));
        }
        propertyRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Property deleted successfully"));
    }

    // GET /api/properties/owner/{ownerId}
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<?> getPropertiesByOwner(@PathVariable Long ownerId) {
        List<PropertyDTO> dtos = propertyRepository.findByOwnerId(ownerId).stream()
                .map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // GET /api/properties/city/{city}
    @GetMapping("/city/{city}")
    public ResponseEntity<?> getPropertiesByCity(
            @PathVariable String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        var props = propertyRepository.findByCity(city, pageable);
        var dtos = props.getContent().stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("content", dtos, "totalElements", props.getTotalElements()));
    }

    // ── helper ───────────────────────────────────
    private boolean bool(Boolean b) { return b != null && b; }

    private PropertyDTO convertToDTO(Property p) {
        PropertyDTO dto = new PropertyDTO();
        dto.setId(p.getId());
        dto.setOwnerId(p.getOwner().getId());
        dto.setTitle(p.getTitle());
        dto.setDescription(p.getDescription());
        dto.setPrice(p.getPrice());
        dto.setPropertyType(p.getPropertyType());
        dto.setStatus(p.getStatus());
        dto.setLocation(p.getLocation());
        dto.setCity(p.getCity());
        dto.setState(p.getState());
        dto.setCountry(p.getCountry());
        dto.setLatitude(p.getLatitude());
        dto.setLongitude(p.getLongitude());
        dto.setBedrooms(p.getBedrooms());
        dto.setBathrooms(p.getBathrooms());
        dto.setAreaSqft(p.getAreaSqft());
        dto.setYearBuilt(p.getYearBuilt());
        dto.setHasParking(p.getHasParking());
        dto.setHasGym(p.getHasGym());
        dto.setHasPool(p.getHasPool());
        dto.setHasGarden(p.getHasGarden());
        dto.setHasBalcony(p.getHasBalcony());
        dto.setHasWifi(p.getHasWifi());
        dto.setHasMeals(p.getHasMeals());
        dto.setPetFriendly(p.getPetFriendly());
        dto.setFeaturedImage(p.getFeaturedImage());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }
}
