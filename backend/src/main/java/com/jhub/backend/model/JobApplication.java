package com.jhub.backend.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.jhub.backend.model.enums.JobApplicationStatus;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * represents a job application tracked by a user
 * each user can have many job applications, and each job application can have many notes
 */
@Entity
@Table(name = "job_applications")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = { "user", "notes" })
@EqualsAndHashCode(of = "id")
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    @NotBlank(message = "Company name is required")
    @Size(max = 255, message = "Company name must not exceed 255 characters")
    private String company;

    @Column(nullable = false, length = 255)
    @NotBlank(message = "Job title is required")
    @Size(max = 255, message = "Job title must not exceed 255 characters")
    private String jobTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobApplicationStatus status = JobApplicationStatus.APPLIED;

    @Column(nullable = false)
    private LocalDate dateApplied;

    @Column(length = 2048)
    @Size(max = 2048, message = "Job posting URL must not exceed 2048 characters")
    private String jobPostingUrl;

    @Column(length = 255)
    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    @Min(value = 0, message = "Minimum salary must not be negative")
    private Integer salaryMin;

    @Min(value = 0, message = "Maximum salary must not be negative")
    private Integer salaryMax;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(
        mappedBy = "jobApplication",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<Note> notes = new ArrayList<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    @Builder
    public JobApplication(
        User user,
        String company,
        String jobTitle,
        JobApplicationStatus status,
        LocalDate dateApplied,
        String jobPostingUrl,
        String location,
        Integer salaryMin,
        Integer salaryMax,
        String description
    ) {
        this.user = user;
        this.company = company;
        this.jobTitle = jobTitle;
        this.status = status != null ? status : JobApplicationStatus.APPLIED;
        this.dateApplied = dateApplied;
        this.jobPostingUrl = jobPostingUrl;
        this.location = location;
        this.salaryMin = salaryMin;
        this.salaryMax = salaryMax;
        this.description = description;
    }

    public void addNote(Note note) {
        notes.add(note);
        note.setJobApplication(this);
    }

    public void removeNote(Note note) {
        notes.remove(note);
        note.setJobApplication(null);
    }
}
