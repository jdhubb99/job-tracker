package com.jhub.backend.controller;

import com.jhub.backend.dto.JobApplicationCreateRequest;
import com.jhub.backend.dto.JobApplicationResponse;
import com.jhub.backend.dto.JobApplicationUpdateRequest;
import com.jhub.backend.model.enums.JobApplicationStatus;
import com.jhub.backend.security.JwtSubjectParser;
import com.jhub.backend.service.JobApplicationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/job-applications")
public class JobApplicationController {

  private final JobApplicationService jobApplicationService;

  public JobApplicationController(JobApplicationService jobApplicationService) {
    this.jobApplicationService = jobApplicationService;
  }

  @PostMapping
  public ResponseEntity<JobApplicationResponse> create(
      @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody JobApplicationCreateRequest request) {
    UUID userId = JwtSubjectParser.parseUserId(jwt);
    JobApplicationResponse response = jobApplicationService.createApplication(userId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping
  public ResponseEntity<List<JobApplicationResponse>> getAll(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(required = false) JobApplicationStatus status) {
    UUID userId = JwtSubjectParser.parseUserId(jwt);
    List<JobApplicationResponse> responses =
        status != null
            ? jobApplicationService.getApplicationsByStatus(userId, status)
            : jobApplicationService.getAllApplicationsForUser(userId);
    return ResponseEntity.ok(responses);
  }

  @GetMapping("/{id}")
  public ResponseEntity<JobApplicationResponse> getById(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
    UUID userId = JwtSubjectParser.parseUserId(jwt);
    JobApplicationResponse response = jobApplicationService.getApplicationById(userId, id);
    return ResponseEntity.ok(response);
  }

  @PutMapping("/{id}")
  public ResponseEntity<JobApplicationResponse> update(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @Valid @RequestBody JobApplicationUpdateRequest request) {
    UUID userId = JwtSubjectParser.parseUserId(jwt);
    JobApplicationResponse response = jobApplicationService.updateApplication(userId, id, request);
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
    UUID userId = JwtSubjectParser.parseUserId(jwt);
    jobApplicationService.deleteApplication(userId, id);
    return ResponseEntity.noContent().build();
  }
}
