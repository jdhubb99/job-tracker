package com.jhub.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.context.ImportTestcontainers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.jhub.backend.config.TestContainersConfig;
import com.jhub.backend.model.JobApplication;
import com.jhub.backend.model.User;
import com.jhub.backend.model.enums.JobApplicationStatus;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ImportTestcontainers(TestContainersConfig.class)
@Transactional
@ActiveProfiles("test")
class JobApplicationRepositoryTest {

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = User.builder()
                .email("user1@example.com")
                .password("password123")
                .firstName("User")
                .lastName("One")
                .build();
        entityManager.persist(user1);

        user2 = User.builder()
                .email("user2@example.com")
                .password("password123")
                .firstName("User")
                .lastName("Two")
                .build();
        entityManager.persist(user2);

        JobApplication app1 = JobApplication.builder()
                .company("Company A")
                .jobTitle("Developer")
                .status(JobApplicationStatus.APPLIED)
                .dateApplied(LocalDate.of(2026, 1, 10))
                .build();
        user1.addJobApplication(app1);
        entityManager.persist(app1);

        JobApplication app2 = JobApplication.builder()
                .company("Company B")
                .jobTitle("Engineer")
                .status(JobApplicationStatus.INTERVIEWING)
                .dateApplied(LocalDate.of(2026, 1, 15))
                .build();
        user1.addJobApplication(app2);
        entityManager.persist(app2);

        JobApplication app3 = JobApplication.builder()
                .company("Company C")
                .jobTitle("Architect")
                .status(JobApplicationStatus.APPLIED)
                .dateApplied(LocalDate.of(2026, 1, 20))
                .build();
        user2.addJobApplication(app3);
        entityManager.persist(app3);

        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void findByUserId_returnsOnlyThatUsersApplications() {
        List<JobApplication> results = jobApplicationRepository.findByUserId(user1.getId());

        assertThat(results).hasSize(2);
        assertThat(results).allMatch(app -> app.getUser().getId().equals(user1.getId()));
    }

    @Test
    void findByUserId_returnsEmptyForUserWithNoApplications() {
        User user3 = User.builder()
                .email("user3@example.com")
                .password("password123")
                .firstName("User")
                .lastName("Three")
                .build();
        entityManager.persist(user3);
        entityManager.flush();

        List<JobApplication> results = jobApplicationRepository.findByUserId(user3.getId());

        assertThat(results).isEmpty();
    }

    @Test
    void findByUserIdAndStatus_filtersCorrectly() {
        List<JobApplication> results = jobApplicationRepository
                .findByUserIdAndStatus(user1.getId(), JobApplicationStatus.APPLIED);

        assertThat(results).hasSize(1);
        assertThat(results.getFirst().getCompany()).isEqualTo("Company A");
    }

    @Test
    void findByUserIdAndStatus_returnsEmptyForNoMatches() {
        List<JobApplication> results = jobApplicationRepository
                .findByUserIdAndStatus(user1.getId(), JobApplicationStatus.OFFER);

        assertThat(results).isEmpty();
    }

    @Test
    void existsByIdAndUserId_returnsTrueForOwner() {
        UUID appId = jobApplicationRepository.findByUserId(user1.getId()).getFirst().getId();

        assertThat(jobApplicationRepository.existsByIdAndUserId(appId, user1.getId())).isTrue();
    }

    @Test
    void existsByIdAndUserId_returnsFalseForNonOwner() {
        UUID appId = jobApplicationRepository.findByUserId(user1.getId()).getFirst().getId();

        assertThat(jobApplicationRepository.existsByIdAndUserId(appId, user2.getId())).isFalse();
    }

    @Test
    void existsByIdAndUserId_returnsFalseForNonExistentApp() {
        assertThat(jobApplicationRepository.existsByIdAndUserId(UUID.randomUUID(), user1.getId())).isFalse();
    }
}
