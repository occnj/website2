-- ============================================================
-- About page content becomes admin-managed
--   beliefs         -> "What we believe" (card grid + modal)
--   core_values     -> "What defines us"   (rendered as before)
--   about_hub_cards -> "Get to know us"    (rendered as before)
--
-- All three were hardcoded arrays in app/about/page.js. They are seeded here
-- with exactly that content so nothing changes on deploy, plus the new
-- "Sexuality & Gender" belief. The page keeps the hardcoded copy as a fallback,
-- so if these tables are missing the site still renders.
--
-- Note: "values" is a reserved word in SQL, hence core_values.
-- ============================================================

-- ---------- BELIEFS ----------
create table if not exists beliefs (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  scripture  text default '',
  content    text not null,
  sort_order int  default 0,
  published  boolean default true,
  created_at timestamptz default now()
);

alter table beliefs enable row level security;
drop policy if exists "public read beliefs" on beliefs;
drop policy if exists "staff write beliefs" on beliefs;
create policy "public read beliefs" on beliefs for select using (published);
create policy "staff write beliefs" on beliefs for all    using (my_role() in ('owner','admin','editor'));

insert into beliefs (title, scripture, content, sort_order)
select * from (values
  ('God',
   'Genesis 1:1, 26–27 · Deuteronomy 6:4 · Matthew 28:19',
   'There is only one, true God, eternally existing in three distinct personalities: the Father, the Son, and the Holy Spirit. These three are one God, having the same nature, attributes, and perfections, and are therefore worthy of the same worship and obedience. God is the Creator, Sustainer, and Ruler of the universe.',
   10),
  ('The Holy Spirit',
   'John 14:16–17 · Acts 1:8 · Galatians 5:22–25',
   'The Holy Spirit is coequal with the Father and the Son. He convicts people of sin, regenerates believers, and lives in them to manifest the character of Christ. He provides power for holy living, understanding of spiritual truth, and gives spiritual gifts for service that surpass our own natural abilities.',
   20),
  ('Jesus Christ',
   'John 1:1–5 · Colossians 1:15–20 · 1 Corinthians 15:3–4',
   'Jesus Christ is the Son of God, coequal with the Father. He became a man, born of the virgin Mary, and lived a sinless life. He offered Himself as the perfect sacrifice for the sins of all people, rose bodily from the dead after three days, ascended to heaven, and will return to reign as King of Kings and Lord of Lords.',
   30),
  ('Salvation',
   'John 1:12 · Romans 6:23 · Ephesians 2:8–9',
   'Because people are unable to save themselves, salvation is altogether the work of God — a free gift received by faith in Jesus Christ. Through repentance and faith, we turn from our self-ruled life to trust in Jesus as Lord and Savior. Neither good works nor self-improvement can substitute for this grace.',
   40),
  ('People',
   'Genesis 1:26–27 · Isaiah 53:6 · Romans 3:23',
   'People are created in the image of God and are the supreme object of God’s creation and love. Through willful disobedience, people have fallen from their created state of righteousness and are separated from God — unable to deliver themselves, but fully dependent on the power of God as presented in the Gospel.',
   50),
  ('Eternal Destiny',
   'John 3:16 · Matthew 25:31–46 · Revelation 20:11–15',
   'God created people to exist forever. We will either exist eternally separated from God by sin, or eternally with God through forgiveness and salvation. Heaven and Hell are real places of eternal existence.',
   60),
  ('The Church',
   'Matthew 16:16–18 · Ephesians 1:22–23 · 1 Corinthians 12:12–13',
   'The church is composed of all who have experienced new birth through faith in Christ. The local church is an indispensable part of God’s plan — for worship, prayer, fellowship, teaching, ministry, and world evangelism. We believe in the spiritual unity of all true believers in the Lord Jesus Christ.',
   70),
  ('Marriage',
   'Mark 10:6–9',
   'Oasis Christian Centre believes in the sanctity of marriage between one man and one woman, as established by God at creation. Married people are expected to maintain their marriage vows to each other.',
   80),
  ('Sexuality & Gender',
   'Deuteronomy 23:1 · 1 Corinthians 6:18 · 1 Thessalonians 4:3 · Romans 1:26–27 · Proverbs 5:3–5, 8–13; 7:21–27 · Galatians 5:19 · Exodus 20:14 · Deuteronomy 5:18 · Matthew 5:27; 19:18 · Luke 18:20 · Romans 13:9 · James 2:11 · Leviticus 20:10–21 · 1 Corinthians 10:8; 6:18 · Jude 7',
   'We believe sexuality and the divinely prescribed boundaries for its expression are covered clearly in the Holy Scriptures, which limit sexual expression to the marital relationship of one man with one woman. Homosexual acts, adultery, bestiality, and all forms of fornication are categorically condemned in the Holy Scriptures. We believe that sexuality is assigned by God at conception, male or female, whatever that may be, and the Holy Scriptures does not permit an individual to alter their sexual identity physically or otherwise.',
   90)
) as seed(title, scripture, content, sort_order)
where not exists (select 1 from beliefs);

-- ---------- CORE VALUES ("What defines us") ----------
create table if not exists core_values (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text default '',
  sort_order  int  default 0,
  published   boolean default true,
  created_at  timestamptz default now()
);

alter table core_values enable row level security;
drop policy if exists "public read core_values" on core_values;
drop policy if exists "staff write core_values" on core_values;
create policy "public read core_values" on core_values for select using (published);
create policy "staff write core_values" on core_values for all    using (my_role() in ('owner','admin','editor'));

insert into core_values (title, description, sort_order)
select * from (values
  ('Jesus',      'We will live in the love of Jesus, not from the standards of culture; and in that love, we will influence culture.', 10),
  ('Authenticity','Our leaders and volunteers will be visible, transparent, and approachable.', 20),
  ('Teaching',   'Our teachings will be Bible-based, relatable, and repeatable.', 30),
  ('Growth',     'Healthy things grow, growing things change, and changing things change things. We are committed to growth.', 40),
  ('People',     'We are a church of people with names and feelings, not egos and titles. We are better when connected together.', 50),
  ('Faith',      'We will honor our big God with our big faith and faith-filled prayers in all that we do.', 60),
  ('Serving',    'The local church should impact the world in which we live. We will serve people next to us and far from us.', 70),
  ('Generosity', 'We are a church generous with time, talents, and treasures — ready and resourced to do what God calls us to do.', 80),
  ('Worship',    'We value worship as a lifestyle, so we can welcome and reflect the presence of God in all that we do.', 90),
  ('Work',       'Anything worth doing is worth doing right. We will do everything with integrity, working as a team so no one burns out.', 100)
) as seed(title, description, sort_order)
where not exists (select 1 from core_values);

-- ---------- ABOUT HUB CARDS ("Get to know us") ----------
create table if not exists about_hub_cards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text default '',
  href        text default '',
  sort_order  int  default 0,
  published   boolean default true,
  created_at  timestamptz default now()
);

alter table about_hub_cards enable row level security;
drop policy if exists "public read about_hub_cards" on about_hub_cards;
drop policy if exists "staff write about_hub_cards" on about_hub_cards;
create policy "public read about_hub_cards" on about_hub_cards for select using (published);
create policy "staff write about_hub_cards" on about_hub_cards for all    using (my_role() in ('owner','admin','editor'));

insert into about_hub_cards (title, description, href, sort_order)
select * from (values
  ('Our Values', 'The 10 convictions that shape everything we do at Oasis.',            '#our-values', 10),
  ('Our Beliefs','What we believe about God, Scripture, salvation, and the church.',    '#our-beliefs', 20),
  ('Leadership', 'Meet the pastoral team and ministry leaders who serve Oasis.',        '#leadership', 30),
  ('Ministries', 'From women to youth to missions — see all the ways we serve.',        '#ministries', 40)
) as seed(title, description, href, sort_order)
where not exists (select 1 from about_hub_cards);
