package com.jhub.backend.security;

import com.jhub.backend.exception.UnauthorizedException;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;

public final class JwtSubjectParser {

  private JwtSubjectParser() {}

  public static UUID parseUserId(Jwt jwt) {
    String subject = jwt != null ? jwt.getSubject() : null;
    if (subject == null || subject.isBlank()) {
      throw new UnauthorizedException("Invalid token subject");
    }

    try {
      return UUID.fromString(subject);
    } catch (IllegalArgumentException exception) {
      throw new UnauthorizedException("Invalid token subject");
    }
  }
}
