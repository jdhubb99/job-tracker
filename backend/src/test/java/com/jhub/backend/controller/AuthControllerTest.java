package com.jhub.backend.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jhub.backend.config.RefreshTokenProperties;
import com.jhub.backend.dto.AuthTokenResponse;
import com.jhub.backend.dto.UserLoginRequest;
import com.jhub.backend.dto.UserRegistrationRequest;
import com.jhub.backend.dto.UserResponse;
import com.jhub.backend.exception.EmailAlreadyExistsException;
import com.jhub.backend.exception.GlobalExceptionHandler;
import com.jhub.backend.exception.UnauthorizedException;
import com.jhub.backend.model.User;
import com.jhub.backend.service.AuthService;
import com.jhub.backend.service.RefreshTokenService;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthControllerTest {

  private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

  private MockMvc mockMvc;
  private ObjectMapper objectMapper;

  @Mock private AuthService authService;
  @Mock private RefreshTokenService refreshTokenService;
  @Mock private RefreshTokenProperties refreshTokenProperties;

  @InjectMocks private AuthController authController;

  @BeforeEach
  void setUp() {
    JacksonJsonHttpMessageConverter jacksonConverter = new JacksonJsonHttpMessageConverter();
    objectMapper = jacksonConverter.getMapper();

    mockMvc =
        MockMvcBuilders.standaloneSetup(authController)
            .setControllerAdvice(new GlobalExceptionHandler())
            .setMessageConverters(jacksonConverter)
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();

    setAuthenticatedPrincipal(USER_ID);

    when(refreshTokenProperties.cookieName()).thenReturn("refresh_token");
    when(refreshTokenProperties.cookiePath()).thenReturn("/api/auth");
    when(refreshTokenProperties.cookieSameSite()).thenReturn("Lax");
    when(refreshTokenProperties.cookieSecure()).thenReturn(false);
    when(refreshTokenProperties.ttl()).thenReturn(Duration.ofDays(7));
  }

  @Test
  void registerReturnsCreatedAndToken() throws Exception {
    UserRegistrationRequest request =
        UserRegistrationRequest.of("user@example.com", "password123", "Jane", "Doe");
    AuthTokenResponse response = sampleAuthResponse();
    when(authService.register(request)).thenReturn(response);
    when(refreshTokenService.issueForUser(USER_ID)).thenReturn("refresh-token-value");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.accessToken").value(response.accessToken()))
        .andExpect(jsonPath("$.tokenType").value("Bearer"))
        .andExpect(jsonPath("$.user.email").value("user@example.com"))
        .andExpect(header().string("Set-Cookie", containsString("refresh_token=")))
        .andExpect(header().string("Set-Cookie", containsString("HttpOnly")));
  }

  @Test
  void loginReturnsOkAndToken() throws Exception {
    UserLoginRequest request = UserLoginRequest.of("user@example.com", "password123");
    AuthTokenResponse response = sampleAuthResponse();
    when(authService.login(request)).thenReturn(response);
    when(refreshTokenService.issueForUser(USER_ID)).thenReturn("refresh-token-value");

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").value(response.accessToken()))
        .andExpect(jsonPath("$.tokenType").value("Bearer"))
        .andExpect(jsonPath("$.user.id").value(response.user().id().toString()))
        .andExpect(header().string("Set-Cookie", containsString("refresh_token=")));
  }

  @Test
  void refreshReturnsNewAccessTokenAndRefreshCookie() throws Exception {
    User user = sampleUser();
    AuthTokenResponse response = sampleAuthResponse();

    when(refreshTokenService.rotate("old-refresh-token"))
        .thenReturn(new RefreshTokenService.RefreshRotationResult(user, "new-refresh-token"));
    when(authService.issueAccessToken(any(User.class))).thenReturn(response);

    mockMvc
        .perform(
            post("/api/auth/refresh")
                .cookie(new jakarta.servlet.http.Cookie("refresh_token", "old-refresh-token")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").value("test.jwt.token"))
        .andExpect(header().string("Set-Cookie", containsString("new-refresh-token")));
  }

  @Test
  void meReturnsCurrentUser() throws Exception {
    UserResponse response = sampleAuthResponse().user();
    when(authService.getCurrentUser(USER_ID)).thenReturn(response);

    mockMvc
        .perform(get("/api/auth/me"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(USER_ID.toString()))
        .andExpect(jsonPath("$.email").value("user@example.com"));
  }

  @Test
  void logoutRevokesSessionsAndClearsCookie() throws Exception {
    doNothing().when(refreshTokenService).revokeAllForUser(USER_ID);

    mockMvc
        .perform(post("/api/auth/logout"))
        .andExpect(status().isOk())
        .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

    verify(refreshTokenService).revokeAllForUser(USER_ID);
  }

  @Test
  void registerReturnsBadRequestForInvalidPayload() throws Exception {
    UserRegistrationRequest invalidRequest =
        UserRegistrationRequest.of("not-an-email", "short", "", "Doe");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Validation failed"))
        .andExpect(jsonPath("$.fieldErrors.email").exists());
  }

  @Test
  void loginReturnsUnauthorizedForBadCredentials() throws Exception {
    UserLoginRequest request = UserLoginRequest.of("user@example.com", "password123");
    when(authService.login(request))
        .thenThrow(new UnauthorizedException("Invalid email or password"));

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("Invalid email or password"));
  }

  @Test
  void registerReturnsConflictForDuplicateEmail() throws Exception {
    UserRegistrationRequest request =
        UserRegistrationRequest.of("user@example.com", "password123", "Jane", "Doe");
    when(authService.register(request)).thenThrow(new EmailAlreadyExistsException());

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.message").value("Email already registered"));
  }

  private void setAuthenticatedPrincipal(UUID userId) {
    Jwt jwt =
        new Jwt(
            "mock-token",
            Instant.now(),
            Instant.now().plusSeconds(3600),
            Map.of("alg", "HS256"),
            Map.of("sub", userId.toString()));

    var authentication = new TestingAuthenticationToken(jwt, null, "ROLE_USER");
    SecurityContextHolder.setContext(new SecurityContextImpl(authentication));
  }

  private AuthTokenResponse sampleAuthResponse() {
    Instant now = Instant.parse("2026-02-22T00:00:00Z");
    UserResponse user = UserResponse.of(USER_ID, "user@example.com", "Jane", "Doe", now, now);
    return AuthTokenResponse.of("test.jwt.token", "Bearer", now.plusSeconds(3600), user);
  }

  private User sampleUser() {
    User user =
        User.builder()
            .email("user@example.com")
            .password("hashed-password")
            .firstName("Jane")
            .lastName("Doe")
            .build();
    user.setId(USER_ID);
    return user;
  }
}
