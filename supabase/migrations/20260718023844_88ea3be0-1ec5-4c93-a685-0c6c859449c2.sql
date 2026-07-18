
-- notification_tags
CREATE TABLE public.notification_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#a78bfa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_tags TO anon, authenticated;
GRANT ALL ON public.notification_tags TO service_role;
ALTER TABLE public.notification_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read notification_tags" ON public.notification_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert notification_tags" ON public.notification_tags FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update notification_tags" ON public.notification_tags FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete notification_tags" ON public.notification_tags FOR DELETE TO anon, authenticated USING (true);

-- notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tag_id UUID REFERENCES public.notification_tags(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_created_at_idx ON public.notifications (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read notifications" ON public.notifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert notifications" ON public.notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update notifications" ON public.notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete notifications" ON public.notifications FOR DELETE TO anon, authenticated USING (true);

-- notification_reads
CREATE TABLE public.notification_reads (
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, profile_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_reads TO anon, authenticated;
GRANT ALL ON public.notification_reads TO service_role;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read notification_reads" ON public.notification_reads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert notification_reads" ON public.notification_reads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update notification_reads" ON public.notification_reads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete notification_reads" ON public.notification_reads FOR DELETE TO anon, authenticated USING (true);
