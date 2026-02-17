package com.jhub.backend.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.jhub.backend.model.JobApplication;
import com.jhub.backend.model.enums.JobApplicationStatus;

public record JobApplicationResponse(
    UUID id,
    UUID userId,
    String company,
    String jobTitle,
    JobApplicationStatus status,
    LocalDate dateApplied,
    String jobPostingUrl,
    String location,
    Integer salaryMin,
    Integer salaryMax,
    String description,
    Instant createdAt,
    Instant updatedAt
) {
    public static JobApplicationResponse from(JobApplication entity) {
        return new JobApplicationResponse(
            entity.getId(),
            entity.getUser().getId(),
            entity.getCompany(),
            entity.getJobTitle(),
            entity.getStatus(),
            entity.getDateApplied(),
            entity.getJobPostingUrl(),
            entity.getLocation(),
            entity.getSalaryMin(),
            entity.getSalaryMax(),
            entity.getDescription(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
