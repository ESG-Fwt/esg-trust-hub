
-- Allow public (anon) read of share tokens by token value for the public ESG profile page
CREATE POLICY "Anyone can view active share tokens by token" ON public.esg_share_tokens
  FOR SELECT TO anon USING (is_active = true);

-- Allow anon to increment view count
CREATE POLICY "Anyone can update view count on active tokens" ON public.esg_share_tokens
  FOR UPDATE TO anon USING (is_active = true) WITH CHECK (is_active = true);

-- Allow anon to read submissions for shared profiles (read-only, limited by app logic)
CREATE POLICY "Anon can read approved submissions" ON public.submissions
  FOR SELECT TO anon USING (status = 'approved');

-- Allow anon to read profiles for shared profiles
CREATE POLICY "Anon can read profiles" ON public.profiles
  FOR SELECT TO anon USING (true);

-- Allow anon to read vsme questionnaires for shared profiles
CREATE POLICY "Anon can read submitted questionnaires" ON public.vsme_questionnaires
  FOR SELECT TO anon USING (status = 'submitted');

-- Allow anon to read organizations for display
CREATE POLICY "Anon can read organizations" ON public.organizations
  FOR SELECT TO anon USING (true);
