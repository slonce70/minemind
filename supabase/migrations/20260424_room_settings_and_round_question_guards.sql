alter table public.answer_submissions
  add constraint answer_submissions_question_fk
  foreign key (question_id) references public.questions (id) on delete cascade;
