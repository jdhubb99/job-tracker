package com.jhub.backend.dto;

import com.jhub.backend.model.enums.JobApplicationStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record JobApplicationUpdateRequest(
    @Size(max = 255, message = "Company name must not exceed 255 characters") String company,
    @Size(max = 255, message = "Job title must not exceed 255 characters") String jobTitle,
    LocalDate dateApplied,
    JobApplicationStatus status,
    @Size(max = 2048, message = "Job posting URL must not exceed 2048 characters")
        String jobPostingUrl,
    @Size(max = 255, message = "Location must not exceed 255 characters") String location,
    @Min(value = 0, message = "Minimum salary must not be negative") Integer salaryMin,
    @Min(value = 0, message = "Maximum salary must not be negative") Integer salaryMax,
    String description) {}
