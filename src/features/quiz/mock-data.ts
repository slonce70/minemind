import type { LocalizedQuestionDefinition } from './types';

export const minecraftCategory = {
  id: 'minecraft',
  roundDurationLabel: '2-4 min',
  roundQuestionCount: 8,
  title: 'Minecraft Battle Quiz',
};

export const leaderboardPreview = [
  { name: 'NovaBuilder', score: 1420 },
  { name: 'PixelFox', score: 1340 },
  { name: 'CraftBee', score: 1285 },
];

export const minecraftQuestionBank: LocalizedQuestionDefinition[] = [
  {
    id: 'crafting-table',
    prompt: {
      uk: 'Який блок найчастіше потрібен, щоб створювати більшість рецептів у Minecraft?',
      en: 'Which block do players usually need to craft most recipes in Minecraft?',
      ru: 'Какой блок чаще всего нужен, чтобы создавать большинство рецептов в Minecraft?',
    },
    options: [
      { uk: 'Піч', en: 'Furnace', ru: 'Печь' },
      { uk: 'Верстак', en: 'Crafting Table', ru: 'Верстак' },
      { uk: 'Ліжко', en: 'Bed', ru: 'Кровать' },
      { uk: 'Скриня', en: 'Chest', ru: 'Сундук' },
    ],
    correctIndex: 1,
    explanation: {
      uk: 'Верстак відкриває сітку 3x3, тому без нього багато важливих рецептів недоступні.',
      en: 'The crafting table unlocks the 3x3 grid, which is needed for many important recipes.',
      ru: 'Верстак открывает сетку 3x3, поэтому без него недоступны многие важные рецепты.',
    },
  },
  {
    id: 'creeper',
    prompt: {
      uk: 'Який моб відомий тим, що тихо підкрадається і вибухає?',
      en: 'Which mob is famous for sneaking up quietly and exploding?',
      ru: 'Какой моб известен тем, что тихо подкрадывается и взрывается?',
    },
    options: [
      { uk: 'Кріпер', en: 'Creeper', ru: 'Крипер' },
      { uk: 'Скелет', en: 'Skeleton', ru: 'Скелет' },
      { uk: 'Ендермен', en: 'Enderman', ru: 'Эндермен' },
      { uk: 'Слайм', en: 'Slime', ru: 'Слайм' },
    ],
    correctIndex: 0,
    explanation: {
      uk: 'Кріпер майже не видає звуків до останньої секунди, тому його легко пропустити.',
      en: 'Creepers stay almost silent until the last second, which makes them extra dangerous.',
      ru: 'Крипер почти не издает звуков до последней секунды, поэтому его легко не заметить.',
    },
  },
  {
    id: 'nether-portal',
    prompt: {
      uk: 'З якого блоку зазвичай будують рамку порталу в Нижній світ?',
      en: 'Which block is usually used to build a Nether portal frame?',
      ru: 'Из какого блока обычно строят рамку портала в Нижний мир?',
    },
    options: [
      { uk: 'Камінь', en: 'Stone', ru: 'Камень' },
      { uk: 'Обсидіан', en: 'Obsidian', ru: 'Обсидиан' },
      { uk: 'Золото', en: 'Gold', ru: 'Золото' },
      { uk: 'Діамантовий блок', en: 'Diamond Block', ru: 'Алмазный блок' },
    ],
    correctIndex: 1,
    explanation: {
      uk: 'Класичний портал до Нижнього світу роблять саме з обсидіану і запалюють вогнем.',
      en: 'The classic Nether portal is made of obsidian and activated with fire.',
      ru: 'Классический портал в Нижний мир делают из обсидиана и активируют огнем.',
    },
  },
  {
    id: 'redstone',
    prompt: {
      uk: 'Для чого в Minecraft найчастіше використовують редстоун?',
      en: 'What is redstone most often used for in Minecraft?',
      ru: 'Для чего редстоун чаще всего используют в Minecraft?',
    },
    options: [
      { uk: 'Для магії', en: 'For magic', ru: 'Для магии' },
      { uk: 'Для механізмів і схем', en: 'For machines and circuits', ru: 'Для механизмов и схем' },
      { uk: 'Для приручення тварин', en: 'To tame animals', ru: 'Для приручения животных' },
      { uk: 'Для фарбування броні', en: 'To dye armor', ru: 'Для покраски брони' },
    ],
    correctIndex: 1,
    explanation: {
      uk: 'Редстоун працює як електрика Minecraft: двері, пастки, ферми, ліфти та інші механізми.',
      en: 'Redstone acts like Minecraft electricity for doors, traps, farms, elevators, and more.',
      ru: 'Редстоун работает как электричество Minecraft: двери, ловушки, фермы, лифты и многое другое.',
    },
  },
  {
    id: 'diamond-pickaxe',
    prompt: {
      uk: 'Який інструмент потрібен, щоб здобути обсидіан у звичайній грі?',
      en: 'Which tool is needed to mine obsidian in normal survival play?',
      ru: 'Какой инструмент нужен, чтобы добыть обсидиан в обычной игре?',
    },
    options: [
      { uk: 'Дерев`яна кирка', en: 'Wooden Pickaxe', ru: 'Деревянная кирка' },
      { uk: 'Кам`яна кирка', en: 'Stone Pickaxe', ru: 'Каменная кирка' },
      { uk: 'Алмазна кирка', en: 'Diamond Pickaxe', ru: 'Алмазная кирка' },
      { uk: 'Ножиці', en: 'Shears', ru: 'Ножницы' },
    ],
    correctIndex: 2,
    explanation: {
      uk: 'Обсидіан ламається дуже довго, і здобути його можна лише міцною киркою високого рівня.',
      en: 'Obsidian takes a long time to mine and needs a high-tier pickaxe to drop as a block.',
      ru: 'Обсидиан ломается очень долго, и для его добычи нужна кирка высокого уровня.',
    },
  },
  {
    id: 'beds',
    prompt: {
      uk: 'Що робить ліжко у звичайному світі Minecraft?',
      en: 'What does a bed do in the normal Minecraft overworld?',
      ru: 'Что делает кровать в обычном мире Minecraft?',
    },
    options: [
      { uk: 'Прискорює копання', en: 'Speeds up mining', ru: 'Ускоряет копание' },
      { uk: 'Пропускає ніч і ставить точку відродження', en: 'Skips the night and sets spawn', ru: 'Пропускает ночь и ставит точку возрождения' },
      { uk: 'Дає броню', en: 'Gives armor', ru: 'Дает броню' },
      { uk: 'Відкриває карту', en: 'Reveals the map', ru: 'Открывает карту' },
    ],
    correctIndex: 1,
    explanation: {
      uk: 'Ліжко допомагає безпечніше пережити ніч і повернутися ближче до своєї бази після поразки.',
      en: 'Beds help you skip danger at night and respawn near your base after defeat.',
      ru: 'Кровать помогает безопаснее пережить ночь и вернуться ближе к базе после поражения.',
    },
  },
  {
    id: 'end-dragon',
    prompt: {
      uk: 'Який бос чекає гравців у Краї?',
      en: 'Which boss waits for players in the End?',
      ru: 'Какой босс ждет игроков в Крае?',
    },
    options: [
      { uk: 'Візер', en: 'Wither', ru: 'Визер' },
      { uk: 'Ендер дракон', en: 'Ender Dragon', ru: 'Эндер дракон' },
      { uk: 'Старший варден', en: 'Elder Warden', ru: 'Старший варден' },
      { uk: 'Привид', en: 'Ghast', ru: 'Гаст' },
    ],
    correctIndex: 1,
    explanation: {
      uk: 'Ендер дракон вважається головним фінальним босом класичного проходження Minecraft.',
      en: 'The Ender Dragon is the main final boss of the classic Minecraft journey.',
      ru: 'Эндер дракон считается главным финальным боссом классического прохождения Minecraft.',
    },
  },
  {
    id: 'villagers',
    prompt: {
      uk: 'Чим корисні селяни для гравця?',
      en: 'Why are villagers useful for players?',
      ru: 'Чем полезны жители для игрока?',
    },
    options: [
      { uk: 'Вони відкривають нові біоми', en: 'They unlock new biomes', ru: 'Они открывают новые биомы' },
      { uk: 'З ними можна торгувати', en: 'You can trade with them', ru: 'С ними можно торговать' },
      { uk: 'Вони дають безкінечне життя', en: 'They grant infinite health', ru: 'Они дают бесконечное здоровье' },
      { uk: 'Вони приручають вовків', en: 'They tame wolves', ru: 'Они приручают волков' },
    ],
    correctIndex: 1,
    explanation: {
      uk: 'Через торгівлю можна отримати корисні книги, інструменти, броню і багато рідкісних ресурсів.',
      en: 'Trading lets players get useful books, tools, armor, and many rare resources.',
      ru: 'Торговля помогает получать полезные книги, инструменты, броню и редкие ресурсы.',
    },
  },
  {
    id: 'water-bucket',
    prompt: {
      uk: 'Який простий предмет часто рятує гравця під час падіння з висоти?',
      en: 'Which simple item often saves a player from a high fall?',
      ru: 'Какой простой предмет часто спасает игрока при падении с высоты?',
    },
    options: [
      { uk: 'Відро води', en: 'Water Bucket', ru: 'Ведро воды' },
      { uk: 'Палиця', en: 'Stick', ru: 'Палка' },
      { uk: 'Пісок', en: 'Sand', ru: 'Песок' },
      { uk: 'Піч', en: 'Furnace', ru: 'Печь' },
    ],
    correctIndex: 0,
    explanation: {
      uk: 'Досвідчені гравці ставлять воду прямо перед землею, щоб скасувати шкоду від падіння.',
      en: 'Experienced players place water just before landing to cancel most fall damage.',
      ru: 'Опытные игроки ставят воду прямо перед приземлением, чтобы отменить урон от падения.',
    },
  },
  {
    id: 'torches',
    prompt: {
      uk: 'Навіщо гравці ставлять смолоскипи у шахтах і на базі?',
      en: 'Why do players place torches in mines and around their base?',
      ru: 'Зачем игроки ставят факелы в шахтах и рядом с базой?',
    },
    options: [
      { uk: 'Щоб блоки літали', en: 'To make blocks float', ru: 'Чтобы блоки летали' },
      { uk: 'Щоб освітити місце і зменшити появу ворожих мобів', en: 'To light the area and reduce hostile mob spawns', ru: 'Чтобы освещать место и уменьшать спавн враждебных мобов' },
      { uk: 'Щоб прискорити плавання', en: 'To swim faster', ru: 'Чтобы быстрее плавать' },
      { uk: 'Щоб приручати котів', en: 'To tame cats', ru: 'Чтобы приручать кошек' },
    ],
    correctIndex: 1,
    explanation: {
      uk: 'Освітлення робить підземелля та базу безпечнішими, бо в темряві вороги з`являються частіше.',
      en: 'Lighting keeps caves and bases safer because hostile mobs spawn much more often in darkness.',
      ru: 'Освещение делает пещеры и базу безопаснее, потому что враги чаще появляются в темноте.',
    },
  },
  {
    id: 'wheat',
    prompt: {
      uk: 'Чим зазвичай приманюють і розводять корів у Minecraft?',
      en: 'What do players usually use to attract and breed cows in Minecraft?',
      ru: 'Чем обычно приманивают и разводят коров в Minecraft?',
    },
    options: [
      { uk: 'Пшениця', en: 'Wheat', ru: 'Пшеница' },
      { uk: 'Вугілля', en: 'Coal', ru: 'Уголь' },
      { uk: 'Скло', en: 'Glass', ru: 'Стекло' },
      { uk: 'Сніг', en: 'Snow', ru: 'Снег' },
    ],
    correctIndex: 0,
    explanation: {
      uk: 'Пшениця допомагає вести корів за собою і створювати стабільну ферму їжі та шкіри.',
      en: 'Wheat lets players lure cows and build a steady farm for food and leather.',
      ru: 'Пшеница помогает вести коров за собой и строить стабильную ферму еды и кожи.',
    },
  },
  {
    id: 'biomes',
    prompt: {
      uk: 'Що таке біом у Minecraft?',
      en: 'What is a biome in Minecraft?',
      ru: 'Что такое биом в Minecraft?',
    },
    options: [
      { uk: 'Рецепт зілля', en: 'A potion recipe', ru: 'Рецепт зелья' },
      { uk: 'Тип місцевості з власною природою та атмосферою', en: 'A type of environment with its own nature and atmosphere', ru: 'Тип местности со своей природой и атмосферой' },
      { uk: 'Назва будь-якого інструмента', en: 'The name of any tool', ru: 'Название любого инструмента' },
      { uk: 'Секретний режим гри', en: 'A secret game mode', ru: 'Секретный режим игры' },
    ],
    correctIndex: 1,
    explanation: {
      uk: 'Біоми визначають пейзаж, блоки, погоду, рослини і мобів, яких ти зустрінеш навколо.',
      en: 'Biomes define the landscape, blocks, weather, plants, and mobs you will encounter nearby.',
      ru: 'Биомы определяют ландшафт, блоки, погоду, растения и мобов, которых ты встретишь вокруг.',
    },
  },
];
