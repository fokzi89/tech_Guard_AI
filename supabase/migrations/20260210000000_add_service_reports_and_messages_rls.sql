-- ============================================================================
-- RLS POLICIES - SERVICE_REPORTS
-- ============================================================================

-- Super Admins can do everything with service reports
CREATE POLICY "super_admin_all_service_reports"
ON service_reports FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Technicians can view service reports for their own incidents
CREATE POLICY "users_own_service_reports_select"
ON service_reports FOR SELECT
TO authenticated
USING (
  incident_id IN (
    SELECT id FROM incidents WHERE user_id = auth.uid()
  )
);

-- Technicians can create service reports for their own incidents
CREATE POLICY "users_own_service_reports_insert"
ON service_reports FOR INSERT
TO authenticated
WITH CHECK (
  incident_id IN (
    SELECT id FROM incidents WHERE user_id = auth.uid()
  )
);

-- Technicians can update service reports for their own incidents
CREATE POLICY "users_own_service_reports_update"
ON service_reports FOR UPDATE
TO authenticated
USING (
  incident_id IN (
    SELECT id FROM incidents WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  incident_id IN (
    SELECT id FROM incidents WHERE user_id = auth.uid()
  )
);

-- Org Admins can view service reports for incidents in their organization
CREATE POLICY "org_admin_service_reports"
ON service_reports FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'org_admin'
  ) AND incident_id IN (
    SELECT i.id FROM incidents i
    JOIN profiles p ON i.user_id = p.id
    WHERE p.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  )
);

-- ============================================================================
-- RLS POLICIES - CONVERSATION_MESSAGES
-- ============================================================================

-- Super Admins can do everything with conversation messages
CREATE POLICY "super_admin_all_messages"
ON conversation_messages FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Technicians can view messages for their own incidents
CREATE POLICY "users_own_messages_select"
ON conversation_messages FOR SELECT
TO authenticated
USING (
  incident_id IN (
    SELECT id FROM incidents WHERE user_id = auth.uid()
  )
);

-- Technicians can create messages for their own incidents
CREATE POLICY "users_own_messages_insert"
ON conversation_messages FOR INSERT
TO authenticated
WITH CHECK (
  incident_id IN (
    SELECT id FROM incidents WHERE user_id = auth.uid()
  )
);

-- Technicians can update messages for their own incidents
CREATE POLICY "users_own_messages_update"
ON conversation_messages FOR UPDATE
TO authenticated
USING (
  incident_id IN (
    SELECT id FROM incidents WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  incident_id IN (
    SELECT id FROM incidents WHERE user_id = auth.uid()
  )
);

-- Org Admins can view messages for incidents in their organization
CREATE POLICY "org_admin_messages"
ON conversation_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'org_admin'
  ) AND incident_id IN (
    SELECT i.id FROM incidents i
    JOIN profiles p ON i.user_id = p.id
    WHERE p.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  )
);
