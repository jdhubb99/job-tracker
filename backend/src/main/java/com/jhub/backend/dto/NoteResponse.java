package com.jhub.backend.dto;

import com.jhub.backend.model.Note;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record NoteResponse(
    UUID id,
    UUID jobApplicationId,
    String content,
    boolean followUp,
    LocalDate followUpDate,
    Instant createdAt,
    Instant updatedAt) {
  public static NoteResponse from(Note entity) {
    return new NoteResponse(
        entity.getId(),
        entity.getJobApplication().getId(),
        entity.getContent(),
        entity.isFollowUp(),
        entity.getFollowUpDate(),
        entity.getCreatedAt(),
        entity.getUpdatedAt());
  }
}
