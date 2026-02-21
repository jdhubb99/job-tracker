package com.jhub.backend.config;

import com.jhub.backend.controller.HealthController;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitWebConfig(SecurityConfigIntegrationTest.TestConfig.class)
@TestPropertySource(properties = {
    "app.jwt.secret=test-secret-key-that-is-at-least-32-bytes-long",
    "app.jwt.expiration=PT24H",
    "app.cors.allowed-origins=http://localhost:5173"
})
class SecurityConfigIntegrationTest {

    private static final String JWT_SECRET = "test-secret-key-that-is-at-least-32-bytes-long";

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext)
            .addFilters(this.springSecurityFilterChain)
            .build();
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk());
    }

    @Test
    void protectedEndpointReturnsUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/test/protected"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointAcceptsValidToken() throws Exception {
        String token = createToken(Instant.now().plusSeconds(300));

        mockMvc.perform(get("/api/test/protected")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
            .andExpect(status().isOk());
    }

    @Test
    void protectedEndpointRejectsExpiredToken() throws Exception {
        String token = createToken(Instant.now().minusSeconds(60));

        mockMvc.perform(get("/api/test/protected")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointRejectsMalformedToken() throws Exception {
        mockMvc.perform(get("/api/test/protected")
                .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void corsPreflightSucceedsForProtectedRoute() throws Exception {
        mockMvc.perform(options("/api/test/protected")
                .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));
    }

    private String createToken(Instant expiresAt) throws JOSEException {
        Instant issuedAt = Instant.now();

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
            .subject("test-user-id")
            .issueTime(Date.from(issuedAt))
            .expirationTime(Date.from(expiresAt))
            .build();

        SignedJWT signedJwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);
        signedJwt.sign(new MACSigner(JWT_SECRET.getBytes(StandardCharsets.UTF_8)));
        return signedJwt.serialize();
    }

    @RestController
    static class ProtectedTestController {

        @GetMapping("/api/test/protected")
        public ResponseEntity<String> protectedEndpoint() {
            return ResponseEntity.ok("secured");
        }
    }

    @Configuration
    @EnableWebMvc
    @EnableWebSecurity
    @Import({SecurityConfig.class, HealthController.class, ProtectedTestController.class})
    static class TestConfig {
    }
}
