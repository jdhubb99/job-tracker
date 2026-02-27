package com.jhub.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.jhub.backend.dto.JobApplicationCreateRequest;
import com.jhub.backend.dto.JobApplicationResponse;
import com.jhub.backend.dto.JobApplicationUpdateRequest;
import com.jhub.backend.exception.GlobalExceptionHandler;
import com.jhub.backend.exception.ResourceNotFoundException;
import com.jhub.backend.model.enums.JobApplicationStatus;
import com.jhub.backend.service.JobApplicationService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
class JobApplicationControllerTest {

  private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID APP_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

  private MockMvc mockMvc;
  private ObjectMapper objectMapper;

  @Mock private JobApplicationService jobApplicationService;

  @InjectMocks private JobApplicationController jobApplicationController;

  @BeforeEach
  void setUp() {
    JacksonJsonHttpMessageConverter jacksonConverter = new JacksonJsonHttpMessageConverter();
    objectMapper = jacksonConverter.getMapper();

    Jwt jwt =
        new Jwt(
            "mock-token",
            Instant.now(),
            Instant.now().plusSeconds(3600),
            Map.of("alg", "RS256"),
            Map.of("sub", USER_ID.toString()));

    var authentication = new TestingAuthenticationToken(jwt, null, "ROLE_USER");
    var securityContext = new SecurityContextImpl(authentication);
    SecurityContextHolder.setContext(securityContext);

    mockMvc =
        MockMvcBuilders.standaloneSetup(jobApplicationController)
            .setControllerAdvice(new GlobalExceptionHandler())
            .setMessageConverters(jacksonConverter)
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();
  }

  @Test
  void createReturnsCreatedWithResponseBody() throws Exception {
    JobApplicationCreateRequest request =
        new JobApplicationCreateRequest(
            "Acme Corp",
            "Software Engineer",
            LocalDate.of(2026, 2, 20),
            JobApplicationStatus.APPLIED,
            null,
            "Remote",
            null,
            null,
            null);
    JobApplicationResponse response = sampleResponse();
    when(jobApplicationService.createApplication(eq(USER_ID), any())).thenReturn(response);

    mockMvc
        .perform(
            post("/api/job-applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(APP_ID.toString()))
        .andExpect(jsonPath("$.company").value("Acme Corp"))
        .andExpect(jsonPath("$.status").value("APPLIED"));
  }

  @Test
  void createReturnsBadRequestForInvalidPayload() throws Exception {
    String invalidJson =
        """
        {"company":"","jobTitle":"","dateApplied":null}
        """;

    mockMvc
        .perform(
            post("/api/job-applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Validation failed"))
        .andExpect(jsonPath("$.fieldErrors.company").exists())
        .andExpect(jsonPath("$.fieldErrors.jobTitle").exists());
  }

  @Test
  void getAllReturnsOkWithList() throws Exception {
    List<JobApplicationResponse> responses = List.of(sampleResponse());
    when(jobApplicationService.getAllApplicationsForUser(USER_ID)).thenReturn(responses);

    mockMvc
        .perform(get("/api/job-applications"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].id").value(APP_ID.toString()));
  }

  @Test
  void getAllWithStatusFilterReturnsFilteredList() throws Exception {
    List<JobApplicationResponse> responses = List.of(sampleResponse());
    when(jobApplicationService.getApplicationsByStatus(USER_ID, JobApplicationStatus.APPLIED))
        .thenReturn(responses);

    mockMvc
        .perform(get("/api/job-applications").param("status", "APPLIED"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].status").value("APPLIED"));
  }

  @Test
  void getByIdReturnsOkWithApplication() throws Exception {
    JobApplicationResponse response = sampleResponse();
    when(jobApplicationService.getApplicationById(USER_ID, APP_ID)).thenReturn(response);

    mockMvc
        .perform(get("/api/job-applications/{id}", APP_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(APP_ID.toString()))
        .andExpect(jsonPath("$.company").value("Acme Corp"));
  }

  @Test
  void getByIdReturnsNotFoundForNonexistentId() throws Exception {
    UUID missingId = UUID.fromString("99999999-9999-9999-9999-999999999999");
    when(jobApplicationService.getApplicationById(USER_ID, missingId))
        .thenThrow(new ResourceNotFoundException("JobApplication", "id", missingId));

    mockMvc
        .perform(get("/api/job-applications/{id}", missingId))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.message").exists());
  }

  @Test
  void updateReturnsOkWithUpdatedResponse() throws Exception {
    JobApplicationUpdateRequest request =
        new JobApplicationUpdateRequest(
            null, null, null, JobApplicationStatus.INTERVIEWING, null, null, null, null, null);
    JobApplicationResponse response =
        new JobApplicationResponse(
            APP_ID,
            USER_ID,
            "Acme Corp",
            "Software Engineer",
            JobApplicationStatus.INTERVIEWING,
            LocalDate.of(2026, 2, 20),
            null,
            "Remote",
            null,
            null,
            null,
            Instant.parse("2026-02-20T00:00:00Z"),
            Instant.parse("2026-02-25T00:00:00Z"));
    when(jobApplicationService.updateApplication(eq(USER_ID), eq(APP_ID), any()))
        .thenReturn(response);

    mockMvc
        .perform(
            put("/api/job-applications/{id}", APP_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("INTERVIEWING"));
  }

  @Test
  void deleteReturnsNoContent() throws Exception {
    doNothing().when(jobApplicationService).deleteApplication(USER_ID, APP_ID);

    mockMvc.perform(delete("/api/job-applications/{id}", APP_ID)).andExpect(status().isNoContent());
  }

  @Test
  void deleteReturnsNotFoundForNonexistentId() throws Exception {
    UUID missingId = UUID.fromString("99999999-9999-9999-9999-999999999999");
    doThrow(new ResourceNotFoundException("JobApplication", "id", missingId))
        .when(jobApplicationService)
        .deleteApplication(USER_ID, missingId);

    mockMvc
        .perform(delete("/api/job-applications/{id}", missingId))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.message").exists());
  }

  private JobApplicationResponse sampleResponse() {
    return new JobApplicationResponse(
        APP_ID,
        USER_ID,
        "Acme Corp",
        "Software Engineer",
        JobApplicationStatus.APPLIED,
        LocalDate.of(2026, 2, 20),
        null,
        "Remote",
        null,
        null,
        null,
        Instant.parse("2026-02-20T00:00:00Z"),
        Instant.parse("2026-02-20T00:00:00Z"));
  }
}
