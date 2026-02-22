CREATE INDEX idx_job_applications_user_id
    ON job_applications (user_id);

CREATE INDEX idx_job_applications_user_id_status
    ON job_applications (user_id, status);

CREATE INDEX idx_notes_job_application_id
    ON notes (job_application_id);
