package com.jhub.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jhub.backend.dto.JobApplicationCreateRequest;
import com.jhub.backend.dto.JobApplicationResponse;
import com.jhub.backend.dto.JobApplicationUpdateRequest;
import com.jhub.backend.exception.ResourceNotFoundException;
import com.jhub.backend.model.JobApplication;
import com.jhub.backend.model.User;
import com.jhub.backend.model.enums.JobApplicationStatus;
import com.jhub.backend.repository.JobApplicationRepository;
import com.jhub.backend.repository.UserRepository;

@Service
@Transactional(readOnly = true)
public class JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final UserRepository userRepository;

    public JobApplicationService(JobApplicationRepository jobApplicationRepository,
                                 UserRepository userRepository) {
        this.jobApplicationRepository = jobApplicationRepository;
        this.userRepository = userRepository;
    }

    public List<JobApplicationResponse> getAllApplicationsForUser(UUID userId) {
        return jobApplicationRepository.findByUserId(userId).stream()
                .map(JobApplicationResponse::from)
                .toList();
    }

    public List<JobApplicationResponse> getApplicationsByStatus(UUID userId, JobApplicationStatus status) {
        return jobApplicationRepository.findByUserIdAndStatus(userId, status).stream()
                .map(JobApplicationResponse::from)
                .toList();
    }

    public JobApplicationResponse getApplicationById(UUID userId, UUID applicationId) {
        JobApplication application = findApplicationByIdAndVerifyOwnership(userId, applicationId);
        return JobApplicationResponse.from(application);
    }

    @Transactional
    public JobApplicationResponse createApplication(UUID userId, JobApplicationCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        JobApplication application = JobApplication.builder()
                .company(request.company())
                .jobTitle(request.jobTitle())
                .status(request.status())
                .dateApplied(request.dateApplied())
                .jobPostingUrl(request.jobPostingUrl())
                .location(request.location())
                .salaryMin(request.salaryMin())
                .salaryMax(request.salaryMax())
                .description(request.description())
                .build();

        user.addJobApplication(application);
        JobApplication saved = jobApplicationRepository.save(application);
        return JobApplicationResponse.from(saved);
    }

    @Transactional
    public JobApplicationResponse updateApplication(UUID userId, UUID applicationId,
                                                     JobApplicationUpdateRequest request) {
        JobApplication application = findApplicationByIdAndVerifyOwnership(userId, applicationId);

        if (request.company() != null) {
            application.setCompany(request.company());
        }
        if (request.jobTitle() != null) {
            application.setJobTitle(request.jobTitle());
        }
        if (request.dateApplied() != null) {
            application.setDateApplied(request.dateApplied());
        }
        if (request.status() != null) {
            application.setStatus(request.status());
        }
        if (request.jobPostingUrl() != null) {
            application.setJobPostingUrl(request.jobPostingUrl());
        }
        if (request.location() != null) {
            application.setLocation(request.location());
        }
        if (request.salaryMin() != null) {
            application.setSalaryMin(request.salaryMin());
        }
        if (request.salaryMax() != null) {
            application.setSalaryMax(request.salaryMax());
        }
        if (request.description() != null) {
            application.setDescription(request.description());
        }

        JobApplication saved = jobApplicationRepository.save(application);
        return JobApplicationResponse.from(saved);
    }

    @Transactional
    public void deleteApplication(UUID userId, UUID applicationId) {
        JobApplication application = findApplicationByIdAndVerifyOwnership(userId, applicationId);
        application.getUser().removeJobApplication(application);
    }

    private JobApplication findApplicationByIdAndVerifyOwnership(UUID userId, UUID applicationId) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("JobApplication", "id", applicationId));

        if (!application.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("JobApplication", "id", applicationId);
        }

        return application;
    }
}
