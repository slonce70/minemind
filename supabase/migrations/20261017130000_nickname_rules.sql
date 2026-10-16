-- Nickname check in step with supabase/functions/_shared/nickname-rules.ts: reserved words are
-- blocked only as whole words (so "Modern" or "Essex" pass), profanity roots anywhere in a word.
create or replace function public.nickname_is_allowed(candidate text)
returns boolean
language plpgsql
immutable
as $$
declare
  normalized text;
  variant text;
  words text[];
  pieces text[];
  piece text;
  reserved constant text[] := array[
    'admin', 'administrator', 'hitler', 'minemind', 'mod', 'moderator', 'mojang', 'microsoft',
    'nazi', 'official', 'owner', 'sex', 'sexy', 'staff', 'support'
  ];
  roots constant text[] := array[
    'bitch', 'cunt', 'fuck', 'nigga', 'nigger', 'porn', 'shit', 'whore', 'бляд', 'блять', 'гандон',
    'ебать', 'залуп', 'курва', 'мудак', 'пидор', 'пизд', 'підор', 'сука', 'хуй', 'шлюх'
  ];
begin
  if candidate is null then
    return false;
  end if;

  normalized := trim(regexp_replace(candidate, '\s+', ' ', 'g'));

  if char_length(normalized) < 2 or char_length(normalized) > 16 then
    return false;
  end if;

  if normalized !~ '^[0-9A-Za-zА-Яа-яЁёЇїІіЄєҐґ_ -]+$' then
    return false;
  end if;

  -- As typed, and with digits read as letters (sh1t, 4dm1n).
  foreach variant in array array[normalized, translate(normalized, '013457', 'oieast')] loop
    words := array_remove(
      regexp_split_to_array(
        lower(regexp_replace(variant, '([a-zа-яёіїєґ])([A-ZА-ЯЁІЇЄҐ])', '\1 \2', 'g')),
        '[^a-zа-яёіїєґ]+'
      ),
      ''
    );

    if words && reserved then
      return false;
    end if;

    pieces := words;

    if not exists (select 1 from unnest(words) as word where char_length(word) > 2) then
      pieces := pieces || array_to_string(words, '');
    end if;

    foreach piece in array pieces loop
      if exists (select 1 from unnest(roots) as root where position(root in piece) > 0) then
        return false;
      end if;
    end loop;
  end loop;

  return true;
end;
$$;
