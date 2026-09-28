CREATE TABLE public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT ON public.feedbacks TO anon;
GRANT SELECT, INSERT ON public.feedbacks TO authenticated;
GRANT ALL ON public.feedbacks TO service_role;

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedbacks" ON public.feedbacks FOR SELECT USING (true);
CREATE POLICY "Anyone can submit feedback" ON public.feedbacks FOR INSERT WITH CHECK (true);