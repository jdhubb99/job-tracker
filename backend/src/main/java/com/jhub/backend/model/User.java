package com.jhub.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * user entity representing an application user stores authentication credentials and profile
 * information
 */
@Entity
@Table(name = "users") // "user" is a reserved word in PostgreSQL, so we use "users"
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = {"jobApplications"})
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(unique = true, nullable = false, length = 255)
  @Email(message = "Email must be a valid email address")
  @NotBlank(message = "Email is required")
  @Size(max = 255, message = "Email must not exceed 255 characters")
  private String email;

  @Column(nullable = false)
  @NotBlank(message = "Password is required")
  @Size(min = 8, max = 255, message = "Password must be between 8 and 255 characters")
  private String password; // will be hashed by the service layer

  @Column(nullable = false, length = 100)
  @NotBlank(message = "First name is required")
  @Size(max = 100, message = "First name must not exceed 100 characters")
  private String firstName;

  @Column(nullable = false, length = 100)
  @NotBlank(message = "Last name is required")
  @Size(max = 100, message = "Last name must not exceed 100 characters")
  private String lastName;

  @CreatedDate
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @LastModifiedDate
  @Column(nullable = false)
  private Instant updatedAt;

  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<JobApplication> jobApplications = new ArrayList<>();

  @Builder
  public User(String email, String password, String firstName, String lastName) {
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  public void addJobApplication(JobApplication jobApplication) {
    jobApplications.add(jobApplication);
    jobApplication.setUser(this);
  }

  public void removeJobApplication(JobApplication jobApplication) {
    jobApplications.remove(jobApplication);
    jobApplication.setUser(null);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    User other = (User) o;
    return id != null && Objects.equals(id, other.id);
  }

  @Override
  public int hashCode() {
    return getClass().hashCode();
  }
}
