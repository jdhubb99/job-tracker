package com.jhub.backend.dto;

import com.jhub.backend.model.User;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String firstName,
    String lastName,
    Instant createdAt,
    Instant updatedAt) {
  public static UserResponse from(User user) {
    return new UserResponse(
        user.getId(),
        user.getEmail(),
        user.getFirstName(),
        user.getLastName(),
        user.getCreatedAt(),
        user.getUpdatedAt());
  }

  public static UserResponse of(
      UUID id,
      String email,
      String firstName,
      String lastName,
      Instant createdAt,
      Instant updatedAt) {
    return new UserResponse(id, email, firstName, lastName, createdAt, updatedAt);
  }
}
