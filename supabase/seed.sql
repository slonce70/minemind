insert into public.quiz_categories (slug, title)
values ('minecraft', 'Minecraft Battle Quiz')
on conflict (slug) do nothing;

delete from public.question_packs
where category_id = (select id from public.quiz_categories where slug = 'minecraft')
  and title in ('Launch Pack - Ukrainian', 'Launch Pack - English', 'Launch Pack - Russian');

insert into public.question_packs (category_id, locale, age_band, difficulty, title)
values (
  (select id from public.quiz_categories where slug = 'minecraft'),
  'uk',
  '8-12',
  'starter',
  'Launch Pack - Ukrainian'
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'Який блок найчастіше потрібен, щоб створювати більшість рецептів у Minecraft?',
  'Піч',
  'Верстак',
  'Ліжко',
  'Скриня',
  1,
  'Верстак відкриває сітку 3x3, тому без нього багато важливих рецептів недоступні.',
  1
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'Який моб відомий тим, що тихо підкрадається і вибухає?',
  'Кріпер',
  'Скелет',
  'Ендермен',
  'Слайм',
  0,
  'Кріпер майже не видає звуків до останньої секунди, тому його легко пропустити.',
  2
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'З якого блоку зазвичай будують рамку порталу в Нижній світ?',
  'Камінь',
  'Обсидіан',
  'Золото',
  'Діамантовий блок',
  1,
  'Класичний портал до Нижнього світу роблять саме з обсидіану і запалюють вогнем.',
  3
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'Для чого в Minecraft найчастіше використовують редстоун?',
  'Для магії',
  'Для механізмів і схем',
  'Для приручення тварин',
  'Для фарбування броні',
  1,
  'Редстоун працює як електрика Minecraft: двері, пастки, ферми, ліфти та інші механізми.',
  4
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'Який інструмент потрібен, щоб здобути обсидіан у звичайній грі?',
  'Дерев`яна кирка',
  'Кам`яна кирка',
  'Алмазна кирка',
  'Ножиці',
  2,
  'Обсидіан ламається дуже довго, і здобути його можна лише міцною киркою високого рівня.',
  5
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'Що робить ліжко у звичайному світі Minecraft?',
  'Прискорює копання',
  'Пропускає ніч і ставить точку відродження',
  'Дає броню',
  'Відкриває карту',
  1,
  'Ліжко допомагає безпечніше пережити ніч і повернутися ближче до своєї бази після поразки.',
  6
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'Який бос чекає гравців у Краї?',
  'Візер',
  'Ендер дракон',
  'Старший варден',
  'Привид',
  1,
  'Ендер дракон вважається головним фінальним босом класичного проходження Minecraft.',
  7
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'Чим корисні селяни для гравця?',
  'Вони відкривають нові біоми',
  'З ними можна торгувати',
  'Вони дають безкінечне життя',
  'Вони приручають вовків',
  1,
  'Через торгівлю можна отримати корисні книги, інструменти, броню і багато рідкісних ресурсів.',
  8
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'Який простий предмет часто рятує гравця під час падіння з висоти?',
  'Відро води',
  'Палиця',
  'Пісок',
  'Піч',
  0,
  'Досвідчені гравці ставлять воду прямо перед землею, щоб скасувати шкоду від падіння.',
  9
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'Навіщо гравці ставлять смолоскипи у шахтах і на базі?',
  'Щоб блоки літали',
  'Щоб освітити місце і зменшити появу ворожих мобів',
  'Щоб прискорити плавання',
  'Щоб приручати котів',
  1,
  'Освітлення робить підземелля та базу безпечнішими, бо в темряві вороги з`являються частіше.',
  10
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'Чим зазвичай приманюють і розводять корів у Minecraft?',
  'Пшениця',
  'Вугілля',
  'Скло',
  'Сніг',
  0,
  'Пшениця допомагає вести корів за собою і створювати стабільну ферму їжі та шкіри.',
  11
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'uk'
      and title = 'Launch Pack - Ukrainian'
    order by created_at desc
    limit 1
  ),
  'Що таке біом у Minecraft?',
  'Рецепт зілля',
  'Тип місцевості з власною природою та атмосферою',
  'Назва будь-якого інструмента',
  'Секретний режим гри',
  1,
  'Біоми визначають пейзаж, блоки, погоду, рослини і мобів, яких ти зустрінеш навколо.',
  12
);

insert into public.question_packs (category_id, locale, age_band, difficulty, title)
values (
  (select id from public.quiz_categories where slug = 'minecraft'),
  'en',
  '8-12',
  'starter',
  'Launch Pack - English'
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'Which block do players usually need to craft most recipes in Minecraft?',
  'Furnace',
  'Crafting Table',
  'Bed',
  'Chest',
  1,
  'The crafting table unlocks the 3x3 grid, which is needed for many important recipes.',
  1
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'Which mob is famous for sneaking up quietly and exploding?',
  'Creeper',
  'Skeleton',
  'Enderman',
  'Slime',
  0,
  'Creepers stay almost silent until the last second, which makes them extra dangerous.',
  2
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'Which block is usually used to build a Nether portal frame?',
  'Stone',
  'Obsidian',
  'Gold',
  'Diamond Block',
  1,
  'The classic Nether portal is made of obsidian and activated with fire.',
  3
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'What is redstone most often used for in Minecraft?',
  'For magic',
  'For machines and circuits',
  'To tame animals',
  'To dye armor',
  1,
  'Redstone acts like Minecraft electricity for doors, traps, farms, elevators, and more.',
  4
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'Which tool is needed to mine obsidian in normal survival play?',
  'Wooden Pickaxe',
  'Stone Pickaxe',
  'Diamond Pickaxe',
  'Shears',
  2,
  'Obsidian takes a long time to mine and needs a high-tier pickaxe to drop as a block.',
  5
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'What does a bed do in the normal Minecraft overworld?',
  'Speeds up mining',
  'Skips the night and sets spawn',
  'Gives armor',
  'Reveals the map',
  1,
  'Beds help you skip danger at night and respawn near your base after defeat.',
  6
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'Which boss waits for players in the End?',
  'Wither',
  'Ender Dragon',
  'Elder Warden',
  'Ghast',
  1,
  'The Ender Dragon is the main final boss of the classic Minecraft journey.',
  7
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'Why are villagers useful for players?',
  'They unlock new biomes',
  'You can trade with them',
  'They grant infinite health',
  'They tame wolves',
  1,
  'Trading lets players get useful books, tools, armor, and many rare resources.',
  8
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'Which simple item often saves a player from a high fall?',
  'Water Bucket',
  'Stick',
  'Sand',
  'Furnace',
  0,
  'Experienced players place water just before landing to cancel most fall damage.',
  9
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'Why do players place torches in mines and around their base?',
  'To make blocks float',
  'To light the area and reduce hostile mob spawns',
  'To swim faster',
  'To tame cats',
  1,
  'Lighting keeps caves and bases safer because hostile mobs spawn much more often in darkness.',
  10
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'What do players usually use to attract and breed cows in Minecraft?',
  'Wheat',
  'Coal',
  'Glass',
  'Snow',
  0,
  'Wheat lets players lure cows and build a steady farm for food and leather.',
  11
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'en'
      and title = 'Launch Pack - English'
    order by created_at desc
    limit 1
  ),
  'What is a biome in Minecraft?',
  'A potion recipe',
  'A type of environment with its own nature and atmosphere',
  'The name of any tool',
  'A secret game mode',
  1,
  'Biomes define the landscape, blocks, weather, plants, and mobs you will encounter nearby.',
  12
);

insert into public.question_packs (category_id, locale, age_band, difficulty, title)
values (
  (select id from public.quiz_categories where slug = 'minecraft'),
  'ru',
  '8-12',
  'starter',
  'Launch Pack - Russian'
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Какой блок чаще всего нужен, чтобы создавать большинство рецептов в Minecraft?',
  'Печь',
  'Верстак',
  'Кровать',
  'Сундук',
  1,
  'Верстак открывает сетку 3x3, поэтому без него недоступны многие важные рецепты.',
  1
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Какой моб известен тем, что тихо подкрадывается и взрывается?',
  'Крипер',
  'Скелет',
  'Эндермен',
  'Слайм',
  0,
  'Крипер почти не издает звуков до последней секунды, поэтому его легко не заметить.',
  2
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Из какого блока обычно строят рамку портала в Нижний мир?',
  'Камень',
  'Обсидиан',
  'Золото',
  'Алмазный блок',
  1,
  'Классический портал в Нижний мир делают из обсидиана и активируют огнем.',
  3
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Для чего редстоун чаще всего используют в Minecraft?',
  'Для магии',
  'Для механизмов и схем',
  'Для приручения животных',
  'Для покраски брони',
  1,
  'Редстоун работает как электричество Minecraft: двери, ловушки, фермы, лифты и многое другое.',
  4
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Какой инструмент нужен, чтобы добыть обсидиан в обычной игре?',
  'Деревянная кирка',
  'Каменная кирка',
  'Алмазная кирка',
  'Ножницы',
  2,
  'Обсидиан ломается очень долго, и для его добычи нужна кирка высокого уровня.',
  5
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Что делает кровать в обычном мире Minecraft?',
  'Ускоряет копание',
  'Пропускает ночь и ставит точку возрождения',
  'Дает броню',
  'Открывает карту',
  1,
  'Кровать помогает безопаснее пережить ночь и вернуться ближе к базе после поражения.',
  6
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Какой босс ждет игроков в Крае?',
  'Визер',
  'Эндер дракон',
  'Старший варден',
  'Гаст',
  1,
  'Эндер дракон считается главным финальным боссом классического прохождения Minecraft.',
  7
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Чем полезны жители для игрока?',
  'Они открывают новые биомы',
  'С ними можно торговать',
  'Они дают бесконечное здоровье',
  'Они приручают волков',
  1,
  'Торговля помогает получать полезные книги, инструменты, броню и редкие ресурсы.',
  8
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Какой простой предмет часто спасает игрока при падении с высоты?',
  'Ведро воды',
  'Палка',
  'Песок',
  'Печь',
  0,
  'Опытные игроки ставят воду прямо перед приземлением, чтобы отменить урон от падения.',
  9
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Зачем игроки ставят факелы в шахтах и рядом с базой?',
  'Чтобы блоки летали',
  'Чтобы освещать место и уменьшать спавн враждебных мобов',
  'Чтобы быстрее плавать',
  'Чтобы приручать кошек',
  1,
  'Освещение делает пещеры и базу безопаснее, потому что враги чаще появляются в темноте.',
  10
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Чем обычно приманивают и разводят коров в Minecraft?',
  'Пшеница',
  'Уголь',
  'Стекло',
  'Снег',
  0,
  'Пшеница помогает вести коров за собой и строить стабильную ферму еды и кожи.',
  11
);

insert into public.questions (pack_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order)
values (
  (
    select id
    from public.question_packs
    where category_id = (select id from public.quiz_categories where slug = 'minecraft')
      and locale = 'ru'
      and title = 'Launch Pack - Russian'
    order by created_at desc
    limit 1
  ),
  'Что такое биом в Minecraft?',
  'Рецепт зелья',
  'Тип местности со своей природой и атмосферой',
  'Название любого инструмента',
  'Секретный режим игры',
  1,
  'Биомы определяют ландшафт, блоки, погоду, растения и мобов, которых ты встретишь вокруг.',
  12
);


