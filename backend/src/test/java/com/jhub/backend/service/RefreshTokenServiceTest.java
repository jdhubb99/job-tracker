package com.jhub.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.jhub.backend.config.RefreshTokenProperties;
import com.jhub.backend.exception.UnauthorizedException;
import com.jhub.backend.model.RefreshToken;
import com.jhub.backend.model.User;
import com.jhub.backend.repository.RefreshTokenRepository;
import com.jhub.backend.repository.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RefreshTokenServiceTest {

  @Mock private RefreshTokenRepository refreshTokenRepository;
  @Mock private UserRepository userRepository;
  @Mock private RefreshTokenProperties refreshTokenProperties;

  @InjectMocks private RefreshTokenService refreshTokenService;

  private User user;

  @BeforeEach
  void setUp() {
    user =
        User.builder()
            .email("user@example.com")
            .password("hashed-password")
            .firstName("Jane")
            .lastName("Doe")
            .build();
    user.setId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
    user.setCreatedAt(Instant.now());
    user.setUpdatedAt(Instant.now());

    when(refreshTokenProperties.ttl()).thenReturn(Duration.ofDays(7));
    when(refreshTokenRepository.saveAndFlush(any(RefreshToken.class)))
        .thenAnswer(
            invocation -> {
              RefreshToken token = invocation.getArgument(0);
              if (token.getId() == null) {
                token.setId(UUID.randomUUID());
              }
              return token;
            });
  }

  @Test
  void issueForUserPersistsHashedTokenAndReturnsRawToken() {
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

    String rawToken = refreshTokenService.issueForUser(user.getId());

    assertThat(rawToken).isNotBlank();
    assertThat(Base64.getUrlDecoder().decode(rawToken)).hasSize(64);
  }

  @Test
  void rotateRevokesExistingTokenAndIssuesReplacement() {
    String rawToken = "raw-refresh-token";
    String tokenHash = hash(rawToken);
    RefreshToken existing =
        RefreshToken.builder()
            .user(user)
            .tokenHash(tokenHash)
            .expiresAt(Instant.now().plusSeconds(3600))
            .revoked(false)
            .build();

    when(refreshTokenRepository.findByTokenHashForUpdate(tokenHash))
        .thenReturn(Optional.of(existing));

    RefreshTokenService.RefreshRotationResult result = refreshTokenService.rotate(rawToken);

    assertThat(result.user().getId()).isEqualTo(user.getId());
    assertThat(result.refreshToken()).isNotBlank();
    assertThat(existing.isRevoked()).isTrue();
    assertThat(existing.getRevokedAt()).isNotNull();
    assertThat(existing.getReplacedByTokenId()).isNotNull();
  }

  @Test
  void rotateThrowsForMissingToken() {
    assertThatThrownBy(() -> refreshTokenService.rotate(null))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessage("Refresh token is required");
  }

  @Test
  void rotateThrowsForUnknownToken() {
    String rawToken = "unknown-token";
    when(refreshTokenRepository.findByTokenHashForUpdate(hash(rawToken)))
        .thenReturn(Optional.empty());

    assertThatThrownBy(() -> refreshTokenService.rotate(rawToken))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessage("Invalid refresh token");
  }

  @Test
  void revokeAllForUserRevokesActiveTokens() {
    RefreshToken token1 =
        RefreshToken.builder()
            .user(user)
            .tokenHash("hash-1")
            .expiresAt(Instant.now().plusSeconds(3600))
            .revoked(false)
            .build();
    RefreshToken token2 =
        RefreshToken.builder()
            .user(user)
            .tokenHash("hash-2")
            .expiresAt(Instant.now().plusSeconds(3600))
            .revoked(false)
            .build();

    when(refreshTokenRepository.findByUserIdAndRevokedFalse(user.getId()))
        .thenReturn(List.of(token1, token2));

    refreshTokenService.revokeAllForUser(user.getId());

    assertThat(token1.isRevoked()).isTrue();
    assertThat(token2.isRevoked()).isTrue();
    assertThat(token1.getRevokedAt()).isNotNull();
    assertThat(token2.getRevokedAt()).isNotNull();
  }

  private String hash(String rawToken) {
    try {
      java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
    } catch (java.security.NoSuchAlgorithmException exception) {
      throw new IllegalStateException(exception);
    }
  }
}
