// Privacy policy and terms shown in the app and on the web. Plain strings, no markdown.
// {{email}}, {{developer}} and {{region}} are substituted by the app at render time.
// All three locales keep the same sections in the same order.

export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};
export type LegalDocumentId = 'privacy' | 'terms';

export const legalUpdatedAt = '2026-10-17';

export const legalDocuments: Record<LegalDocumentId, Record<'uk' | 'en' | 'ru', LegalDocument>> = {
  privacy: {
    uk: {
      title: 'Політика конфіденційності',
      updated: 'Оновлено 17 жовтня 2026',
      intro:
        'MineMind — це вікторина для дітей. Ми зробили її так, щоб збирати якомога менше: грати можна без імені, пошти й номера телефону. Якщо ти дитина, прочитай це разом із батьками.',
      sections: [
        {
          heading: 'Хто ми',
          paragraphs: [
            'MineMind створює й підтримує {{developer}}. Ми відповідаємо за дані, описані на цій сторінці.',
            'Написати нам можна на {{email}}.',
          ],
        },
        {
          heading: 'Що ми збираємо',
          paragraphs: [
            'Анонімний акаунт. Під час першого запуску застосунок сам створює для тебе анонімний акаунт. Це випадковий номер без імені й пошти. Він потрібен, щоб зберігати прогрес і тримати твоє місце в кімнатах.',
            'Нік, аватар і мова. Нік або складається з безпечних слів, або ти вводиш його сам, і його перевіряє фільтр. Також ти обираєш піксельний аватар і мову інтерфейсу. Нік і аватар бачать лише гравці в кімнаті, до якої ти приєднався.',
            'Ігрові дані. У кімнатах: участь, готовність, твої відповіді (який варіант обрано і скільки часу лишалося), результати матчу й таблиця лідерів кімнати. Прогрес: досвід, рівень, досягнення, картки, серію днів поспіль, номери питань із помилками й результати останніх відповідей. У соло-раундах для кожної відповіді ми надсилаємо номер питання, чи правильна відповідь і скільки часу вона зайняла. На сервері лишаються тільки підсумки по кожному питанню (частка правильних відповідей і середній час), і вони не пов’язані з жодним гравцем.',
            'Пошта — лише якщо її додасть дорослий. Батьки можуть прив’язати пошту, щоб зберегти прогрес і відновити його на іншому пристрої. На неї приходить посилання для входу. Ми використовуємо пошту тільки для входу й ніколи не надсилаємо розсилок чи реклами.',
            'Скарги на питання. Якщо питання здається неправильним, на нього можна поскаржитися, обравши причину зі списку. Вільного тексту немає. Ми зберігаємо причину, номер питання й номер акаунта.',
            'Технічні записи. Щоб ніхто не зловживав грою, сервер записує номер акаунта й час деяких дій (наприклад, створення кімнат чи надсилання скарг) і обмежує, як часто їх можна робити. Як і будь-який інтернет-сервіс, сервери під час з’єднання отримують IP-адресу пристрою; ми не використовуємо її, щоб дізнатися, хто ти чи де ти.',
            'Звіти про помилки — тільки якщо їх увімкнено. Якщо ми ввімкнемо звіти про помилки, застосунок може надіслати звіт у Sentry, коли щось зламалося: текст помилки, технічний стек викликів і платформу (iOS, Android або веб). У звітах немає імені, пошти чи ніка.',
            'На пристрої. Профіль, налаштування, прогрес і останні матчі зберігаються й на самому пристрої. У режимі класу дані вікторини передаються лише між пристроями в одній локальній мережі (Wi‑Fi), а не через наші сервери. Якщо ти скануєш QR-код, щоб приєднатися, зображення з камери обробляється тільки на пристрої, щоб прочитати код кімнати, і ніде не зберігається й нікуди не надсилається.',
          ],
        },
        {
          heading: 'Чого ми НЕ збираємо',
          paragraphs: [
            'Ми не просимо і не збираємо справжнє ім’я, дату народження, номер телефону, адресу, фото, записи голосу, контакти чи геолокацію.',
            'У грі немає чату й немає способу написати іншим гравцям довільний текст. Немає фото профілю й публічних профілів, тебе ніхто не може знайти пошуком.',
            'Немає реклами й покупок у застосунку. Ми не використовуємо сторонню аналітику чи рекламні трекери і не продаємо й не здаємо в оренду нічиї дані.',
            'Питання вголос читає вбудований синтезатор мовлення твого пристрою. Текст при цьому нам не надсилається.',
          ],
        },
        {
          heading: 'Навіщо нам ці дані',
          paragraphs: [
            'Щоб гра працювала: зберігати прогрес, проводити матчі в кімнатах, рахувати очки й показувати результати.',
            'Щоб гра підлаштовувалася під тебе: розумна складність і «Робота над помилками» беруть до уваги твої останні відповіді.',
            'Щоб покращувати питання: підсумки по кожному питанню допомагають знайти надто складні, надто легкі або помилкові.',
            'Щоб гра була безпечною: фільтрувати ніки й обмежувати, як часто можна робити певні дії.',
            'Ми не використовуємо дані для реклами чи профілювання. З юридичного погляду ми обробляємо дані, бо без них не працює гра, яку ти обрав, а також для безпеки й якості гри (наш законний інтерес). Пошту ми обробляємо, бо дорослий сам вирішив її прив’язати (згода).',
          ],
        },
        {
          heading: 'Де зберігаються дані й хто їх обробляє',
          paragraphs: [
            'Дані зберігаються в Supabase — сервісі, що дає нам базу даних, вхід в акаунт і серверні функції. Сервери розташовані в регіоні {{region}}.',
            'Якщо звіти про помилки ввімкнено, вони надходять у Sentry.',
            'Оновлення застосунку доставляє Expo (EAS). Застосунок завантажує звідти файли оновлень і не надсилає з ними персональних даних.',
            'Ці компанії — наші постачальники послуг і можуть використовувати дані лише для роботи свого сервісу для нас. Усі з’єднання зашифровані (HTTPS). Якщо дані обробляються за межами твоєї країни, ми покладаємося на стандартні гарантії цих постачальників для міжнародної передачі даних.',
          ],
        },
        {
          heading: 'Як довго ми зберігаємо дані',
          paragraphs: [
            'Дані зберігаються, поки існує твій акаунт.',
            'Кімнати закриваються після 2 годин без активності.',
            'Коли ти видаляєш акаунт у налаштуваннях, ми видаляємо з серверів акаунт і всі пов’язані з ним дані: профіль, нік, прогрес, історію кімнат, скарги, технічні записи й прив’язану пошту. Дані на пристрої зникають, коли ти видаляєш акаунт або сам застосунок.',
            'Підсумки по питаннях лишаються, бо в них немає персональних даних і їх неможливо пов’язати з тобою.',
          ],
        },
        {
          heading: 'Діти й батьки',
          paragraphs: [
            'MineMind створено для дітей приблизно 8–12 років. Грати можна, не повідомляючи жодних персональних даних: ім’я, пошта чи дата народження не потрібні.',
            'Деякі дії захищені перевіркою для дорослих — простим арифметичним питанням. Це відкриття посилань поза застосунком, прив’язка пошти, «поділитися», завантаження даних і видалення акаунта.',
            'Пошту прив’язує тільки дорослий: він вводить адресу й підтверджує її з листа.',
            'Батьки можуть подивитися, які дані зберігає застосунок (Налаштування → «Завантажити мої дані»), видалити все (Налаштування → «Видалити акаунт і всі дані») або попросити нас зробити це, написавши на {{email}}.',
            'Ми дотримуємося законів про захист даних дітей, зокрема COPPA у США та GDPR в ЄС і Великій Британії. Якщо ти вважаєш, що дитина передала нам дані, яких ми не мали отримати, напиши нам, і ми їх видалимо.',
          ],
        },
        {
          heading: 'Твої права: як завантажити або видалити дані',
          paragraphs: [
            'Ти або твої батьки можете дізнатися, які дані ми маємо, отримати їхню копію, виправити, видалити їх або заперечити проти їхнього використання.',
            'Копія даних: Налаштування → «Завантажити мої дані». Ти отримаєш файл JSON з усім, що ми зберігаємо про твій акаунт.',
            'Видалення: Налаштування → «Видалити акаунт і всі дані». Скасувати це неможливо.',
            'Якщо застосунку вже немає на пристрої, напиши на {{email}}. Якщо до акаунта прив’язано пошту, пиши з неї, щоб ми знайшли акаунт. Без прив’язаної пошти акаунт анонімний, і ми не можемо визначити, які дані твої.',
            'Також ти можеш поскаржитися до органу із захисту даних у своїй країні.',
          ],
        },
        {
          heading: 'Зміни',
          paragraphs: [
            'Якщо ми змінимо цю політику, то оновимо дату вгорі й покажемо нову версію в застосунку. Про важливі зміни ми попередимо в застосунку заздалегідь.',
          ],
        },
        {
          heading: 'Контакти',
          paragraphs: [
            'Питання, прохання чи хвилювання? Напиши {{developer}} на {{email}}. Ми відповімо якомога швидше, щонайпізніше протягом місяця.',
          ],
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      updated: 'Updated 17 October 2026',
      intro:
        'MineMind is a quiz game for kids. We built it to collect as little as possible: you can play without a name, an email or a phone number. If you are a kid, please read it together with a parent.',
      sections: [
        {
          heading: 'Who we are',
          paragraphs: [
            'MineMind is made and run by {{developer}}. We are responsible for the data described on this page.',
            'You can reach us at {{email}}.',
          ],
        },
        {
          heading: 'What we collect',
          paragraphs: [
            'An anonymous account. When you first open the app, it creates an anonymous account for you automatically. It is a random id with no name or email attached. It lets the app save your progress and keep your place in rooms.',
            'Nickname, avatar and language. Your nickname is either built from safe word lists or typed by you and checked by a filter. You also pick a pixel avatar and the interface language. Other players see your nickname and avatar only inside a room you joined.',
            'Game data. In rooms: that you joined, whether you are ready, your answers (which option you chose and how much time was left), match results and the room leaderboard. Your progress: XP, level, achievements, cards, day streak, the ids of questions you got wrong and your recent answer results. In solo rounds we send, for each answer, the question id, whether it was right and how long it took. The server keeps only totals per question (the share of correct answers and the average time), and these totals are not linked to any player.',
            'Email, only if a parent adds one. A parent can link an email to save progress and restore it on another device. We send a sign-in link to it. We use it only for signing in and never send newsletters or ads.',
            'Question reports. If a question looks wrong, you can report it by choosing a reason from a list. There is no free text. We store the reason, the question id and your account id.',
            'Technical records. To prevent abuse, the server notes your account id and the time of some actions (for example, creating rooms or sending reports) and limits how often they can happen. Like any internet service, our servers receive your device’s IP address when it connects; we do not use it to find out who or where you are.',
            'Error reports, only if switched on. If we turn on error reporting, the app may send a report to Sentry when something breaks: the error message, the technical stack trace and the platform (iOS, Android or web). Reports contain no name, email or nickname.',
            'On your device. Your profile, settings, progress and recent matches are also stored on the device itself. In classroom mode, quiz data travels only between devices on the same local network (Wi‑Fi), not through our servers. If you scan a QR code to join, the camera image is processed on the device only to read the room code and is never saved or sent.',
          ],
        },
        {
          heading: 'What we do NOT collect',
          paragraphs: [
            'We do not ask for or collect real names, birthdays, phone numbers, addresses, photos, voice recordings, contacts or location.',
            'There is no chat and no way to send free text to other players. There are no profile photos and no public profiles, and nobody can search for you.',
            'There are no ads and no in-app purchases. We do not use third-party analytics or ad trackers, and we never sell or rent anyone’s data.',
            'Questions are read aloud by your device’s built-in speech engine. The text is not sent to us.',
          ],
        },
        {
          heading: 'Why we use it',
          paragraphs: [
            'To make the game work: save progress, run room matches, count points and show results.',
            'To fit the game to you: smart difficulty and "Fix your mistakes" use your recent answers.',
            'To improve questions: totals per question help us find questions that are too hard, too easy or wrong.',
            'To keep the game safe: filtering nicknames and limiting how often some actions can happen.',
            'We do not use data for advertising or profiling. Legally, we process data because the game you chose cannot work without it, and for the safety and quality of the game (our legitimate interest). We process an email because a parent chose to link it (consent).',
          ],
        },
        {
          heading: 'Where data is stored and who processes it',
          paragraphs: [
            'Data is stored with Supabase, which provides our database, sign-in and server functions. The servers are located in {{region}}.',
            'If error reporting is on, error reports go to Sentry.',
            'App updates are delivered by Expo (EAS). The app downloads update files from it and sends no personal data with them.',
            'These companies are our service providers and may use data only to run their service for us. All connections are encrypted (HTTPS). If data is processed outside your country, we rely on these providers’ standard safeguards for international transfers.',
          ],
        },
        {
          heading: 'How long we keep it',
          paragraphs: [
            'We keep your data while your account exists.',
            'Rooms close after 2 hours without activity.',
            'When you delete your account in Settings, we delete the account and all data linked to it from our servers: profile, nickname, progress, room history, reports, technical records and the linked email. Data on the device disappears when you delete the account or uninstall the app.',
            'Totals per question stay, because they contain no personal data and cannot be linked back to you.',
          ],
        },
        {
          heading: 'Children and parents',
          paragraphs: [
            'MineMind is made for kids aged about 8 to 12. Kids can play without giving any personal information: no name, email or birthday is needed.',
            'Some actions are behind a parent check, a simple arithmetic question for an adult: opening links outside the app, linking an email, sharing, downloading data and deleting the account.',
            'Only a parent links an email: they type the address and confirm it from the inbox.',
            'Parents can see what data the app holds (Settings → "Download my data"), delete everything (Settings → "Delete account and all data"), or ask us to do it by writing to {{email}}.',
            'We follow children’s privacy laws such as COPPA in the US and the GDPR in the EU and UK. If you think a child gave us personal information we should not have, contact us and we will delete it.',
          ],
        },
        {
          heading: 'Your rights: how to download or delete your data',
          paragraphs: [
            'You or your parent can find out what data we hold, get a copy, correct it, delete it, or object to how we use it.',
            'Get a copy: Settings → "Download my data". You get a JSON file with everything we store about your account.',
            'Delete: Settings → "Delete account and all data". This cannot be undone.',
            'If the app is no longer on your device, write to {{email}}. If an email was linked to the account, write from that address so we can find it. Without a linked email the account is anonymous, and we have no way to tell which data is yours.',
            'You can also complain to the data protection authority in your country.',
          ],
        },
        {
          heading: 'Changes',
          paragraphs: [
            'If we change this policy, we will update the date at the top and show the new version in the app. We will tell you about important changes in the app before they apply.',
          ],
        },
        {
          heading: 'Contact',
          paragraphs: [
            'Questions, requests or worries? Write to {{developer}} at {{email}}. We will answer as soon as we can, within one month at the latest.',
          ],
        },
      ],
    },
    ru: {
      title: 'Политика конфиденциальности',
      updated: 'Обновлено 17 октября 2026',
      intro:
        'MineMind — это викторина для детей. Мы сделали её так, чтобы собирать как можно меньше: играть можно без имени, почты и номера телефона. Если ты ребёнок, прочитай это вместе с родителями.',
      sections: [
        {
          heading: 'Кто мы',
          paragraphs: [
            'MineMind создаёт и поддерживает {{developer}}. Мы отвечаем за данные, описанные на этой странице.',
            'Написать нам можно на {{email}}.',
          ],
        },
        {
          heading: 'Что мы собираем',
          paragraphs: [
            'Анонимный аккаунт. При первом запуске приложение само создаёт для тебя анонимный аккаунт. Это случайный номер без имени и почты. Он нужен, чтобы сохранять прогресс и держать твоё место в комнатах.',
            'Ник, аватар и язык. Ник либо составляется из безопасных слов, либо ты вводишь его сам, и его проверяет фильтр. Ещё ты выбираешь пиксельный аватар и язык интерфейса. Ник и аватар видят только игроки в комнате, к которой ты присоединился.',
            'Игровые данные. В комнатах: участие, готовность, твои ответы (какой вариант выбран и сколько времени оставалось), результаты матча и таблица лидеров комнаты. Прогресс: опыт, уровень, достижения, карточки, серию дней подряд, номера вопросов с ошибками и результаты последних ответов. В соло-раундах для каждого ответа мы отправляем номер вопроса, верный ли ответ и сколько времени он занял. На сервере остаются только итоги по каждому вопросу (доля верных ответов и среднее время), и они не связаны ни с одним игроком.',
            'Почта — только если её добавит взрослый. Родители могут привязать почту, чтобы сохранить прогресс и восстановить его на другом устройстве. На неё приходит ссылка для входа. Мы используем почту только для входа и никогда не отправляем рассылок или рекламы.',
            'Жалобы на вопросы. Если вопрос кажется неправильным, на него можно пожаловаться, выбрав причину из списка. Свободного текста нет. Мы храним причину, номер вопроса и номер аккаунта.',
            'Технические записи. Чтобы никто не злоупотреблял игрой, сервер записывает номер аккаунта и время некоторых действий (например, создания комнат или отправки жалоб) и ограничивает, как часто их можно делать. Как и любой интернет-сервис, серверы при соединении получают IP-адрес устройства; мы не используем его, чтобы узнать, кто ты или где ты.',
            'Отчёты об ошибках — только если они включены. Если мы включим отчёты об ошибках, приложение может отправить отчёт в Sentry, когда что-то сломалось: текст ошибки, технический стек вызовов и платформу (iOS, Android или веб). В отчётах нет имени, почты или ника.',
            'На устройстве. Профиль, настройки, прогресс и последние матчи хранятся и на самом устройстве. В режиме класса данные викторины передаются только между устройствами в одной локальной сети (Wi‑Fi), а не через наши серверы. Если ты сканируешь QR-код, чтобы присоединиться, изображение с камеры обрабатывается только на устройстве, чтобы прочитать код комнаты, и нигде не сохраняется и никуда не отправляется.',
          ],
        },
        {
          heading: 'Чего мы НЕ собираем',
          paragraphs: [
            'Мы не просим и не собираем настоящее имя, дату рождения, номер телефона, адрес, фото, записи голоса, контакты или геолокацию.',
            'В игре нет чата и нет способа написать другим игрокам произвольный текст. Нет фото профиля и публичных профилей, тебя никто не может найти поиском.',
            'Нет рекламы и покупок в приложении. Мы не используем стороннюю аналитику или рекламные трекеры и не продаём и не сдаём в аренду ничьи данные.',
            'Вопросы вслух читает встроенный синтезатор речи твоего устройства. Текст при этом нам не отправляется.',
          ],
        },
        {
          heading: 'Зачем нам эти данные',
          paragraphs: [
            'Чтобы игра работала: сохранять прогресс, проводить матчи в комнатах, считать очки и показывать результаты.',
            'Чтобы игра подстраивалась под тебя: умная сложность и «Работа над ошибками» учитывают твои последние ответы.',
            'Чтобы улучшать вопросы: итоги по каждому вопросу помогают найти слишком сложные, слишком лёгкие или ошибочные.',
            'Чтобы игра была безопасной: фильтровать ники и ограничивать, как часто можно делать некоторые действия.',
            'Мы не используем данные для рекламы или профилирования. С юридической точки зрения мы обрабатываем данные, потому что без них не работает игра, которую ты выбрал, а также для безопасности и качества игры (наш законный интерес). Почту мы обрабатываем, потому что взрослый сам решил её привязать (согласие).',
          ],
        },
        {
          heading: 'Где хранятся данные и кто их обрабатывает',
          paragraphs: [
            'Данные хранятся в Supabase — сервисе, который даёт нам базу данных, вход в аккаунт и серверные функции. Серверы находятся в регионе {{region}}.',
            'Если отчёты об ошибках включены, они поступают в Sentry.',
            'Обновления приложения доставляет Expo (EAS). Приложение скачивает оттуда файлы обновлений и не отправляет с ними персональных данных.',
            'Эти компании — наши поставщики услуг и могут использовать данные только для работы своего сервиса для нас. Все соединения зашифрованы (HTTPS). Если данные обрабатываются за пределами твоей страны, мы полагаемся на стандартные гарантии этих поставщиков для международной передачи данных.',
          ],
        },
        {
          heading: 'Как долго мы храним данные',
          paragraphs: [
            'Данные хранятся, пока существует твой аккаунт.',
            'Комнаты закрываются после 2 часов без активности.',
            'Когда ты удаляешь аккаунт в настройках, мы удаляем с серверов аккаунт и все связанные с ним данные: профиль, ник, прогресс, историю комнат, жалобы, технические записи и привязанную почту. Данные на устройстве исчезают, когда ты удаляешь аккаунт или само приложение.',
            'Итоги по вопросам остаются, потому что в них нет персональных данных и их невозможно связать с тобой.',
          ],
        },
        {
          heading: 'Дети и родители',
          paragraphs: [
            'MineMind создан для детей примерно 8–12 лет. Играть можно, не сообщая никаких персональных данных: имя, почта или дата рождения не нужны.',
            'Некоторые действия защищены проверкой для взрослых — простым арифметическим вопросом. Это открытие ссылок вне приложения, привязка почты, «поделиться», скачивание данных и удаление аккаунта.',
            'Почту привязывает только взрослый: он вводит адрес и подтверждает его из письма.',
            'Родители могут посмотреть, какие данные хранит приложение (Настройки → «Скачать мои данные»), удалить всё (Настройки → «Удалить аккаунт и все данные») или попросить нас сделать это, написав на {{email}}.',
            'Мы соблюдаем законы о защите данных детей, в том числе COPPA в США и GDPR в ЕС и Великобритании. Если ты считаешь, что ребёнок передал нам данные, которых мы не должны были получить, напиши нам, и мы их удалим.',
          ],
        },
        {
          heading: 'Твои права: как скачать или удалить данные',
          paragraphs: [
            'Ты или твои родители можете узнать, какие данные у нас есть, получить их копию, исправить, удалить их или возразить против их использования.',
            'Копия данных: Настройки → «Скачать мои данные». Ты получишь файл JSON со всем, что мы храним о твоём аккаунте.',
            'Удаление: Настройки → «Удалить аккаунт и все данные». Отменить это нельзя.',
            'Если приложения уже нет на устройстве, напиши на {{email}}. Если к аккаунту привязана почта, пиши с неё, чтобы мы нашли аккаунт. Без привязанной почты аккаунт анонимный, и мы не можем определить, какие данные твои.',
            'Также ты можешь пожаловаться в орган по защите данных в своей стране.',
          ],
        },
        {
          heading: 'Изменения',
          paragraphs: [
            'Если мы изменим эту политику, то обновим дату вверху и покажем новую версию в приложении. О важных изменениях мы предупредим в приложении заранее.',
          ],
        },
        {
          heading: 'Контакты',
          paragraphs: [
            'Вопросы, просьбы или беспокойства? Напиши {{developer}} на {{email}}. Мы ответим как можно быстрее, не позже чем через месяц.',
          ],
        },
      ],
    },
  },
  terms: {
    uk: {
      title: 'Умови користування',
      updated: 'Оновлено 17 жовтня 2026',
      intro:
        'Це правила користування MineMind. Вони короткі й написані простими словами. Якщо ти дитина, прочитай їх разом із батьками. Користуючись застосунком, ти погоджуєшся з ними. Як ми поводимося з даними, пояснено в Політиці конфіденційності.',
      sections: [
        {
          heading: 'Що таке MineMind',
          paragraphs: [
            'MineMind — безкоштовна вікторина про гру з будуванням із блоків. Можна грати соло-раунди, змагатися з друзями в приватних кімнатах, грати всім класом на великому екрані або через локальну мережу, збирати картки й отримувати досягнення.',
          ],
        },
        {
          heading: 'Неофіційний фан-застосунок',
          paragraphs: [
            "Неофіційна фан-вікторина, не пов'язана з Mojang і Microsoft. Minecraft — торговельна марка Mojang Synergies AB.",
            'Назву гри ми згадуємо лише для того, щоб пояснити, про що вікторина. Усю графіку, маскота Кубика, звуки й музику в MineMind створено саме для цього застосунку. Застосунок і його вміст належать {{developer}}. Ним можна користуватися вдома й у класі, але не копіювати й не продавати його вміст.',
          ],
        },
        {
          heading: 'Хто може грати',
          paragraphs: [
            'MineMind створено для дітей приблизно 8–12 років. Діти користуються ним з дозволу батьків або опікунів.',
            'Прив’язувати пошту й видаляти акаунт має дорослий. Учителі можуть використовувати великий екран і режим класу на уроках.',
          ],
        },
        {
          heading: 'Чесна гра',
          paragraphs: [
            'Будь доброзичливим. Не обирай ніків, які ображають інших або розкривають особисте: справжнє повне ім’я, школу чи адресу.',
            'Не жульнич: жодних ботів, скриптів, зламу застосунку чи серверів і спроб обійти обмеження.',
            'Ділися кодами кімнат і посиланнями на виклик лише з тими, кого знаєш.',
            'Якщо хтось порушує ці правила, ми можемо змінити нік, закрити кімнату або заблокувати акаунт.',
          ],
        },
        {
          heading: 'Точність питань',
          paragraphs: [
            'Ми стараємося, щоб кожне питання було правильним, але помилки трапляються, а сама гра змінюється з оновленнями.',
            'Якщо бачиш неправильне питання, натисни кнопку скарги й обери причину. Ми переглядаємо скарги й виправляємо питання.',
            'MineMind — це гра для розваги й навчання, а не офіційний довідник.',
          ],
        },
        {
          heading: 'Безкоштовно, але може змінюватися',
          paragraphs: [
            'MineMind безкоштовний. У ньому немає реклами й покупок.',
            'Ми можемо додавати, змінювати чи прибирати функції й питання, а також призупинити або припинити роботу сервісу. Онлайн-функціям (кімнатам, хмарному збереженню) потрібні інтернет і наші сервери, тож іноді вони можуть бути недоступні.',
            'Досвід, рівні, картки й досягнення не мають грошової вартості, їх не можна продати чи обміняти.',
          ],
        },
        {
          heading: 'Видалення акаунта',
          paragraphs: [
            'Акаунт створюється автоматично й анонімно. Видалити його можна будь-коли: Налаштування → «Видалити акаунт і всі дані» (з перевіркою для дорослих). Це прибирає прогрес із наших серверів, і скасувати це неможливо.',
            'Ми можемо видалити акаунт, який порушує ці правила.',
          ],
        },
        {
          heading: 'Обмеження відповідальності',
          paragraphs: [
            'Ми надаємо MineMind «як є». Ми робимо все можливе, але не можемо обіцяти, що застосунок завжди працюватиме без збоїв або що прогрес ніколи не загубиться.',
            'У межах, дозволених законом, ми не відповідаємо за непрямі втрати від користування застосунком, наприклад утрачений прогрес чи час. Ніщо в цих умовах не обмежує прав, які ти маєш за законами про захист споживачів своєї країни.',
          ],
        },
        {
          heading: 'Контакти',
          paragraphs: [
            'Якщо ми змінимо ці умови, то оновимо дату вгорі й покажемо нову версію в застосунку.',
            'Питання? Напиши {{developer}} на {{email}}.',
          ],
        },
      ],
    },
    en: {
      title: 'Terms of Use',
      updated: 'Updated 17 October 2026',
      intro:
        'These are the rules for using MineMind. They are short and written in plain words. If you are a kid, please read them with a parent. By using the app you agree to them. How we handle data is explained in the Privacy Policy.',
      sections: [
        {
          heading: 'What MineMind is',
          paragraphs: [
            'MineMind is a free quiz game about a block-building game. You can play solo rounds, compete with friends in private rooms, play as a class on a big screen or over the local network, collect cards and earn achievements.',
          ],
        },
        {
          heading: 'An unofficial fan app',
          paragraphs: [
            'Unofficial fan quiz, not affiliated with Mojang or Microsoft. Minecraft is a trademark of Mojang Synergies AB.',
            'We mention the game’s name only to explain what the quiz is about. All pictures, the Kubik mascot, sounds and music in MineMind were made for this app. The app and its content belong to {{developer}}. You may use it at home and in class, but please do not copy or sell its content.',
          ],
        },
        {
          heading: 'Who can play',
          paragraphs: [
            'MineMind is made for kids aged about 8 to 12. Kids use it with the permission of a parent or guardian.',
            'Linking an email and deleting the account should be done by an adult. Teachers can use the big screen and classroom modes in lessons.',
          ],
        },
        {
          heading: 'Play fair',
          paragraphs: [
            'Be kind. Do not pick nicknames that are mean to others or that reveal personal things like your real full name, school or address.',
            'Do not cheat: no bots, scripts, hacking the app or the servers, or trying to get around limits.',
            'Share room codes and challenge links only with people you know.',
            'If someone breaks these rules, we may change a nickname, close a room or block an account.',
          ],
        },
        {
          heading: 'How accurate the questions are',
          paragraphs: [
            'We work hard to get every question right, but mistakes happen, and the game itself changes with updates.',
            'If you see a wrong question, press the report button and choose a reason. We review reports and fix questions.',
            'MineMind is a game for fun and learning, not an official guide.',
          ],
        },
        {
          heading: 'Free, but it may change',
          paragraphs: [
            'MineMind is free. It has no ads and no purchases.',
            'We may add, change or remove features and questions, and we may pause or stop the service. Online features (rooms, cloud save) need the internet and our servers, so sometimes they may be unavailable.',
            'XP, levels, cards and achievements have no money value and cannot be sold or traded.',
          ],
        },
        {
          heading: 'Deleting your account',
          paragraphs: [
            'Your account is created automatically and is anonymous. You can delete it at any time: Settings → "Delete account and all data" (with a parent check). This removes your progress from our servers and cannot be undone.',
            'We may delete accounts that break these rules.',
          ],
        },
        {
          heading: 'Limits of our responsibility',
          paragraphs: [
            'We provide MineMind "as is". We do our best, but we cannot promise that the app will always work without problems or that progress will never be lost.',
            'As far as the law allows, we are not responsible for indirect losses from using the app, such as lost progress or time. Nothing in these terms limits the rights you have under the consumer laws of your country.',
          ],
        },
        {
          heading: 'Contact',
          paragraphs: [
            'If we change these terms, we will update the date at the top and show the new version in the app.',
            'Questions? Write to {{developer}} at {{email}}.',
          ],
        },
      ],
    },
    ru: {
      title: 'Условия использования',
      updated: 'Обновлено 17 октября 2026',
      intro:
        'Это правила использования MineMind. Они короткие и написаны простыми словами. Если ты ребёнок, прочитай их вместе с родителями. Пользуясь приложением, ты соглашаешься с ними. Как мы обращаемся с данными, объяснено в Политике конфиденциальности.',
      sections: [
        {
          heading: 'Что такое MineMind',
          paragraphs: [
            'MineMind — бесплатная викторина об игре про строительство из блоков. Можно играть соло-раунды, соревноваться с друзьями в приватных комнатах, играть всем классом на большом экране или через локальную сеть, собирать карточки и получать достижения.',
          ],
        },
        {
          heading: 'Неофициальное фан-приложение',
          paragraphs: [
            'Неофициальная фан-викторина, не связана с Mojang и Microsoft. Minecraft — товарный знак Mojang Synergies AB.',
            'Название игры мы упоминаем только для того, чтобы объяснить, о чём викторина. Вся графика, маскот Кубик, звуки и музыка в MineMind созданы специально для этого приложения. Приложение и его содержимое принадлежат {{developer}}. Им можно пользоваться дома и в классе, но не копировать и не продавать его содержимое.',
          ],
        },
        {
          heading: 'Кто может играть',
          paragraphs: [
            'MineMind создан для детей примерно 8–12 лет. Дети пользуются им с разрешения родителей или опекунов.',
            'Привязывать почту и удалять аккаунт должен взрослый. Учителя могут использовать большой экран и режим класса на уроках.',
          ],
        },
        {
          heading: 'Честная игра',
          paragraphs: [
            'Будь дружелюбным. Не выбирай ники, которые обижают других или раскрывают личное: настоящее полное имя, школу или адрес.',
            'Не жульничай: никаких ботов, скриптов, взлома приложения или серверов и попыток обойти ограничения.',
            'Делись кодами комнат и ссылками на вызов только с теми, кого знаешь.',
            'Если кто-то нарушает эти правила, мы можем изменить ник, закрыть комнату или заблокировать аккаунт.',
          ],
        },
        {
          heading: 'Точность вопросов',
          paragraphs: [
            'Мы стараемся, чтобы каждый вопрос был правильным, но ошибки случаются, а сама игра меняется с обновлениями.',
            'Если видишь неправильный вопрос, нажми кнопку жалобы и выбери причину. Мы просматриваем жалобы и исправляем вопросы.',
            'MineMind — это игра для развлечения и учёбы, а не официальный справочник.',
          ],
        },
        {
          heading: 'Бесплатно, но может меняться',
          paragraphs: [
            'MineMind бесплатный. В нём нет рекламы и покупок.',
            'Мы можем добавлять, менять или убирать функции и вопросы, а также приостановить или прекратить работу сервиса. Онлайн-функциям (комнатам, облачному сохранению) нужны интернет и наши серверы, поэтому иногда они могут быть недоступны.',
            'Опыт, уровни, карточки и достижения не имеют денежной стоимости, их нельзя продать или обменять.',
          ],
        },
        {
          heading: 'Удаление аккаунта',
          paragraphs: [
            'Аккаунт создаётся автоматически и анонимно. Удалить его можно в любой момент: Настройки → «Удалить аккаунт и все данные» (с проверкой для взрослых). Это убирает прогресс с наших серверов, и отменить это нельзя.',
            'Мы можем удалить аккаунт, который нарушает эти правила.',
          ],
        },
        {
          heading: 'Ограничение ответственности',
          paragraphs: [
            'Мы предоставляем MineMind «как есть». Мы делаем всё возможное, но не можем обещать, что приложение всегда будет работать без сбоев или что прогресс никогда не потеряется.',
            'В пределах, разрешённых законом, мы не отвечаем за косвенные потери от использования приложения, например потерянный прогресс или время. Ничто в этих условиях не ограничивает прав, которые у тебя есть по законам о защите потребителей твоей страны.',
          ],
        },
        {
          heading: 'Контакты',
          paragraphs: [
            'Если мы изменим эти условия, то обновим дату вверху и покажем новую версию в приложении.',
            'Вопросы? Напиши {{developer}} на {{email}}.',
          ],
        },
      ],
    },
  },
};
