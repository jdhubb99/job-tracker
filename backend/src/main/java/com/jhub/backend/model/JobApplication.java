package com.jhub.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.*;

/**
 * represents a job application tracked by a user
 * each user can have many job applications, and each job application can have many notes
 */
@Entity
@Table(name = "job_applications")
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

    @Column(nullable = false)
    @NotBlank(message = "Company name is required")
    private String company;

    @Column(nullable = false)
    @NotBlank(message = "Job title is required")
    private String jobTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobApplicationStatus status = JobApplicationStatus.APPLIED;

    @Column(nullable = false)
    private LocalDate dateApplied;

    private String jobPostingUrl;

    private String location;

    private Integer salaryMin;

    private Integer salaryMax;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(
        mappedBy = "jobApplication",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<Note> notes = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

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

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
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
