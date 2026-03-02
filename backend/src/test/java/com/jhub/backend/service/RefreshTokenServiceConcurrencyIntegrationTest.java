package com.jhub.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.jhub.backend.config.TestContainersConfig;
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
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.context.ImportTestcontainers;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ImportTestcontainers(TestContainersConfig.class)
@ActiveProfiles("test")
class RefreshTokenServiceConcurrencyIntegrationTest {

  @Autowired private RefreshTokenService refreshTokenService;
  @Autowired private RefreshTokenRepository refreshTokenRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private JdbcTemplate jdbcTemplate;

  @AfterEach
  void tearDown() {
    jdbcTemplate.execute("TRUNCATE TABLE refresh_tokens, users RESTART IDENTITY CASCADE");
  }

  @Test
  void rotate_allowsOnlySingleSuccessfulRotationForSameTokenUnderConcurrency() throws Exception {
    User user =
        User.builder()
            .email("concurrency-" + UUID.randomUUID() + "@example.com")
            .password("password123")
            .firstName("Concurrency")
            .lastName("Test")
            .build();
    User savedUser = userRepository.saveAndFlush(user);

    String rawToken = refreshTokenService.issueForUser(savedUser.getId());

    CountDownLatch startGate = new CountDownLatch(1);
    ExecutorService pool = Executors.newFixedThreadPool(2);

    try {
      Callable<Throwable> rotateCall =
          () -> {
            startGate.await(2, TimeUnit.SECONDS);
            try {
              refreshTokenService.rotate(rawToken);
              return null;
            } catch (Throwable throwable) {
              return throwable;
            }
          };

      Future<Throwable> first = pool.submit(rotateCall);
      Future<Throwable> second = pool.submit(rotateCall);

      startGate.countDown();

      Throwable firstError = first.get(5, TimeUnit.SECONDS);
      Throwable secondError = second.get(5, TimeUnit.SECONDS);

      int failures = 0;
      if (firstError != null) failures++;
      if (secondError != null) failures++;

      assertThat(failures).isEqualTo(1);
      Throwable failure =
          java.util.Arrays.asList(firstError, secondError).stream()
              .filter(java.util.Objects::nonNull)
              .findFirst()
              .orElseThrow(() -> new AssertionError("Expected one failed rotation"));
      assertThat(failure).isInstanceOf(UnauthorizedException.class);
      assertThat(failure).hasMessage("Invalid refresh token");

      List<RefreshToken> activeTokens =
          refreshTokenRepository.findByUserIdAndRevokedFalse(savedUser.getId());
      assertThat(activeTokens).hasSize(1);

      RefreshToken originalToken =
          refreshTokenRepository
              .findByTokenHash(hash(rawToken))
              .orElseThrow(() -> new AssertionError("Original token not found"));
      assertThat(originalToken.isRevoked()).isTrue();
      assertThat(originalToken.getRevokedAt()).isBeforeOrEqualTo(Instant.now());
      assertThat(originalToken.getReplacedByTokenId()).isNotNull();
    } finally {
      pool.shutdownNow();
    }
  }

  private String hash(String rawToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 algorithm is not available", exception);
    }
  }
}
