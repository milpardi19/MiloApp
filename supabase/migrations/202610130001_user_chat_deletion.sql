-- Let each authenticated learner remove only their own contact-list row.
-- Existing RLS policy learning_contacts_delete_self restricts DELETE to
-- user_id = auth.uid(); the other participant and their message history remain.
GRANT DELETE ON TABLE public.learning_contacts TO authenticated;
