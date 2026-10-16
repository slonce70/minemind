-- One question, many languages. A question row holds the canonical option order and the correct
-- option (answers are checked by that index, never by text); its texts live in
-- question_translations, so players in one room each read the same question in their own language.
--
-- Packs become language-neutral (`minecraft-<difficulty>`, locale null). The old per-locale packs
-- are deactivated by the seed and kept, because answer history references their questions.
alter table public.question_packs
  alter column locale drop not null;

create table if not exists public.question_translations (
  question_id uuid not null references public.questions (id) on delete cascade,
  locale text not null check (locale in ('uk', 'en', 'ru')),
  prompt text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  explanation text not null,
  primary key (question_id, locale)
);

-- Served only through Edge Functions (service role), like the questions themselves.
alter table public.question_translations enable row level security;
revoke all on public.question_translations from anon, authenticated;
