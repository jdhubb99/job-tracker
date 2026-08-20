package com.jhub.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.jhub.backend.dto.NoteCreateRequest;
import com.jhub.backend.dto.NoteResponse;
import com.jhub.backend.exception.ResourceNotFoundException;
import com.jhub.backend.model.JobApplication;
import com.jhub.backend.model.Note;
import com.jhub.backend.model.User;
import com.jhub.backend.model.enums.JobApplicationStatus;
import com.jhub.backend.repository.JobApplicationRepository;
import com.jhub.backend.repository.NoteRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

  @Mock private NoteRepository noteRepository;

  @Mock private JobApplicationRepository jobApplicationRepository;

  @InjectMocks private NoteService service;

  private User user;
  private UUID userId;
  private UUID otherUserId;
  private JobApplication application;
  private UUID applicationId;
  private Note note;
  private UUID noteId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    otherUserId = UUID.randomUUID();
    user =
        User.builder()
            .email("test@example.com")
            .password("password123")
            .firstName("Test")
            .lastName("User")
            .build();
    user.setId(userId);

    applicationId = UUID.randomUUID();
    application =
        JobApplication.builder()
            .user(user)
            .company("Acme Corp")
            .jobTitle("Software Engineer")
            .status(JobApplicationStatus.APPLIED)
            .dateApplied(LocalDate.of(2026, 1, 15))
            .build();
    application.setId(applicationId);

    noteId = UUID.randomUUID();
    note =
        Note.builder()
            .content("Spoke with recruiter")
            .followUp(true)
            .followUpDate(LocalDate.of(2026, 8, 1))
            .build();
    note.setId(noteId);
    note.setCreatedAt(Instant.now());
    note.setUpdatedAt(Instant.now());
    application.addNote(note);
  }

  @Nested
  class GetNotesForJobApplication {

    @Test
    void returnsNotesForOwnedApplication() {
      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
      when(noteRepository.findByJobApplicationIdOrderByCreatedAtDesc(applicationId))
          .thenReturn(List.of(note));

      List<NoteResponse> result = service.getNotesForJobApplication(userId, applicationId);

      assertThat(result).hasSize(1);
      assertThat(result.getFirst().content()).isEqualTo("Spoke with recruiter");
      assertThat(result.getFirst().jobApplicationId()).isEqualTo(applicationId);
    }

    @Test
    void throwsNotFoundWhenApplicationMissing() {
      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.getNotesForJobApplication(userId, applicationId))
          .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void throwsNotFoundWhenApplicationOwnedByAnotherUser() {
      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

      assertThatThrownBy(() -> service.getNotesForJobApplication(otherUserId, applicationId))
          .isInstanceOf(ResourceNotFoundException.class);
      verify(noteRepository, never()).findByJobApplicationIdOrderByCreatedAtDesc(any());
    }
  }

  @Nested
  class CreateNote {

    @Test
    void createsNoteOnOwnedApplication() {
      NoteCreateRequest request =
          new NoteCreateRequest(
              applicationId, "Follow up next week", true, LocalDate.of(2026, 8, 1));
      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
      when(noteRepository.save(any(Note.class)))
          .thenAnswer(
              invocation -> {
                Note saved = invocation.getArgument(0);
                saved.setId(UUID.randomUUID());
                saved.setCreatedAt(Instant.now());
                saved.setUpdatedAt(Instant.now());
                return saved;
              });

      NoteResponse result = service.createNote(userId, request);

      assertThat(result.content()).isEqualTo("Follow up next week");
      assertThat(result.followUp()).isTrue();
      assertThat(result.followUpDate()).isEqualTo(LocalDate.of(2026, 8, 1));
      assertThat(result.jobApplicationId()).isEqualTo(applicationId);
    }

    @Test
    void throwsNotFoundWhenApplicationOwnedByAnotherUser() {
      NoteCreateRequest request = new NoteCreateRequest(applicationId, "Sneaky note", false, null);
      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

      assertThatThrownBy(() -> service.createNote(otherUserId, request))
          .isInstanceOf(ResourceNotFoundException.class);
      verify(noteRepository, never()).save(any());
    }

    @Test
    void throwsNotFoundWhenApplicationMissing() {
      NoteCreateRequest request = new NoteCreateRequest(applicationId, "Orphan note", false, null);
      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.createNote(userId, request))
          .isInstanceOf(ResourceNotFoundException.class);
      verify(noteRepository, never()).save(any());
    }
  }

  @Nested
  class DeleteNote {

    @Test
    void removesNoteFromOwnedApplication() {
      when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));

      service.deleteNote(userId, noteId);

      assertThat(application.getNotes()).doesNotContain(note);
    }

    @Test
    void throwsNotFoundWhenNoteMissing() {
      when(noteRepository.findById(noteId)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.deleteNote(userId, noteId))
          .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void throwsNotFoundWhenNoteOwnedByAnotherUser() {
      when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));

      assertThatThrownBy(() -> service.deleteNote(otherUserId, noteId))
          .isInstanceOf(ResourceNotFoundException.class);
      assertThat(application.getNotes()).contains(note);
    }
  }
}
