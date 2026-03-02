package com.jhub.backend.controller;

import com.jhub.backend.config.RefreshTokenProperties;
import com.jhub.backend.dto.AuthTokenResponse;
import com.jhub.backend.dto.UserLoginRequest;
import com.jhub.backend.dto.UserRegistrationRequest;
import com.jhub.backend.dto.UserResponse;
import com.jhub.backend.security.JwtSubjectParser;
import com.jhub.backend.service.AuthService;
import com.jhub.backend.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final RefreshTokenService refreshTokenService;
  private final RefreshTokenProperties refreshTokenProperties;

  public AuthController(
      AuthService authService,
      RefreshTokenService refreshTokenService,
      RefreshTokenProperties refreshTokenProperties) {
    this.authService = authService;
    this.refreshTokenService = refreshTokenService;
    this.refreshTokenProperties = refreshTokenProperties;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthTokenResponse> register(
      @Valid @RequestBody UserRegistrationRequest request, HttpServletResponse servletResponse) {
    AuthTokenResponse response = authService.register(request);
    String refreshToken = refreshTokenService.issueForUser(response.user().id());
    addRefreshCookie(servletResponse, refreshToken);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthTokenResponse> login(
      @Valid @RequestBody UserLoginRequest request, HttpServletResponse servletResponse) {
    AuthTokenResponse response = authService.login(request);
    String refreshToken = refreshTokenService.issueForUser(response.user().id());
    addRefreshCookie(servletResponse, refreshToken);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/refresh")
  public ResponseEntity<AuthTokenResponse> refresh(
      HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
    String refreshToken = extractRefreshToken(servletRequest);
    RefreshTokenService.RefreshRotationResult rotationResult =
        refreshTokenService.rotate(refreshToken);
    addRefreshCookie(servletResponse, rotationResult.refreshToken());
    AuthTokenResponse response = authService.issueAccessToken(rotationResult.user());
    return ResponseEntity.ok(response);
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      @AuthenticationPrincipal Jwt jwt, HttpServletResponse servletResponse) {
    UUID userId = JwtSubjectParser.parseUserId(jwt);
    refreshTokenService.revokeAllForUser(userId);
    clearRefreshCookie(servletResponse);
    return ResponseEntity.ok().build();
  }

  @GetMapping("/me")
  public ResponseEntity<UserResponse> me(@AuthenticationPrincipal Jwt jwt) {
    UUID userId = JwtSubjectParser.parseUserId(jwt);
    UserResponse response = authService.getCurrentUser(userId);
    return ResponseEntity.ok(response);
  }

  private String extractRefreshToken(HttpServletRequest servletRequest) {
    Cookie[] cookies = servletRequest.getCookies();
    if (cookies == null) {
      return null;
    }

    for (Cookie cookie : cookies) {
      if (refreshTokenProperties.cookieName().equals(cookie.getName())) {
        return cookie.getValue();
      }
    }
    return null;
  }

  private void addRefreshCookie(HttpServletResponse servletResponse, String refreshToken) {
    ResponseCookie cookie =
        ResponseCookie.from(refreshTokenProperties.cookieName(), refreshToken)
            .httpOnly(true)
            .secure(refreshTokenProperties.cookieSecure())
            .path(refreshTokenProperties.cookiePath())
            .sameSite(refreshTokenProperties.cookieSameSite())
            .maxAge(refreshTokenProperties.ttl())
            .build();
    servletResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }

  private void clearRefreshCookie(HttpServletResponse servletResponse) {
    ResponseCookie cookie =
        ResponseCookie.from(refreshTokenProperties.cookieName(), "")
            .httpOnly(true)
            .secure(refreshTokenProperties.cookieSecure())
            .path(refreshTokenProperties.cookiePath())
            .sameSite(refreshTokenProperties.cookieSameSite())
            .maxAge(0)
            .build();
    servletResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }
}
