package com.jhub.backend.controller;

import com.jhub.backend.dto.HealthResponse;
import java.time.LocalDateTime;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Controller for health check endpoints */
@RestController
@RequestMapping("/api/health")
public class HealthController {

  /**
   * Basic health check endpoint
   *
   * @return ResponseEntity containing health status and timestamp
   */
  @GetMapping
  public ResponseEntity<HealthResponse> healthCheck() {
    HealthResponse response =
        new HealthResponse("UP", "Job Tracker Backend is running", LocalDateTime.now());

    return ResponseEntity.ok(response);
  }

  /**
   * Simple ping endpoint for basic connectivity check
   *
   * @return ResponseEntity with simple OK message
   */
  @GetMapping("/ping")
  public ResponseEntity<String> ping() {
    return ResponseEntity.ok("pong");
  }
}
