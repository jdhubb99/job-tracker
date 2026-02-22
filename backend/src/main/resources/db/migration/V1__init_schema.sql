CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE job_applications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    company VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    date_applied DATE NOT NULL,
    job_posting_url VARCHAR(2048),
    location VARCHAR(255),
    salary_min INTEGER,
    salary_max INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_job_applications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notes (
    id UUID PRIMARY KEY,
    job_application_id UUID NOT NULL,
    content TEXT NOT NULL,
    follow_up BOOLEAN NOT NULL,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_notes_job_application FOREIGN KEY (job_application_id) REFERENCES job_applications(id)
);
