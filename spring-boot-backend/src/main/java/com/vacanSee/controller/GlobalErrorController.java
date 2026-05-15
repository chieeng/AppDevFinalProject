package com.vacanSee.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/error")
public class GlobalErrorController {

    @RequestMapping("")
    public ResponseEntity<?> handleError(HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        Object status = request.getAttribute("javax.servlet.error.status_code");
        Object message = request.getAttribute("javax.servlet.error.message");
        Object path = request.getAttribute("javax.servlet.error.request_uri");

        response.put("timestamp", System.currentTimeMillis());
        response.put("status", status != null ? status : 500);
        response.put("message", message != null ? message : "An error occurred");
        response.put("path", path != null ? path : request.getRequestURI());

        int statusCode = status != null ? Integer.parseInt(status.toString()) : 500;
        
        if (statusCode == 404) {
            response.put("error", "Resource not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        return ResponseEntity.status(statusCode).body(response);
    }
}
