package com.jhub.backend.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.jhub.backend.config.TestContainersConfig;
import com.jhub.backend.model.JobApplication;
import com.jhub.backend.model.Note;
import com.jhub.backend.model.User;
import com.jhub.backend.model.enums.JobApplicationStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.context.ImportTestcontainers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ImportTestcontainers(TestContainersConfig.class)
@Transactional
@ActiveProfiles("test")
class NoteRepositoryTest {

  @Autowired private NoteRepository noteRepository;

  @PersistenceContext private EntityManager entityManager;

  private User user1;
  private User user2;
  private JobApplication app1;
  private JobApplication app2;

  @BeforeEach
  void setUp() {
    user1 =
        User.builder()
            .email("user1@example.com")
            .password("password123")
            .firstName("User")
            .lastName("One")
            .build();
    entityManager.persist(user1);

    user2 =
        User.builder()
            .email("user2@example.com")
            .password("password123")
            .firstName("User")
            .lastName("Two")
            .build();
    entityManager.persist(user2);

    app1 =
        JobApplication.builder()
            .company("Company A")
            .jobTitle("Developer")
            .status(JobApplicationStatus.APPLIED)
            .dateApplied(LocalDate.of(2026, 1, 10))
            .build();
    user1.addJobApplication(app1);
    entityManager.persist(app1);

    app2 =
        JobApplication.builder()
            .company("Company B")
            .jobTitle("Engineer")
            .status(JobApplicationStatus.INTERVIEWING)
            .dateApplied(LocalDate.of(2026, 1, 15))
            .build();
    user2.addJobApplication(app2);
    entityManager.persist(app2);

    persistNote(app1, "First note", false, null);
    persistNote(app1, "Follow up with recruiter", true, LocalDate.of(2026, 7, 20));
    persistNote(app1, "Follow up far out", true, LocalDate.of(2026, 12, 1));
    persistNote(app2, "Other user's follow-up", true, LocalDate.of(2026, 7, 21));

    entityManager.flush();
    entityManager.clear();
  }

  private void persistNote(
      JobApplication application, String content, boolean followUp, LocalDate followUpDate) {
    Note note =
        Note.builder().content(content).followUp(followUp).followUpDate(followUpDate).build();
    application.addNote(note);
    entityManager.persist(note);
  }

  @Test
  void findByJobApplicationId_returnsOnlyThatApplicationsNotes() {
    List<Note> notes = noteRepository.findByJobApplicationIdOrderByCreatedAtDesc(app1.getId());

    assertThat(notes).hasSize(3);
    assertThat(notes).extracting(Note::getContent).doesNotContain("Other user's follow-up");
  }

  @Test
  void findFollowUpsDueBetween_returnsOnlyFollowUpsInRangeForUser() {
    List<Note> followUps =
        noteRepository.findFollowUpsDueBetween(
            user1.getId(), LocalDate.of(2026, 7, 14), LocalDate.of(2026, 7, 31));

    assertThat(followUps).hasSize(1);
    assertThat(followUps.getFirst().getContent()).isEqualTo("Follow up with recruiter");
  }

  @Test
  void findFollowUpsDueBetween_excludesOtherUsersFollowUps() {
    List<Note> followUps =
        noteRepository.findFollowUpsDueBetween(
            user1.getId(), LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));

    assertThat(followUps).extracting(Note::getContent).doesNotContain("Other user's follow-up");
  }

  @Test
  void findFollowUpsDueBetween_ordersBySoonestFirst() {
    List<Note> followUps =
        noteRepository.findFollowUpsDueBetween(
            user1.getId(), LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31));

    assertThat(followUps).hasSize(2);
    assertThat(followUps.getFirst().getFollowUpDate()).isEqualTo(LocalDate.of(2026, 7, 20));
    assertThat(followUps.getLast().getFollowUpDate()).isEqualTo(LocalDate.of(2026, 12, 1));
  }

  @Test
  void deletingNoteViaOrphanRemoval_removesRow() {
    JobApplication managedApp = entityManager.find(JobApplication.class, app1.getId());
    Note toRemove = managedApp.getNotes().getFirst();
    managedApp.removeNote(toRemove);
    entityManager.flush();
    entityManager.clear();

    assertThat(noteRepository.findByJobApplicationIdOrderByCreatedAtDesc(app1.getId())).hasSize(2);
  }
}
