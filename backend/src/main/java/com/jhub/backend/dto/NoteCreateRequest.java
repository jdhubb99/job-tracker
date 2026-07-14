package com.jhub.backend.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

public record NoteCreateRequest(
    @NotNull(message = "Job application id is required") UUID jobApplicationId,
    @NotBlank(message = "Note content is required")
        @Size(max = 10000, message = "Note content must not exceed 10000 characters")
        String content,
    boolean followUp,
    LocalDate followUpDate) {

  @AssertTrue(message = "Follow-up date requires followUp to be true")
  private boolean isFollowUpDateConsistent() {
    return followUpDate == null || followUp;
  }
}
