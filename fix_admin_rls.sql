-- Allow the admin to read and manage all companies
CREATE POLICY "Admin can manage all companies" ON companies
  FOR ALL
  USING (
    (auth.jwt() ->> 'email') = 'mndl.yuvi@gmail.com'
  );
