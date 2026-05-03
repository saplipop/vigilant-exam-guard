
-- Add admin_id to profiles
ALTER TABLE public.profiles ADD COLUMN admin_id UUID;

-- Add warnings_count to exam_sessions
ALTER TABLE public.exam_sessions ADD COLUMN warnings_count INTEGER NOT NULL DEFAULT 0;

-- Drop existing RLS policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- New profiles policies with admin isolation
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view their students"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Drop existing RLS policies on exams
DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
DROP POLICY IF EXISTS "Anyone authenticated can view active exams" ON public.exams;

-- New exams policies with admin isolation
CREATE POLICY "Admins can manage own exams"
ON public.exams FOR ALL
USING (has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Students can view active exams"
ON public.exams FOR SELECT
TO authenticated
USING (is_active = true);

-- Drop existing RLS policies on exam_sessions
DROP POLICY IF EXISTS "Admins can update all sessions" ON public.exam_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.exam_sessions;
DROP POLICY IF EXISTS "Students can insert own sessions" ON public.exam_sessions;
DROP POLICY IF EXISTS "Students can update own sessions" ON public.exam_sessions;
DROP POLICY IF EXISTS "Students can view own sessions" ON public.exam_sessions;

-- New exam_sessions policies with admin isolation
CREATE POLICY "Students can insert own sessions"
ON public.exam_sessions FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own sessions"
ON public.exam_sessions FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Students can view own sessions"
ON public.exam_sessions FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Admins can view sessions of their students"
ON public.exam_sessions FOR SELECT
USING (
  has_role(auth.uid(), 'admin') AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = exam_sessions.student_id
    AND profiles.admin_id = auth.uid()
  )
);

CREATE POLICY "Admins can update sessions of their students"
ON public.exam_sessions FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = exam_sessions.student_id
    AND profiles.admin_id = auth.uid()
  )
);

-- Drop existing RLS policies on violations
DROP POLICY IF EXISTS "Admins can view all violations" ON public.violations;
DROP POLICY IF EXISTS "Students can insert violations for own sessions" ON public.violations;
DROP POLICY IF EXISTS "Students can view own violations" ON public.violations;

-- New violations policies
CREATE POLICY "Students can insert violations for own sessions"
ON public.violations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exam_sessions
    WHERE exam_sessions.id = violations.session_id
    AND exam_sessions.student_id = auth.uid()
  )
);

CREATE POLICY "Students can view own violations"
ON public.violations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.exam_sessions
    WHERE exam_sessions.id = violations.session_id
    AND exam_sessions.student_id = auth.uid()
  )
);

CREATE POLICY "Admins can view violations of their students"
ON public.violations FOR SELECT
USING (
  has_role(auth.uid(), 'admin') AND
  EXISTS (
    SELECT 1 FROM public.exam_sessions
    JOIN public.profiles ON profiles.id = exam_sessions.student_id
    WHERE exam_sessions.id = violations.session_id
    AND profiles.admin_id = auth.uid()
  )
);

-- Drop existing RLS policies on questions
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated can view questions for active exams" ON public.questions;

-- New questions policies with admin isolation
CREATE POLICY "Admins can manage own questions"
ON public.questions FOR ALL
USING (
  has_role(auth.uid(), 'admin') AND
  EXISTS (
    SELECT 1 FROM public.exams
    WHERE exams.id = questions.exam_id
    AND exams.created_by = auth.uid()
  )
);

CREATE POLICY "Students can view questions for active exams"
ON public.questions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exams
    WHERE exams.id = questions.exam_id
    AND exams.is_active = true
  )
);
