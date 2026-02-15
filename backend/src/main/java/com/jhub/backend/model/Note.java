package com.jhub.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * represents a timestamped note on a job application
 */
@Entity
@Table(name = "notes")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = { "jobApplication" })
@EqualsAndHashCode(of = "id")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_application_id", nullable = false)
    private JobApplication jobApplication;

    @Column(nullable = false, columnDefinition = "TEXT")
    @NotBlank(message = "Note content is required")
    private String content;

    @Column(nullable = false)
    private boolean followUp;

    private LocalDate followUpDate;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    @Builder
    public Note(
        JobApplication jobApplication,
        String content,
        boolean followUp,
        LocalDate followUpDate
    ) {
        this.jobApplication = jobApplication;
        this.content = content;
        this.followUp = followUp;
        this.followUpDate = followUpDate;
    }
}
