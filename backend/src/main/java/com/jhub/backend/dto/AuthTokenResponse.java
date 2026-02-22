package com.jhub.backend.dto;

import java.time.Instant;

public record AuthTokenResponse(
    String accessToken, String tokenType, Instant expiresAt, UserResponse user) {
  public static AuthTokenResponse of(
      String accessToken, String tokenType, Instant expiresAt, UserResponse user) {
    return new AuthTokenResponse(accessToken, tokenType, expiresAt, user);
  }
}
