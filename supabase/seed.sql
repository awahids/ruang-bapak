-- Ruang Bapak: demo data (seeder).
--
-- Fills the database with the same sample content the app shows in demo mode:
-- 22 demo bapak, their posts in every room, comment threads, "aman" reactions,
-- follows, Paguyuban group members and posts, and a few direct messages.
-- Notifications are created by the database triggers along the way.
--
-- How to run:
--   * Supabase CLI: runs automatically on `supabase db reset` (local only).
--   * Hosted project: paste this whole file into the SQL Editor and click Run.
--
-- Safe to run again: it first removes the previous demo accounts (and with
-- them every post, comment, like, follow and message they made), then
-- recreates everything with fresh timestamps. Real accounts are never touched,
-- but likes or comments real users left on demo posts are removed with them.
--
-- Demo accounts use addresses under @demo.ruangbapak.invalid and have no
-- password, so nobody can sign in as them. To remove all demo data:
--   delete from auth.users where email like '%@demo.ruangbapak.invalid';

begin;

-- ---------------------------------------------------------------------------
-- Demo accounts
-- ---------------------------------------------------------------------------
create temp table seed_users (
  key text primary key,
  id uuid not null unique,
  display_name text not null,
  avatar_color text not null,
  verified boolean not null default false,
  bio text not null default '',
  location text not null default ''
);

insert into seed_users (key, id, display_name, avatar_color, verified, bio, location) values
  ('dua_jagoan',         '5eed0000-0000-4000-8000-000000000001', 'Bapak Dua Jagoan',      'hsl(95 22% 38%)',  false, 'Ayah dua jagoan SD. Hobi oprek motor tiap Minggu pagi.', 'Jakarta Selatan'),
  ('ayahanda_petualang', '5eed0000-0000-4000-8000-000000000002', 'Ayahanda Petualang',    'hsl(28 33% 41%)',  true,  'Kopi hitam, naik gunung, dan cerita sebelum tidur.', 'Bandung'),
  ('papanya_zahra',      '5eed0000-0000-4000-8000-000000000003', 'Papanya Zahra',         'hsl(210 22% 45%)', true,  'Baru setahun jadi ayah. Masih banyak belajar.', 'Depok'),
  ('penjaga_gawang',     '5eed0000-0000-4000-8000-000000000004', 'Bapak Penjaga Gawang',  'hsl(22 56% 50%)',  false, 'Kiper futsal kantor, penjaga gawang keluarga.', 'Bekasi'),
  ('bapak_sabar',        '5eed0000-0000-4000-8000-000000000005', 'Bapak Sabar',           'hsl(95 20% 34%)',  false, 'Lagi latihan sabar, satu tarikan napas setiap kali.', 'Bogor'),
  ('ayah_muda29',        '5eed0000-0000-4000-8000-000000000006', 'Ayah Muda 29',          'hsl(24 44% 44%)',  false, 'Ayah muda, cicilan juga muda.', 'Tangerang'),
  ('bapak_introvert',    '5eed0000-0000-4000-8000-000000000007', 'Bapak Introvert',       'hsl(210 22% 45%)', false, 'Isi ulang energi dengan diam 15 menit.', 'Yogyakarta'),
  ('bapak_tangguh',      '5eed0000-0000-4000-8000-000000000008', 'Bapak Tangguh',         'hsl(26 40% 42%)',  true,  'Suka diskusi soal peran ayah di rumah.', 'Surabaya'),
  ('ayah_naya',          '5eed0000-0000-4000-8000-000000000009', 'Ayah dari Naya',        'hsl(210 25% 44%)', false, 'Kerja kantoran, pulang jadi kuda-kudaan.', 'Semarang'),
  ('dua_shift',          '5eed0000-0000-4000-8000-00000000000a', 'Bapak Dua Shift',       'hsl(98 22% 36%)',  false, 'Shift pabrik pagi, shift ayah malam.', 'Cikarang'),
  ('bapak_siaga',        '5eed0000-0000-4000-8000-00000000000b', 'Bapak Siaga',           'hsl(95 22% 38%)',  false, 'Siaga di rumah, siaga di pos ronda.', 'Malang'),
  ('ayah_nafisa',        '5eed0000-0000-4000-8000-00000000000c', 'Ayah dari Nafisa',      'hsl(28 33% 41%)',  false, 'Belajar jujur soal kondisi diri.', 'Solo'),
  ('ayah_pagi',          '5eed0000-0000-4000-8000-00000000000d', 'Komunitas Ayah Pagi',   'hsl(100 20% 34%)', true,  'Ngopi pagi bareng tiap Sabtu. Semua bapak boleh gabung.', 'Jakarta Selatan'),
  ('bapak_productive',   '5eed0000-0000-4000-8000-00000000000e', 'Bapak Productive',      'hsl(26 42% 44%)',  false, 'Spreadsheet keuangan keluarga adalah koentji.', 'Jakarta Pusat'),
  ('ayah_belajar',       '5eed0000-0000-4000-8000-00000000000f', 'Ayah Belajar',          'hsl(211 24% 45%)', false, 'Penggiat kelas parenting online.', 'Medan'),
  ('ari_pratama',        '5eed0000-0000-4000-8000-000000000010', 'Ari Pratama',           'hsl(28 33% 41%)',  true,  'Ayah satu anak. Lagi konsisten quality time tanpa gadget.', 'Jakarta Timur'),
  ('bapak_otomotif',     '5eed0000-0000-4000-8000-000000000011', 'Bapak Otomotif',        'hsl(95 20% 34%)',  false, 'Tanya soal mesin? Boleh, asal jangan tanya kapan lunas.', 'Jakarta Selatan'),
  ('ayah_siaga',         '5eed0000-0000-4000-8000-000000000012', 'Ayah Siaga',            'hsl(210 22% 45%)', false, 'Selalu booking duluan biar nggak antre.', 'Tangerang Selatan'),
  ('bapak_belajar',      '5eed0000-0000-4000-8000-000000000013', 'Bapak Belajar',         'hsl(28 33% 41%)',  false, 'Rapat keluarga tiap Minggu malam, 15 menit saja.', 'Bandung'),
  ('satu_frekuensi',     '5eed0000-0000-4000-8000-000000000014', 'Bapak Satu Frekuensi',  'hsl(100 20% 34%)', false, 'Pendengar setia cerita bapak-bapak.', 'Makassar'),
  ('ayah_pendengar',     '5eed0000-0000-4000-8000-000000000015', 'Ayah Pendengar',        'hsl(210 22% 45%)', false, 'Lebih banyak mendengar, sedikit menasihati.', 'Denpasar'),
  ('moderator_rb',       '5eed0000-0000-4000-8000-000000000016', 'Moderator Ruang Bapak', 'hsl(96 20% 34%)',  true,  'Menjaga ruang tetap hangat dan aman untuk semua bapak.', 'Indonesia');

-- Remove the previous demo run. Cascades to profiles and everything they made.
delete from auth.users
where id in (select id from seed_users)
   or email like '%@demo.ruangbapak.invalid';

-- No password, so the accounts cannot be signed into. handle_new_user() makes
-- each profile, taking the username from the address and the bio from "joke".
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  u.key || '@demo.ruangbapak.invalid', '', now() - interval '30 days',
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object('display_name', u.display_name, 'joke', u.bio),
  now() - interval '30 days', now() - interval '30 days',
  '', '', '', '', '', '', '', ''
from seed_users u;

update public.profiles p
set avatar_color = u.avatar_color, verified = u.verified, location = u.location
from seed_users u
where p.id = u.id;

-- ---------------------------------------------------------------------------
-- Posts in every room. `likes` becomes that many "aman" reactions.
-- ---------------------------------------------------------------------------
create temp table seed_posts (
  key text primary key,
  author text not null references seed_users (key),
  category text not null,
  tag text not null,
  tone text not null,
  body text not null,
  anonymous boolean not null default false,
  age interval not null,
  likes int not null
);

insert into seed_posts (key, author, category, tag, tone, body, anonymous, age, likes) values
  -- Teras Bapak (beranda)
  ('p101', 'dua_jagoan', 'status', 'Tugas Negara', 'clay', 'Baru kelar ''tugas negara'' di kantor. Niat hati mau langsung selonjoran, tapi teringat oli mobil belum diganti. Ada yang punya bengkel langganan yang buka sampai malam Pak?', false, '45 minutes', 14),
  ('p102', 'ayahanda_petualang', 'status', 'Ngopi Dulu', 'sage', 'Capek fisik mah biasa, Pak. Yang penting pikiran tetap adem. Lagi ngopi item tanpa gula biar semangat lanjut dengerin cerita anak-anak soal sekolahnya tadi. Mari ngopi, Pak!', false, '2 hours', 19),
  ('p103', 'papanya_zahra', 'status', 'Overthinking', 'plum', 'Lagi duduk di teras sambil liatin langit. Overthinking soal pendidikan anak nanti. Padahal anaknya baru bisa jalan. Memang naluri bapak ya begini?', false, '5 hours', 11),
  ('p104', 'penjaga_gawang', 'diskusi', 'Ekspektasi Mertua', 'blue', 'Gimana cara ngadepin pertanyaan mertua soal ''kapan punya rumah sendiri'' tanpa harus baper? Saya sudah usaha maksimal tapi memang rezekinya bertahap. Share jurusnya, Pak.', false, '8 hours', 10),
  -- Uneg-uneg (curhat)
  ('p201', 'bapak_sabar', 'curhat', 'Kesehatan Mental', 'sage', 'Belakangan gampang marah karena capek. Saya tidak mau energi itu kebawa ke rumah. Lagi latihan tarik napas 4-7-8 sebelum ketemu anak.', false, '23 minutes', 7),
  ('p202', 'ayah_muda29', 'curhat', 'Keuangan', 'clay', 'Nafkah dan cicilan lagi ketat. Saya butuh pola budgeting mingguan yang realistis untuk keluarga kecil.', false, '1 hour', 8),
  ('p203', 'bapak_introvert', 'curhat', 'Capek Jadi Ayah', 'sage', 'Pulang kerja rasanya ingin diam dulu, tapi anak ingin bermain. Lagi belajar transisi 15 menit supaya tetap hadir sebagai ayah.', true, '4 hours', 13),
  -- Diskusi
  ('p301', 'bapak_tangguh', 'diskusi', 'Peran & Ekspektasi', 'blue', 'Bagaimana cara membagi peran domestik yang adil tanpa saling tersinggung? Share pengalaman yang berhasil di rumah masing-masing.', false, '46 minutes', 10),
  ('p302', 'ayah_naya', 'diskusi', 'Stress Kerja', 'clay', 'Ada yang punya ritual transisi dari mode kerja ke mode keluarga supaya tidak membawa beban kantor ke rumah?', false, '2 hours', 7),
  ('p303', 'dua_shift', 'diskusi', 'Kekhawatiran', 'plum', 'Anak mulai susah diajak ngobrol akhir-akhir ini. Pendekatan komunikasi apa yang efektif untuk anak usia SD?', false, '6 hours', 11),
  -- Aman Pak? (cek-in)
  ('p401', 'bapak_siaga', 'checkin', 'Absen Harian', 'sage', 'Hari ini saya memilih jujur: energi lagi 60%. Tapi tetap hadir buat keluarga malam ini.', false, '3 minutes', 15),
  ('p402', 'ayah_nafisa', 'checkin', 'Dukungan', 'clay', 'Terima kasih untuk bapak-bapak yang kemarin ngecek kabar. Saya merasa lebih kuat hari ini.', false, '3 hours', 11),
  ('p403', 'bapak_introvert', 'checkin', 'Pemulihan', 'blue', 'Saya lagi fokus tidur cukup 7 jam selama seminggu. Semoga mood dan sabar ke anak ikut membaik.', false, '4 hours', 9),
  -- Paguyuban (komunitas)
  ('p501', 'ayah_pagi', 'komunitas', 'Meetup', 'sage', 'Minggu ini ada kopi pagi bareng di Jakarta Selatan jam 07.30. Fokus bahas komunikasi dengan pasangan.', false, '1 hour', 6),
  ('p502', 'bapak_productive', 'komunitas', 'Keuangan', 'clay', 'Komunitas budgeting keluarga buka sesi audit cashflow mingguan. Siapa yang mau ikut batch berikutnya?', false, '3 hours', 8),
  ('p503', 'ayah_belajar', 'komunitas', 'Belajar Bareng', 'blue', 'Kelas online parenting usia 6-12 dibuka lagi minggu depan. Materi fokus regulasi emosi ayah dan anak.', false, '5 hours', 9),
  -- Perjalanan Bapak (profil)
  ('p701', 'ari_pratama', 'profil', 'Update Pribadi', 'sage', 'Minggu ini target saya: 30 menit quality time tanpa gadget setiap malam bersama anak.', false, '10 minutes', 7),
  ('p702', 'ari_pratama', 'profil', 'Catatan Ayah', 'clay', 'Saya mulai jurnal syukur harian 3 poin. Efeknya lumayan menurunkan stres kerja.', false, '1 day', 10),
  -- Obrolan ringan dengan topik-topik khas bapak, biar Topik Hangat ramai
  ('p801', 'ayahanda_petualang', 'status', 'Tugas Negara', 'clay', 'Tugas negara hari ini: antar jemput sekolah, belanja bulanan, dan benerin keran bocor. Lapor, semua selesai!', false, '6 hours', 12),
  ('p802', 'penjaga_gawang', 'status', 'Jokes Bapak', 'sage', 'Kenapa bapak-bapak suka duduk di teras? Karena kalau duduk di genteng nanti dikira mau benerin antena.', false, '1 day 2 hours', 16),
  ('p803', 'ayah_muda29', 'diskusi', 'Cicilan Aman', 'blue', 'Alhamdulillah cicilan motor lunas bulan ini. Tips saya: begitu gajian, langsung pisahkan ke rekening khusus cicilan. Jangan ditunda.', false, '2 days', 13),
  ('p804', 'ayah_pagi', 'status', 'Ngopi Pagi', 'sage', 'Ngopi pagi sebelum anak bangun itu 15 menit paling tenang dalam sehari. Setuju, Pak?', false, '1 day 6 hours', 12),
  ('p805', 'bapak_productive', 'diskusi', 'Perkakas', 'blue', 'Rekomendasi set obeng yang awet buat di rumah? Yang lama dipinjam tetangga sejak 2019.', false, '4 days', 6),
  ('p806', 'bapak_sabar', 'status', 'Remot TV', 'clay', 'Remot TV hilang lagi. Ketemu di dalam kulkas. Tersangka: si bungsu, 3 tahun.', false, '2 days 4 hours', 15),
  ('p807', 'dua_shift', 'status', 'Parkir Mundur', 'plum', 'Akhirnya berhasil parkir mundur di mal tanpa dibantu tukang parkir. Anak-anak tepuk tangan dari kursi belakang.', false, '1 day 5 hours', 14),
  ('p808', 'bapak_introvert', 'status', 'Masak Air', 'clay', 'Hari ini masak air sendiri dan tidak gosong. Progres, Pak.', false, '3 days', 11),
  ('p809', 'papanya_zahra', 'status', 'Foto Anak', 'sage', 'Rekor baru: 47 foto anak dalam sehari. Isinya mirip semua, beda tipis di senyumnya. Wajar kan, Pak?', false, '2 days 8 hours', 13),
  ('p810', 'bapak_otomotif', 'status', 'Ganti Oli', 'clay', 'Pengingat buat bapak-bapak: ganti oli tiap 5.000 km atau 3 bulan, mana yang duluan. Mesin awet, dompet aman.', false, '4 days 3 hours', 9),
  ('p811', 'bapak_siaga', 'status', 'Ronda Malam', 'plum', 'Malam ini giliran ronda di RT. Bawa termos kopi dan kacang rebus. Ada yang mau titip doa biar nggak ngantuk?', false, '3 days 10 hours', 10);

insert into public.posts (author_id, category, tag, tag_tone, body, is_anonymous, created_at)
select u.id, s.category, s.tag, s.tone, s.body, s.anonymous, now() - s.age
from seed_posts s
join seed_users u on u.key = s.author
order by s.age desc;

create temp table seed_post_ids as
select s.key, p.id
from seed_posts s
join seed_users u on u.key = s.author
join public.posts p on p.author_id = u.id and p.body = s.body;

-- "Aman" reactions: a stable mix of demo bapak per post, never the author.
insert into public.post_likes (post_id, user_id, created_at)
select ranked.post_id, ranked.user_id, ranked.created_at
from (
  select
    ids.id as post_id,
    u.id as user_id,
    now() - s.age * random() as created_at,
    s.likes,
    row_number() over (partition by s.key order by md5(s.key || u.key)) as n
  from seed_posts s
  join seed_post_ids ids on ids.key = s.key
  join seed_users u on u.key <> s.author
) ranked
where ranked.n <= ranked.likes;

-- ---------------------------------------------------------------------------
-- Comment threads (replies point at their parent by key).
-- ---------------------------------------------------------------------------
create temp table seed_comments (
  key text primary key,
  post text not null references seed_posts (key),
  parent text references seed_comments (key),
  author text not null references seed_users (key),
  body text not null,
  age interval not null
);

insert into seed_comments (key, post, parent, author, body, age) values
  ('c101a',  'p101', null,    'bapak_otomotif', 'Kalau sekitar Jaksel, coba bengkel di area Fatmawati, Pak. Biasanya masih buka sampai jam 9 malam.', '18 minutes'),
  ('c101a1', 'p101', 'c101a', 'dua_jagoan',     'Siap Pak, terima kasih. Saya cek malam ini.', '12 minutes'),
  ('c101b',  'p101', null,    'ayah_siaga',     'Saya biasanya booking dulu via WA, biar datang langsung dikerjain.', '10 minutes'),
  ('c301a',  'p301', null,    'bapak_belajar',  'Kami pakai jadwal mingguan: siapa pegang antar jemput, siapa pegang urusan dapur. Jadi ekspektasi jelas.', '34 minutes'),
  ('c301a1', 'p301', 'c301a', 'bapak_tangguh',  'Menarik Pak, berarti dibahas rutin tiap minggu ya?', '27 minutes'),
  ('c301a2', 'p301', 'c301a', 'bapak_belajar',  'Iya Pak, biasanya Minggu malam 15 menitan.', '21 minutes'),
  ('c102a',  'p102', null,    'satu_frekuensi', 'Saya relate dengan topik "Ngopi Dulu", Pak. Terima kasih sudah berbagi, sangat membantu saya juga.', '25 minutes'),
  ('c102a1', 'p102', 'c102a', 'moderator_rb',   'Terima kasih sudah saling menguatkan. Jaga ruang tetap hangat ya, Pak.', '20 minutes'),
  ('c102b',  'p102', null,    'ayah_pendengar', 'Setuju, ini isu yang sering terjadi dan penting dibahas bareng.', '11 minutes'),
  ('c202a',  'p202', null,    'bapak_productive', 'Coba metode amplop digital, Pak: pos makan, transport, cicilan, dan tabungan dipisah tiap gajian. Saya bisa bantu cek di sesi audit cashflow.', '40 minutes'),
  ('c202a1', 'p202', 'c202a', 'ayah_muda29',    'Wah boleh Pak, saya ikut batch berikutnya.', '30 minutes'),
  ('c203a',  'p203', null,    'ayah_pendengar', 'Transisi 15 menit itu bagus, Pak. Saya juga pakai: mandi dulu, baru main sama anak.', '2 hours'),
  ('c302a',  'p302', null,    'satu_frekuensi', 'Saya relate dengan topik "Stress Kerja", Pak. Ritual saya: matikan notifikasi kantor begitu sampai pagar rumah.', '1 hour'),
  ('c302a1', 'p302', 'c302a', 'moderator_rb',   'Terima kasih sudah saling menguatkan. Jaga ruang tetap hangat ya, Pak.', '50 minutes'),
  ('c303a',  'p303', null,    'ayah_belajar',   'Coba ngobrol sambil melakukan sesuatu bareng, Pak, misalnya sambil cuci motor. Anak SD lebih terbuka kalau tidak ditatap langsung.', '3 hours'),
  ('c401a',  'p401', null,    'ayah_nafisa',    'Hadir 60% tetap hadir, Pak. Semangat!', '1 minute'),
  ('c501a',  'p501', null,    'dua_jagoan',     'Ikut, Pak! Saya bawa kopi tubruk.', '35 minutes'),
  ('c501b',  'p501', null,    'ayah_pendengar', 'Setuju, ini isu yang sering terjadi dan penting dibahas bareng.', '20 minutes'),
  ('c802a',  'p802', null,    'bapak_siaga',    'Hahaha, ini jokes level ketua RT.', '1 day'),
  ('c807a',  'p807', null,    'bapak_otomotif', 'Selamat, Pak! Tinggal naik level: parkir paralel.', '1 day 3 hours');

-- Top-level comments first, then replies, so each reply finds its parent's id.
insert into public.comments (post_id, author_id, body, created_at)
select ids.id, u.id, c.body, now() - c.age
from seed_comments c
join seed_post_ids ids on ids.key = c.post
join seed_users u on u.key = c.author
where c.parent is null
order by c.age desc;

insert into public.comments (post_id, parent_id, author_id, body, created_at)
select ids.id, parent.id, u.id, c.body, now() - c.age
from seed_comments c
join seed_post_ids ids on ids.key = c.post
join seed_users u on u.key = c.author
join seed_comments pc on pc.key = c.parent
join seed_users pu on pu.key = pc.author
join public.comments parent on parent.post_id = ids.id and parent.author_id = pu.id and parent.body = pc.body
where c.parent is not null
order by c.age desc;

-- ---------------------------------------------------------------------------
-- Follows: everyone follows a stable handful of others, plus the moderator
-- and Komunitas Ayah Pagi, so "Kawan Akrab" and follower counts have data.
-- ---------------------------------------------------------------------------
insert into public.follows (follower_id, followee_id, created_at)
select follower_id, followee_id, now() - interval '20 days' + random() * interval '19 days'
from (
  select
    a.id as follower_id,
    b.id as followee_id,
    b.key in ('moderator_rb', 'ayah_pagi') as always,
    row_number() over (partition by a.key order by md5(a.key || b.key)) as n
  from seed_users a
  join seed_users b on b.key <> a.key
) pairs
where pairs.always or pairs.n <= 4
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Paguyuban: demo bapak join the default groups (from the migrations) and
-- post a few group updates there.
-- ---------------------------------------------------------------------------
create temp table seed_group_posts (
  author text not null references seed_users (key),
  grp text not null,
  tag text not null,
  tone text not null,
  body text not null,
  age interval not null
);

insert into seed_group_posts (author, grp, tag, tone, body, age) values
  ('bapak_otomotif', 'hobi-bengkel', 'Ganti Oli', 'clay', 'Sabtu ini saya buka garasi buat yang mau belajar ganti oli motor sendiri. Bawa oli dan kunci 12, sisanya saya siapkan.', '5 hours'),
  ('dua_jagoan', 'hobi-bengkel', 'Oprek Motor', 'sage', 'Karburator motor tua akhirnya bersih juga. Ternyata cuma butuh sabar dan semprotan carb cleaner.', '1 day 3 hours'),
  ('papanya_zahra', 'parenting-balita', 'GTM', 'plum', 'Anak lagi GTM tiga hari. Akhirnya mau makan setelah diajak masak bareng. Ada trik lain, Pak?', '7 hours'),
  ('ayah_belajar', 'parenting-balita', 'Belajar Bareng', 'blue', 'Rangkuman kelas minggu lalu: validasi dulu perasaan anak, baru kasih batasan. Pelan tapi konsisten.', '2 days'),
  ('bapak_productive', 'investor-bapak', 'Reksa Dana', 'blue', 'Pengingat: dana darurat dulu minimal 6 bulan pengeluaran, baru mulai investasi. Jangan kebalik, Pak.', '9 hours');

insert into public.group_members (group_id, user_id, joined_at)
select g.id, u.id, now() - interval '15 days'
from seed_users u
join public.groups g on g.slug in ('hobi-bengkel', 'parenting-balita', 'investor-bapak')
where abs(hashtext(u.key || g.slug)) % 3 <> 0
   or u.key in (select author from seed_group_posts gp where gp.grp = g.slug)
on conflict do nothing;

insert into public.posts (author_id, category, tag, tag_tone, body, group_id, created_at)
select u.id, 'komunitas', gp.tag, gp.tone, gp.body, g.id, now() - gp.age
from seed_group_posts gp
join seed_users u on u.key = gp.author
join public.groups g on g.slug = gp.grp
order by gp.age desc;

-- ---------------------------------------------------------------------------
-- Direct messages (only visible to the demo accounts in each conversation).
-- ---------------------------------------------------------------------------
create temp table seed_messages (
  n int primary key,
  sender text not null references seed_users (key),
  recipient text not null references seed_users (key),
  body text not null,
  age interval not null
);

insert into seed_messages (n, sender, recipient, body, age) values
  (1, 'ari_pratama', 'bapak_siaga', 'Pak, semoga energinya cepat pulih ya. Kemarin saya juga lagi di 60%.', '1 day'),
  (2, 'bapak_siaga', 'ari_pratama', 'Pak, terima kasih sudah komentar kemarin. Boleh tanya lebih lanjut soal rutinitas malam anak?', '2 hours'),
  (3, 'ari_pratama', 'bapak_siaga', 'Boleh banget, Pak. Intinya jam 8 gadget off, lalu baca buku 15 menit bareng.', '1 hour'),
  (4, 'ayah_pagi', 'ari_pratama', 'Anda diundang ke ruang diskusi privat: Menjaga stamina bapak pekerja shift.', '6 hours'),
  (5, 'dua_jagoan', 'bapak_otomotif', 'Pak, bengkel di Fatmawati yang Bapak maksud namanya apa ya?', '9 minutes'),
  (6, 'bapak_otomotif', 'dua_jagoan', 'Bengkel Pak Darto, Pak. Bilang saja kenal saya.', '5 minutes');

insert into public.conversations (user_a, user_b, created_at)
select distinct least(s.id, r.id), greatest(s.id, r.id), now() - interval '2 days'
from seed_messages m
join seed_users s on s.key = m.sender
join seed_users r on r.key = m.recipient
on conflict do nothing;

-- The on_message_created trigger keeps last_message_at and read markers current.
insert into public.messages (conversation_id, sender_id, body, created_at)
select c.id, s.id, m.body, now() - m.age
from seed_messages m
join seed_users s on s.key = m.sender
join seed_users r on r.key = m.recipient
join public.conversations c on c.user_a = least(s.id, r.id) and c.user_b = greatest(s.id, r.id)
order by m.age desc;

drop table seed_messages, seed_group_posts, seed_comments, seed_post_ids, seed_posts, seed_users;

commit;
