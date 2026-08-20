package com.jhub.backend.controller;

import com.jhub.backend.dto.NoteCreateRequest;
import com.jhub.backend.dto.NoteResponse;
import com.jhub.backend.security.JwtSubjectParser;
import com.jhub.backend.service.NoteService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

  private final NoteService noteService;

  public NoteController(NoteService noteService) {
    this.noteService = noteService;
  }

  @PostMapping
  public ResponseEntity<NoteResponse> create(
      @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody NoteCreateRequest request) {
    UUID userId = JwtSubjectParser.parseUserId(jwt);
    NoteResponse response = noteService.createNote(userId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/job-application/{jobApplicationId}")
  public ResponseEntity<List<NoteResponse>> getForJobApplication(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID jobApplicationId) {
    UUID userId = JwtSubjectParser.parseUserId(jwt);
    List<NoteResponse> responses = noteService.getNotesForJobApplication(userId, jobApplicationId);
    return ResponseEntity.ok(responses);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
    UUID userId = JwtSubjectParser.parseUserId(jwt);
    noteService.deleteNote(userId, id);
    return ResponseEntity.noContent().build();
  }
}
