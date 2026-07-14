package com.jhub.backend.service;

import com.jhub.backend.dto.NoteCreateRequest;
import com.jhub.backend.dto.NoteResponse;
import com.jhub.backend.exception.ResourceNotFoundException;
import com.jhub.backend.model.JobApplication;
import com.jhub.backend.model.Note;
import com.jhub.backend.repository.JobApplicationRepository;
import com.jhub.backend.repository.NoteRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class NoteService {

  private final NoteRepository noteRepository;
  private final JobApplicationRepository jobApplicationRepository;

  public NoteService(
      NoteRepository noteRepository, JobApplicationRepository jobApplicationRepository) {
    this.noteRepository = noteRepository;
    this.jobApplicationRepository = jobApplicationRepository;
  }

  public List<NoteResponse> getNotesForJobApplication(UUID userId, UUID jobApplicationId) {
    findJobApplicationAndVerifyOwnership(userId, jobApplicationId);
    return noteRepository.findByJobApplicationIdOrderByCreatedAtDesc(jobApplicationId).stream()
        .map(NoteResponse::from)
        .toList();
  }

  @Transactional
  public NoteResponse createNote(UUID userId, NoteCreateRequest request) {
    JobApplication application =
        findJobApplicationAndVerifyOwnership(userId, request.jobApplicationId());

    Note note =
        Note.builder()
            .content(request.content())
            .followUp(request.followUp())
            .followUpDate(request.followUpDate())
            .build();

    application.addNote(note);
    Note saved = noteRepository.save(note);
    return NoteResponse.from(saved);
  }

  @Transactional
  public void deleteNote(UUID userId, UUID noteId) {
    Note note =
        noteRepository
            .findById(noteId)
            .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

    // Not-owned resources are reported as 404 (not 403) so their existence
    // is never revealed to other accounts, matching JobApplicationService.
    if (!note.getJobApplication().getUser().getId().equals(userId)) {
      throw new ResourceNotFoundException("Note", "id", noteId);
    }

    note.getJobApplication().removeNote(note);
  }

  private JobApplication findJobApplicationAndVerifyOwnership(UUID userId, UUID jobApplicationId) {
    JobApplication application =
        jobApplicationRepository
            .findById(jobApplicationId)
            .orElseThrow(
                () -> new ResourceNotFoundException("JobApplication", "id", jobApplicationId));

    if (!application.getUser().getId().equals(userId)) {
      throw new ResourceNotFoundException("JobApplication", "id", jobApplicationId);
    }

    return application;
  }
}
