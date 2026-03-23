#!/usr/bin/env bash
# Seed test job applications for UI development.
# Usage: ./scripts/seed-jobs.sh [email] [password]
#
# Requires the backend + PostgreSQL to be running (./docker-dev.sh up).
# Registers a test user (or logs in if it already exists), then creates sample jobs.

set -euo pipefail

API="http://localhost:8080/api"
EMAIL="${1:-test@example.com}"
PASSWORD="${2:-password123}"

echo "→ Attempting login as $EMAIL..."
LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN" | tail -1)
BODY=$(echo "$LOGIN" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo "→ Login failed ($HTTP_CODE), registering new user..."
  REG=$(curl -s -X POST "$API/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"firstName\":\"Test\",\"lastName\":\"User\"}")
  TOKEN=$(echo "$REG" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
else
  TOKEN=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
fi

echo "→ Authenticated. Creating job applications..."

create_job() {
  curl -s -o /dev/null -w "  %{http_code} $1 - $2\n" \
    -X POST "$API/job-applications" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$3"
}

create_job "Google" "Software Engineer" '{
  "company": "Google",
  "jobTitle": "Software Engineer",
  "dateApplied": "2026-03-01",
  "status": "INTERVIEWING",
  "location": "Mountain View, CA",
  "salaryMin": 180000,
  "salaryMax": 250000,
  "description": "L5 backend role on Cloud team"
}'

create_job "Stripe" "Backend Engineer" '{
  "company": "Stripe",
  "jobTitle": "Backend Engineer",
  "dateApplied": "2026-03-05",
  "status": "APPLIED",
  "location": "Remote",
  "salaryMin": 170000,
  "salaryMax": 230000
}'

create_job "Figma" "Full Stack Developer" '{
  "company": "Figma",
  "jobTitle": "Full Stack Developer",
  "dateApplied": "2026-02-20",
  "status": "OFFER",
  "location": "San Francisco, CA",
  "salaryMin": 190000,
  "salaryMax": 260000
}'

create_job "Netflix" "Senior Software Engineer" '{
  "company": "Netflix",
  "jobTitle": "Senior Software Engineer",
  "dateApplied": "2026-02-15",
  "status": "REJECTED",
  "location": "Los Gatos, CA",
  "salaryMin": 200000,
  "salaryMax": 300000
}'

create_job "Shopify" "Developer" '{
  "company": "Shopify",
  "jobTitle": "Developer",
  "dateApplied": "2026-03-10",
  "status": "APPLIED",
  "location": "Remote"
}'

create_job "Linear" "Frontend Engineer" '{
  "company": "Linear",
  "jobTitle": "Frontend Engineer",
  "dateApplied": "2026-03-15",
  "status": "INTERVIEWING",
  "location": "Remote",
  "salaryMin": 150000,
  "salaryMax": 200000
}'

create_job "Vercel" "Software Engineer" '{
  "company": "Vercel",
  "jobTitle": "Software Engineer",
  "dateApplied": "2026-03-18",
  "status": "APPLIED",
  "location": "Remote",
  "salaryMin": 160000,
  "salaryMax": 220000
}'

create_job "Datadog" "Platform Engineer" '{
  "company": "Datadog",
  "jobTitle": "Platform Engineer",
  "dateApplied": "2026-01-28",
  "status": "WITHDRAWN",
  "location": "New York, NY",
  "salaryMin": 175000,
  "salaryMax": 240000
}'

create_job "Notion" "Backend Developer" '{
  "company": "Notion",
  "jobTitle": "Backend Developer",
  "dateApplied": "2026-03-20",
  "status": "ACCEPTED",
  "location": "San Francisco, CA",
  "salaryMin": 185000,
  "salaryMax": 255000
}'

echo "→ Done! 9 job applications seeded."
