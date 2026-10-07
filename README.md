# Ruang Bapak

Aplikasi komunitas digital untuk bapak-bapak Indonesia.

## Fitur sosial

Dengan backend [Supabase](https://supabase.com) aktif, Ruang Bapak berjalan sebagai media sosial sungguhan:

- **Akun**: daftar & masuk dengan email/password (opsional Google), **lupa password** lewat tautan email, profil dibuat otomatis saat daftar.
- **Wajib masuk**: semua halaman konten (feed, profil, postingan, inbox) hanya bisa dibuka setelah login. Pengunjung yang belum masuk diarahkan ke `/login`, lalu dikembalikan ke halaman yang tadi dibukanya setelah berhasil masuk.
- **Postingan** per ruang (Teras dengan saringan Semua/Uneg-uneg/Diskusi, Aman Pak?, Paguyuban, Profil), termasuk mode **anonim** — identitas penulis disembunyikan dari pengguna lain di level database.
- **Tag postingan**: pilih tag dari saran tiap ruang (mis. Ngopi, Ronda, Tugas Negara) atau tulis tag sendiri di kotak tulis; tag tampil di postingan dan dihitung di **Topik Hangat**. Klik tag untuk melihat semua postingan dengan tag itu (`/tag/<tag>`).
- **Foto & polling**: lampirkan foto ke postingan (otomatis diperkecil, maks. 1600px; tidak tersedia untuk postingan anonim supaya identitas tetap aman), sisipkan emoji, dan buat **polling** 2–4 pilihan di ruang Diskusi.
- **Foto profil**: foto Google dipakai otomatis; bisa diganti atau dihapus di **Edit Profil**.
- **Simpan & bagikan**: simpan postingan ke tab **Tersimpan** di profil (`/profil?tab=tersimpan`), bagikan lewat menu bagikan HP, salin tautan, atau WhatsApp.
- **Cari** (`/cari`): cari isi postingan, nama bapak, dan tag.
- **Paguyuban**: grup sungguhan — gabung/keluar, buat paguyuban baru, dan halaman grup (`/komunitas/<slug>`) berisi obrolan anggota.
- **Absen Pak** tersimpan di akun (bukan lagi di browser) dan bisa sekaligus dibagikan sebagai cek-in. **Mode Rehat** (di menu akun) menyembunyikan angka dukungan/komentar, badge, dan notifikasi pop-up.
- **Dukungan "aman"** (like), **komentar bersarang**, dan hapus postingan milik sendiri.
- **Profil**: edit nama, username, bio, lokasi; halaman profil publik di `/u/<username>` dengan jumlah pengikut/mengikuti.
- **Ikuti (follow)** bapak lain dari profilnya atau dari panel **Saran Kawan** (bapak yang aktif posting bulan ini); tab **Kawan Akrab** di tiap ruang menampilkan postingan dari bapak yang diikuti (postingan anonim tidak ikut).
- **Inbox**: pesan langsung antar bapak (tombol "Kirim Pesan" di profil) dan **notifikasi** saat postingan dapat dukungan, komentar, balasan, atau saat ada pengikut baru. Pesan dan notifikasi masuk **realtime** (Supabase Realtime), dengan polling berkala sebagai cadangan.
- **Panel kanan** berisi data asli: **Saran Kawan**, **Topik Hangat** (tag paling ramai 7 hari terakhir), dan jumlah **cek-in hari ini** (sejak tengah malam WIB).
- **Keamanan komunitas**: **laporkan** postingan/komentar, **blokir** pengguna (konten & notifikasinya disembunyikan, DM ditutup dua arah), dan halaman **Moderasi** (`/moderasi`) bagi moderator untuk menyembunyikan atau memulihkan konten yang dilaporkan.

Tanpa konfigurasi Supabase, aplikasi otomatis berjalan dalam **mode demo** memakai data contoh (tidak ada yang tersimpan).

## Menjalankan secara lokal

```sh
npm install
cp .env.example .env   # isi kredensial Supabase, atau biarkan kosong untuk mode demo
npm run dev
```

## Menyiapkan Supabase

1. Buat project baru di Supabase.
2. Jalankan semua migration di `supabase/migrations/` **berurutan sesuai nama file** — lewat **SQL Editor** (tempel isi tiap file lalu Run) atau `supabase db push` dengan Supabase CLI. Migration aman dipasang di project yang sudah punya pengguna: akun lama otomatis dibuatkan profil.
   Migration `…009` juga membuat bucket Storage `rb-avatars` dan `rb-post-images` (publik, hanya bisa diunggah ke folder milik sendiri).
3. Salin **Project URL** dan **anon/publishable key** (Project Settings → API) ke `.env`:

   ```sh
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```

4. Di **Authentication → URL Configuration**, tambahkan alamat aplikasi dengan wildcard (mis. `http://localhost:8080/**` dan `https://domain-vercel-anda/**`) ke *Redirect URLs* agar tautan konfirmasi email, reset password (`/reset-password`), dan login Google kembali ke aplikasi. Jika project Supabase dipakai bersama aplikasi lain, jangan ubah *Site URL*; cukup tambahkan ke *Redirect URLs*.
5. Untuk deploy (mis. Vercel), isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di environment variables hosting lalu deploy ulang — variabel `VITE_*` dibaca saat build.
6. (Opsional) Aktifkan provider **Google** di **Authentication → Providers** agar tombol "Google" berfungsi.

**Data contoh (seeder)**: `supabase/seed.sql` mengisi database dengan konten yang sama seperti mode demo: 22 akun bapak contoh, 29 postingan di semua ruang (termasuk satu curhat anonim dan cek-in hari ini), komentar bersarang, dukungan "aman", follow, dan beberapa pesan langsung. Notifikasi ikut terbentuk lewat trigger.

- Supabase CLI: otomatis dijalankan saat `supabase db reset` (lokal).
- Project hosted: tempel seluruh isi file ke **SQL Editor** lalu Run.

Seeder aman dijalankan ulang: akun contoh lama (beserta semua kontennya) dihapus lalu dibuat lagi dengan waktu terbaru. Akun asli tidak disentuh, tetapi dukungan atau komentar akun asli di postingan contoh ikut terhapus. Akun contoh memakai email `@demo.ruangbapak.invalid` tanpa password, jadi tidak bisa dipakai login. Untuk menghapus semua data contoh:

```sql
delete from auth.users where email like '%@demo.ruangbapak.invalid';
```

**Moderator** dipilih lewat SQL Editor (pengguna tidak bisa mengangkat dirinya sendiri):

```sql
update public.profiles set is_moderator = true where username = 'username_moderator';
```

Secara default Supabase meminta konfirmasi email setelah daftar; matikan *Confirm email* di **Authentication → Providers → Email** jika ingin pengguna langsung masuk.

## Skrip

- `npm run dev` — server development
- `npm run build` — build produksi
- `npm test` — unit test (Vitest)
- `npm run lint` — ESLint
