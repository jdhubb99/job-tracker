package com.jhub.backend.controller;

import com.jhub.backend.dto.AuthTokenResponse;
import com.jhub.backend.dto.UserLoginRequest;
import com.jhub.backend.dto.UserRegistrationRequest;
import com.jhub.backend.dto.UserResponse;
import com.jhub.backend.exception.EmailAlreadyExistsException;
import com.jhub.backend.exception.GlobalExceptionHandler;
import com.jhub.backend.exception.UnauthorizedException;
import com.jhub.backend.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        JacksonJsonHttpMessageConverter jacksonConverter = new JacksonJsonHttpMessageConverter();
        objectMapper = jacksonConverter.getMapper();
        mockMvc = MockMvcBuilders
            .standaloneSetup(authController)
            .setControllerAdvice(new GlobalExceptionHandler())
            .setMessageConverters(jacksonConverter)
            .build();
    }

    @Test
    void registerReturnsCreatedAndToken() throws Exception {
        UserRegistrationRequest request = UserRegistrationRequest.of(
            "user@example.com",
            "password123",
            "Jane",
            "Doe"
        );
        AuthTokenResponse response = sampleAuthResponse();
        when(authService.register(request)).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accessToken").value(response.accessToken()))
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.user.email").value("user@example.com"));
    }

    @Test
    void loginReturnsOkAndToken() throws Exception {
        UserLoginRequest request = UserLoginRequest.of("user@example.com", "password123");
        AuthTokenResponse response = sampleAuthResponse();
        when(authService.login(request)).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value(response.accessToken()))
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.user.id").value(response.user().id().toString()));
    }

    @Test
    void registerReturnsBadRequestForInvalidPayload() throws Exception {
        UserRegistrationRequest invalidRequest = UserRegistrationRequest.of(
            "not-an-email",
            "short",
            "",
            "Doe"
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Validation failed"))
            .andExpect(jsonPath("$.fieldErrors.email").exists());
    }

    @Test
    void loginReturnsUnauthorizedForBadCredentials() throws Exception {
        UserLoginRequest request = UserLoginRequest.of("user@example.com", "password123");
        when(authService.login(request)).thenThrow(new UnauthorizedException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void registerReturnsConflictForDuplicateEmail() throws Exception {
        UserRegistrationRequest request = UserRegistrationRequest.of(
            "user@example.com",
            "password123",
            "Jane",
            "Doe"
        );
        when(authService.register(request)).thenThrow(new EmailAlreadyExistsException());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    private AuthTokenResponse sampleAuthResponse() {
        Instant now = Instant.parse("2026-02-22T00:00:00Z");
        UserResponse user = UserResponse.of(
            UUID.fromString("11111111-1111-1111-1111-111111111111"),
            "user@example.com",
            "Jane",
            "Doe",
            now,
            now
        );
        return AuthTokenResponse.of("test.jwt.token", "Bearer", now.plusSeconds(3600), user);
    }
}
