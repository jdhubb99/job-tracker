package com.jhub.backend.service;

import java.time.Instant;
import java.util.Locale;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jhub.backend.config.JwtProperties;
import com.jhub.backend.dto.AuthTokenResponse;
import com.jhub.backend.dto.UserLoginRequest;
import com.jhub.backend.dto.UserRegistrationRequest;
import com.jhub.backend.dto.UserResponse;
import com.jhub.backend.exception.EmailAlreadyExistsException;
import com.jhub.backend.exception.UnauthorizedException;
import com.jhub.backend.model.User;
import com.jhub.backend.repository.UserRepository;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtEncoder jwtEncoder,
        JwtProperties jwtProperties
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public AuthTokenResponse register(UserRegistrationRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException();
        }

        User user = User.builder()
            .email(normalizedEmail)
            .password(passwordEncoder.encode(request.password()))
            .firstName(request.firstName().trim())
            .lastName(request.lastName().trim())
            .build();

        User savedUser = userRepository.save(user);
        return createTokenResponse(savedUser);
    }

    public AuthTokenResponse login(UserLoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        return createTokenResponse(user);
    }

    private AuthTokenResponse createTokenResponse(User user) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(jwtProperties.expiration());

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer(jwtProperties.issuer())
            .subject(user.getId().toString())
            .issuedAt(issuedAt)
            .expiresAt(expiresAt)
            .claim("email", user.getEmail())
            .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256)
            .type("JWT")
            .build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return AuthTokenResponse.of(token, "Bearer", expiresAt, UserResponse.from(user));
    }

    private String normalizeEmail(String rawEmail) {
        return rawEmail.trim().toLowerCase(Locale.ROOT);
    }
}
