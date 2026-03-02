package com.jhub.backend.service;

import com.jhub.backend.config.RefreshTokenProperties;
import com.jhub.backend.exception.ResourceNotFoundException;
import com.jhub.backend.exception.UnauthorizedException;
import com.jhub.backend.model.RefreshToken;
import com.jhub.backend.model.User;
import com.jhub.backend.repository.RefreshTokenRepository;
import com.jhub.backend.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RefreshTokenService {

  private final RefreshTokenRepository refreshTokenRepository;
  private final UserRepository userRepository;
  private final RefreshTokenProperties refreshTokenProperties;

  public RefreshTokenService(
      RefreshTokenRepository refreshTokenRepository,
      UserRepository userRepository,
      RefreshTokenProperties refreshTokenProperties) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.userRepository = userRepository;
    this.refreshTokenProperties = refreshTokenProperties;
  }

  @Transactional
  public String issueForUser(UUID userId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

    PersistedToken persistedToken = createPersistedToken(user);
    return persistedToken.rawToken();
  }

  @Transactional
  public RefreshRotationResult rotate(String rawToken) {
    if (rawToken == null || rawToken.isBlank()) {
      throw new UnauthorizedException("Refresh token is required");
    }

    String tokenHash = hashToken(rawToken);
    RefreshToken existingToken =
        refreshTokenRepository
            .findByTokenHash(tokenHash)
            .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

    User user = existingToken.getUser();
    Instant now = Instant.now();

    if (existingToken.isRevoked()) {
      revokeAllForUser(user.getId());
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (existingToken.isExpired(now)) {
      revoke(existingToken, now);
      throw new UnauthorizedException("Refresh token expired");
    }

    PersistedToken replacementToken = createPersistedToken(user);
    revoke(existingToken, now);
    existingToken.setReplacedByTokenId(replacementToken.entity().getId());

    return new RefreshRotationResult(user, replacementToken.rawToken());
  }

  @Transactional
  public void revokeAllForUser(UUID userId) {
    Instant now = Instant.now();
    List<RefreshToken> activeTokens = refreshTokenRepository.findByUserIdAndRevokedFalse(userId);
    for (RefreshToken token : activeTokens) {
      revoke(token, now);
    }
  }

  private PersistedToken createPersistedToken(User user) {
    String rawToken = generateRawToken();
    String tokenHash = hashToken(rawToken);

    RefreshToken refreshToken =
        RefreshToken.builder()
            .user(user)
            .tokenHash(tokenHash)
            .expiresAt(Instant.now().plus(refreshTokenProperties.ttl()))
            .revoked(false)
            .build();

    RefreshToken savedToken = refreshTokenRepository.saveAndFlush(refreshToken);
    return new PersistedToken(savedToken, rawToken);
  }

  private void revoke(RefreshToken refreshToken, Instant revokedAt) {
    refreshToken.setRevoked(true);
    refreshToken.setRevokedAt(revokedAt);
  }

  private String generateRawToken() {
    byte[] randomBytes = new byte[64];
    SecureRandomHolder.INSTANCE.nextBytes(randomBytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
  }

  private String hashToken(String rawToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 algorithm is not available", exception);
    }
  }

  public record RefreshRotationResult(User user, String refreshToken) {}

  private record PersistedToken(RefreshToken entity, String rawToken) {}

  private static final class SecureRandomHolder {
    private static final java.security.SecureRandom INSTANCE = new java.security.SecureRandom();

    private SecureRandomHolder() {}
  }
}
