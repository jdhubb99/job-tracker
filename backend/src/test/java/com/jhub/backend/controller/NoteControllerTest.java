package com.jhub.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.jhub.backend.dto.NoteCreateRequest;
import com.jhub.backend.dto.NoteResponse;
import com.jhub.backend.exception.GlobalExceptionHandler;
import com.jhub.backend.exception.ResourceNotFoundException;
import com.jhub.backend.service.NoteService;
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
class NoteControllerTest {

  private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID APP_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final UUID NOTE_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

  private MockMvc mockMvc;
  private ObjectMapper objectMapper;

  @Mock private NoteService noteService;

  @InjectMocks private NoteController noteController;

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
        MockMvcBuilders.standaloneSetup(noteController)
            .setControllerAdvice(new GlobalExceptionHandler())
            .setMessageConverters(jacksonConverter)
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();
  }

  private NoteResponse sampleResponse() {
    return new NoteResponse(
        NOTE_ID,
        APP_ID,
        "Spoke with recruiter",
        true,
        LocalDate.of(2026, 8, 1),
        Instant.now(),
        Instant.now());
  }

  @Test
  void createReturnsCreatedWithResponseBody() throws Exception {
    NoteCreateRequest request =
        new NoteCreateRequest(APP_ID, "Spoke with recruiter", true, LocalDate.of(2026, 8, 1));
    when(noteService.createNote(eq(USER_ID), any())).thenReturn(sampleResponse());

    mockMvc
        .perform(
            post("/api/notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(NOTE_ID.toString()))
        .andExpect(jsonPath("$.jobApplicationId").value(APP_ID.toString()))
        .andExpect(jsonPath("$.content").value("Spoke with recruiter"))
        .andExpect(jsonPath("$.followUp").value(true));
  }

  @Test
  void createReturnsBadRequestForBlankContent() throws Exception {
    String invalidJson =
        """
        {"jobApplicationId":"%s","content":"  ","followUp":false}
        """
            .formatted(APP_ID);

    mockMvc
        .perform(post("/api/notes").contentType(MediaType.APPLICATION_JSON).content(invalidJson))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Validation failed"))
        .andExpect(jsonPath("$.fieldErrors.content").exists());
  }

  @Test
  void createReturnsBadRequestForMissingJobApplicationId() throws Exception {
    String invalidJson =
        """
        {"content":"A note","followUp":false}
        """;

    mockMvc
        .perform(post("/api/notes").contentType(MediaType.APPLICATION_JSON).content(invalidJson))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.fieldErrors.jobApplicationId").exists());
  }

  @Test
  void createReturnsBadRequestForFollowUpDateWithoutFlag() throws Exception {
    String invalidJson =
        """
        {"jobApplicationId":"%s","content":"A note","followUp":false,"followUpDate":"2026-08-01"}
        """
            .formatted(APP_ID);

    mockMvc
        .perform(post("/api/notes").contentType(MediaType.APPLICATION_JSON).content(invalidJson))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Validation failed"));
  }

  @Test
  void createReturnsNotFoundForUnownedApplication() throws Exception {
    NoteCreateRequest request = new NoteCreateRequest(APP_ID, "A note", false, null);
    when(noteService.createNote(eq(USER_ID), any()))
        .thenThrow(new ResourceNotFoundException("JobApplication", "id", APP_ID));

    mockMvc
        .perform(
            post("/api/notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isNotFound());
  }

  @Test
  void getForJobApplicationReturnsOkWithList() throws Exception {
    when(noteService.getNotesForJobApplication(USER_ID, APP_ID))
        .thenReturn(List.of(sampleResponse()));

    mockMvc
        .perform(get("/api/notes/job-application/{id}", APP_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(NOTE_ID.toString()))
        .andExpect(jsonPath("$[0].content").value("Spoke with recruiter"));
  }

  @Test
  void getForJobApplicationReturnsNotFoundWhenUnowned() throws Exception {
    when(noteService.getNotesForJobApplication(USER_ID, APP_ID))
        .thenThrow(new ResourceNotFoundException("JobApplication", "id", APP_ID));

    mockMvc
        .perform(get("/api/notes/job-application/{id}", APP_ID))
        .andExpect(status().isNotFound());
  }

  @Test
  void deleteReturnsNoContent() throws Exception {
    mockMvc.perform(delete("/api/notes/{id}", NOTE_ID)).andExpect(status().isNoContent());
  }

  @Test
  void deleteReturnsNotFoundWhenUnowned() throws Exception {
    doThrow(new ResourceNotFoundException("Note", "id", NOTE_ID))
        .when(noteService)
        .deleteNote(USER_ID, NOTE_ID);

    mockMvc.perform(delete("/api/notes/{id}", NOTE_ID)).andExpect(status().isNotFound());
  }
}
