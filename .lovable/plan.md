
## Overview

Upgrade the ExamEye proctoring app to be fully admin-controlled with strict data isolation, MediaPipe eye detection, a 3-warning termination system, and comprehensive result pages.

---

## Phase 1: Database Schema Changes

Add columns and update RLS for admin data isolation:

- **profiles**: Add `admin_id` (UUID, nullable) — links students to the admin who created them
- **exams**: Already has `created_by` — will enforce it via RLS
- **exam_sessions**: Add `warnings_count` (integer, default 0)
- Update **RLS policies** on all tables so admins only see data they own (students they created, exams they made, sessions for their students)
- Create an **edge function** `create-student` that lets admins create student accounts (uses service role key to call `auth.admin.createUser`)

---

## Phase 2: Auth Configuration

- Disable public signup (only admins can create students via edge function)
- Keep login page for students and admins
- Remove "Sign Up" option from the Auth page for students

---

## Phase 3: Admin Panel Rebuild

Replace the current `AdminDashboard.tsx` with a full admin panel using sidebar navigation:

- **Sidebar** with sections: Dashboard, Students, Exams, Results
- **Create Student** form (name, email, password) — calls edge function
- **View Students** — list of students created by this admin
- **Create Exam** form (title, duration, description, instructions) with question builder (MCQ + subjective)
- **Manage Questions** — add/edit/delete questions for each exam
- **View Results** — see all exam sessions for admin's students with marks, warnings, cheating score, violation timeline

---

## Phase 4: Eye Detection with MediaPipe

- Install `@mediapipe/face_mesh` and `@mediapipe/camera_utils` (or use CDN)
- Replace the basic canvas skin-color detection in `cheatingDetection.ts` with MediaPipe Face Mesh landmarks
- Detect: looking left/right/down, eyes not on screen
- Integrate into ExamRoom webcam feed

---

## Phase 5: Warning System (3 Warnings Max)

- Change from risk-score-based termination to a **3-warning** system
- Each significant violation triggers a full-screen animated warning modal (shake animation)
- After 3 warnings: auto-submit exam, lock screen, show termination message
- Store `warnings_count` in `exam_sessions`
- Keep risk score as a secondary metric for display

---

## Phase 6: Result Page

- New `/result/:sessionId` route
- After exam submission/termination, redirect to result page
- Show: total marks scored (auto-grade MCQs), number of warnings, final cheating score, status (Valid/Suspicious/Terminated)
- If terminated: only count answers submitted before termination
- Modern card layout design

---

## Phase 7: Admin Result View

- Admin can view results of only their students
- Each result shows: marks, warnings count, cheating score, violation timeline
- Filter by exam, student, status

---

## Technical Details

- Edge function `create-student` uses Supabase Admin API to create auth user + profile + role
- MediaPipe Face Mesh loaded via CDN (`@mediapipe/face_mesh`) for zero-config
- Warning modal uses CSS `@keyframes shake` animation
- MCQ auto-grading compares `answers[q.id]` with `questions.correct_answer`
- Admin sidebar uses shadcn `Sidebar` component
