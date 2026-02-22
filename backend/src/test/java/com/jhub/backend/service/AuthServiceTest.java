package com.jhub.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.jhub.backend.config.JwtProperties;
import com.jhub.backend.dto.AuthTokenResponse;
import com.jhub.backend.dto.UserLoginRequest;
import com.jhub.backend.dto.UserRegistrationRequest;
import com.jhub.backend.exception.EmailAlreadyExistsException;
import com.jhub.backend.exception.UnauthorizedException;
import com.jhub.backend.model.User;
import com.jhub.backend.repository.UserRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtEncoder jwtEncoder;

    @Mock
    private JwtProperties jwtProperties;

    @InjectMocks
    private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
            .email("user@example.com")
            .password("hashed-password")
            .firstName("Jane")
            .lastName("Doe")
            .build();
        user.setId(UUID.randomUUID());
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
    }

    @Test
    void registerCreatesUserAndReturnsToken() {
        UserRegistrationRequest request = UserRegistrationRequest.of(
            "User@Example.com",
            "password123",
            "Jane",
            "Doe"
        );

        when(userRepository.existsByEmail("user@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenReturn(user);
        mockJwtEncoding();

        AuthTokenResponse response = authService.register(request);

        assertThat(response.accessToken()).isEqualTo("test.jwt.token");
        assertThat(response.user().email()).isEqualTo("user@example.com");
        assertThat(response.tokenType()).isEqualTo("Bearer");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getEmail()).isEqualTo("user@example.com");
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("hashed-password");
    }

    @Test
    void registerThrowsWhenEmailAlreadyExists() {
        UserRegistrationRequest request = UserRegistrationRequest.of(
            "user@example.com",
            "password123",
            "Jane",
            "Doe"
        );

        when(userRepository.existsByEmail("user@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(EmailAlreadyExistsException.class);
    }

    @Test
    void loginReturnsTokenForValidCredentials() {
        UserLoginRequest request = UserLoginRequest.of("user@example.com", "password123");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed-password")).thenReturn(true);
        mockJwtEncoding();

        AuthTokenResponse response = authService.login(request);

        assertThat(response.accessToken()).isEqualTo("test.jwt.token");
        assertThat(response.user().id()).isEqualTo(user.getId());
    }

    @Test
    void loginThrowsForUnknownEmail() {
        UserLoginRequest request = UserLoginRequest.of("missing@example.com", "password123");
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessage("Invalid email or password");
    }

    @Test
    void loginThrowsForInvalidPassword() {
        UserLoginRequest request = UserLoginRequest.of("user@example.com", "wrong-password");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "hashed-password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessage("Invalid email or password");
    }

    private void mockJwtEncoding() {
        when(jwtProperties.expiration()).thenReturn(Duration.ofHours(24));
        when(jwtProperties.issuer()).thenReturn("job-tracker-test");
        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(new Jwt(
            "test.jwt.token",
            Instant.now(),
            Instant.now().plusSeconds(3600),
            Map.of("alg", "HS256"),
            Map.of("sub", user.getId().toString())
        ));
    }
}
