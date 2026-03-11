-- Migration 00019: GA Staff permissions expansion
-- Allow ga_staff to insert into job_requests (needed to link requests when creating jobs)

DROP POLICY IF EXISTS "job_requests_insert_lead_admin" ON public.job_requests;
CREATE POLICY "job_requests_insert_lead_admin_staff" ON public.job_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = current_user_company_id()
    AND current_user_role() IN ('ga_lead', 'admin', 'ga_staff')
  );
