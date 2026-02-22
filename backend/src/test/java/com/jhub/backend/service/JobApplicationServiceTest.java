package com.jhub.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.jhub.backend.dto.JobApplicationCreateRequest;
import com.jhub.backend.dto.JobApplicationResponse;
import com.jhub.backend.dto.JobApplicationUpdateRequest;
import com.jhub.backend.exception.ResourceNotFoundException;
import com.jhub.backend.model.JobApplication;
import com.jhub.backend.model.User;
import com.jhub.backend.model.enums.JobApplicationStatus;
import com.jhub.backend.repository.JobApplicationRepository;
import com.jhub.backend.repository.UserRepository;
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
class JobApplicationServiceTest {

  @Mock private JobApplicationRepository jobApplicationRepository;

  @Mock private UserRepository userRepository;

  @InjectMocks private JobApplicationService service;

  private User user;
  private UUID userId;
  private JobApplication application;
  private UUID applicationId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    user =
        User.builder()
            .email("test@example.com")
            .password("password123")
            .firstName("Test")
            .lastName("User")
            .build();
    // Set the ID via reflection-free approach: the entity generates one, we capture it
    // For testing, we need a predictable ID, so we set it via setter
    user.setId(userId);

    applicationId = UUID.randomUUID();
    application =
        JobApplication.builder()
            .user(user)
            .company("Acme Corp")
            .jobTitle("Software Engineer")
            .status(JobApplicationStatus.APPLIED)
            .dateApplied(LocalDate.of(2026, 1, 15))
            .jobPostingUrl("https://example.com/job")
            .location("Remote")
            .salaryMin(80000)
            .salaryMax(120000)
            .description("Great opportunity")
            .build();
    application.setId(applicationId);
    application.setCreatedAt(Instant.now());
    application.setUpdatedAt(Instant.now());
  }

  @Nested
  class ResponseMapping {

    @Test
    void responseContainsUserIdNotUserEntity() {
      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

      JobApplicationResponse result = service.getApplicationById(userId, applicationId);

      assertThat(result.userId()).isEqualTo(userId);
      assertThat(result).hasNoNullFieldsOrProperties();
      assertThat(result.getClass().getRecordComponents()).extracting("name").doesNotContain("user");
    }
  }

  @Nested
  class GetAllApplicationsForUser {

    @Test
    void returnsListOfResponses() {
      when(jobApplicationRepository.findByUserId(userId)).thenReturn(List.of(application));

      List<JobApplicationResponse> result = service.getAllApplicationsForUser(userId);

      assertThat(result).hasSize(1);
      assertThat(result.getFirst().company()).isEqualTo("Acme Corp");
      assertThat(result.getFirst().userId()).isEqualTo(userId);
    }

    @Test
    void returnsEmptyListWhenNoneExist() {
      when(jobApplicationRepository.findByUserId(userId)).thenReturn(List.of());

      List<JobApplicationResponse> result = service.getAllApplicationsForUser(userId);

      assertThat(result).isEmpty();
    }
  }

  @Nested
  class GetApplicationsByStatus {

    @Test
    void returnsFilteredList() {
      when(jobApplicationRepository.findByUserIdAndStatus(userId, JobApplicationStatus.APPLIED))
          .thenReturn(List.of(application));

      List<JobApplicationResponse> result =
          service.getApplicationsByStatus(userId, JobApplicationStatus.APPLIED);

      assertThat(result).hasSize(1);
      assertThat(result.getFirst().status()).isEqualTo(JobApplicationStatus.APPLIED);
    }

    @Test
    void returnsEmptyForNoMatches() {
      when(jobApplicationRepository.findByUserIdAndStatus(userId, JobApplicationStatus.OFFER))
          .thenReturn(List.of());

      List<JobApplicationResponse> result =
          service.getApplicationsByStatus(userId, JobApplicationStatus.OFFER);

      assertThat(result).isEmpty();
    }
  }

  @Nested
  class GetApplicationById {

    @Test
    void returnsCorrectResponse() {
      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

      JobApplicationResponse result = service.getApplicationById(userId, applicationId);

      assertThat(result.id()).isEqualTo(applicationId);
      assertThat(result.company()).isEqualTo("Acme Corp");
    }

    @Test
    void throwsWhenNotFound() {
      UUID unknownId = UUID.randomUUID();
      when(jobApplicationRepository.findById(unknownId)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.getApplicationById(userId, unknownId))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessageContaining("JobApplication");
    }

    @Test
    void throwsWhenOwnedByDifferentUser() {
      UUID otherUserId = UUID.randomUUID();
      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

      assertThatThrownBy(() -> service.getApplicationById(otherUserId, applicationId))
          .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void ownershipFailureIsIndistinguishableFromNotFound() {
      UUID otherUserId = UUID.randomUUID();
      UUID missingId = UUID.randomUUID();

      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
      when(jobApplicationRepository.findById(missingId)).thenReturn(Optional.empty());

      ResourceNotFoundException ownershipError = null;
      ResourceNotFoundException notFoundError = null;

      try {
        service.getApplicationById(otherUserId, applicationId);
      } catch (ResourceNotFoundException e) {
        ownershipError = e;
      }
      try {
        service.getApplicationById(userId, missingId);
      } catch (ResourceNotFoundException e) {
        notFoundError = e;
      }

      assertThat(ownershipError).isNotNull();
      assertThat(notFoundError).isNotNull();
      assertThat(ownershipError.getResourceName()).isEqualTo(notFoundError.getResourceName());
      assertThat(ownershipError.getFieldName()).isEqualTo(notFoundError.getFieldName());
    }
  }

  @Nested
  class CreateApplication {

    @Test
    void createsAndReturnsResponse() {
      JobApplicationCreateRequest request =
          new JobApplicationCreateRequest(
              "New Corp",
              "Developer",
              LocalDate.of(2026, 2, 1),
              JobApplicationStatus.APPLIED,
              "https://newcorp.com/job",
              "NYC",
              90000,
              130000,
              "Exciting role");

      when(userRepository.findById(userId)).thenReturn(Optional.of(user));
      when(jobApplicationRepository.save(any(JobApplication.class)))
          .thenAnswer(
              invocation -> {
                JobApplication saved = invocation.getArgument(0);
                saved.setCreatedAt(Instant.now());
                saved.setUpdatedAt(Instant.now());
                return saved;
              });

      JobApplicationResponse result = service.createApplication(userId, request);

      assertThat(result.company()).isEqualTo("New Corp");
      assertThat(result.jobTitle()).isEqualTo("Developer");
      assertThat(result.userId()).isEqualTo(userId);
      verify(jobApplicationRepository).save(any(JobApplication.class));
    }

    @Test
    void throwsWhenUserNotFound() {
      UUID unknownUserId = UUID.randomUUID();
      JobApplicationCreateRequest request =
          new JobApplicationCreateRequest(
              "Corp", "Dev", LocalDate.now(), null, null, null, null, null, null);

      when(userRepository.findById(unknownUserId)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.createApplication(unknownUserId, request))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessageContaining("User");
    }

    @Test
    void mapsAllDtoFieldsCorrectly() {
      JobApplicationCreateRequest request =
          new JobApplicationCreateRequest(
              "Mapped Corp",
              "Mapped Title",
              LocalDate.of(2026, 3, 1),
              JobApplicationStatus.INTERVIEWING,
              "https://mapped.com",
              "London",
              100000,
              150000,
              "Full description");

      when(userRepository.findById(userId)).thenReturn(Optional.of(user));
      when(jobApplicationRepository.save(any(JobApplication.class)))
          .thenAnswer(
              invocation -> {
                JobApplication saved = invocation.getArgument(0);
                saved.setCreatedAt(Instant.now());
                saved.setUpdatedAt(Instant.now());
                return saved;
              });

      JobApplicationResponse result = service.createApplication(userId, request);

      assertThat(result.company()).isEqualTo("Mapped Corp");
      assertThat(result.jobTitle()).isEqualTo("Mapped Title");
      assertThat(result.dateApplied()).isEqualTo(LocalDate.of(2026, 3, 1));
      assertThat(result.status()).isEqualTo(JobApplicationStatus.INTERVIEWING);
      assertThat(result.jobPostingUrl()).isEqualTo("https://mapped.com");
      assertThat(result.location()).isEqualTo("London");
      assertThat(result.salaryMin()).isEqualTo(100000);
      assertThat(result.salaryMax()).isEqualTo(150000);
      assertThat(result.description()).isEqualTo("Full description");
    }
  }

  @Nested
  class UpdateApplication {

    @Test
    void updatesOnlyNonNullFields() {
      JobApplicationUpdateRequest request =
          new JobApplicationUpdateRequest(
              "Updated Corp", null, null, null, null, null, null, null, null);

      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
      when(jobApplicationRepository.save(any(JobApplication.class))).thenReturn(application);

      JobApplicationResponse result = service.updateApplication(userId, applicationId, request);

      assertThat(result.company()).isEqualTo("Updated Corp");
      assertThat(result.jobTitle()).isEqualTo("Software Engineer"); // unchanged
    }

    @Test
    void preservesFieldsWhenRequestFieldsAreNull() {
      JobApplicationUpdateRequest request =
          new JobApplicationUpdateRequest(null, null, null, null, null, null, null, null, null);

      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
      when(jobApplicationRepository.save(any(JobApplication.class))).thenReturn(application);

      JobApplicationResponse result = service.updateApplication(userId, applicationId, request);

      assertThat(result.company()).isEqualTo("Acme Corp");
      assertThat(result.jobTitle()).isEqualTo("Software Engineer");
      assertThat(result.status()).isEqualTo(JobApplicationStatus.APPLIED);
    }

    @Test
    void updatesAllFieldsWhenAllProvided() {
      JobApplicationUpdateRequest request =
          new JobApplicationUpdateRequest(
              "New Company",
              "New Title",
              LocalDate.of(2026, 6, 1),
              JobApplicationStatus.OFFER,
              "https://new.com",
              "Berlin",
              150000,
              200000,
              "New description");

      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
      when(jobApplicationRepository.save(any(JobApplication.class))).thenReturn(application);

      JobApplicationResponse result = service.updateApplication(userId, applicationId, request);

      assertThat(result.company()).isEqualTo("New Company");
      assertThat(result.jobTitle()).isEqualTo("New Title");
      assertThat(result.dateApplied()).isEqualTo(LocalDate.of(2026, 6, 1));
      assertThat(result.status()).isEqualTo(JobApplicationStatus.OFFER);
      assertThat(result.jobPostingUrl()).isEqualTo("https://new.com");
      assertThat(result.location()).isEqualTo("Berlin");
      assertThat(result.salaryMin()).isEqualTo(150000);
      assertThat(result.salaryMax()).isEqualTo(200000);
      assertThat(result.description()).isEqualTo("New description");
    }

    @Test
    void throwsForNonExistentApplication() {
      UUID unknownId = UUID.randomUUID();
      JobApplicationUpdateRequest request =
          new JobApplicationUpdateRequest("Corp", null, null, null, null, null, null, null, null);

      when(jobApplicationRepository.findById(unknownId)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.updateApplication(userId, unknownId, request))
          .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void throwsForWrongOwner() {
      UUID otherUserId = UUID.randomUUID();
      JobApplicationUpdateRequest request =
          new JobApplicationUpdateRequest("Corp", null, null, null, null, null, null, null, null);

      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

      assertThatThrownBy(() -> service.updateApplication(otherUserId, applicationId, request))
          .isInstanceOf(ResourceNotFoundException.class);
    }
  }

  @Nested
  class DeleteApplication {

    @Test
    void deletesSuccessfully() {
      user.getJobApplications().add(application);
      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

      service.deleteApplication(userId, applicationId);

      assertThat(user.getJobApplications()).doesNotContain(application);
    }

    @Test
    void throwsForNonExistentApplication() {
      UUID unknownId = UUID.randomUUID();
      when(jobApplicationRepository.findById(unknownId)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.deleteApplication(userId, unknownId))
          .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void throwsForWrongOwner() {
      UUID otherUserId = UUID.randomUUID();
      when(jobApplicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

      assertThatThrownBy(() -> service.deleteApplication(otherUserId, applicationId))
          .isInstanceOf(ResourceNotFoundException.class);
    }
  }
}
