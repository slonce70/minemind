-- Question types beyond four-option multiple choice: true/false (two options), a pixel picture,
-- and a 3×3 crafting grid with a missing item. Pictures and grids reference the app's own sprites.
alter table public.questions
  add column if not exists kind text not null default 'choice'
    check (kind in ('choice', 'true-false', 'picture', 'recipe')),
  add column if not exists media jsonb,
  add column if not exists option_icons text[];

alter table public.questions
  alter column option_c drop not null,
  alter column option_d drop not null;

alter table public.question_translations
  alter column option_c drop not null,
  alter column option_d drop not null;

alter table public.questions
  drop constraint if exists questions_options_match_kind,
  add constraint questions_options_match_kind
    check ((kind = 'true-false') = (option_c is null and option_d is null));

alter table public.questions
  drop constraint if exists questions_correct_option_in_range,
  add constraint questions_correct_option_in_range
    check (correct_option < case when kind = 'true-false' then 2 else 4 end);
