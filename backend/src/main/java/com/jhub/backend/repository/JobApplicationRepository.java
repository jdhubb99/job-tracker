package com.jhub.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jhub.backend.model.JobApplication;
import com.jhub.backend.model.enums.JobApplicationStatus;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {

    List<JobApplication> findByUserId(UUID userId);

    Page<JobApplication> findByUserId(UUID userId, Pageable pageable);

    List<JobApplication> findByUserIdAndStatus(UUID userId, JobApplicationStatus status);

    boolean existsByIdAndUserId(UUID id, UUID userId);
}
