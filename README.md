# Ruang Bapak

Aplikasi komunitas digital untuk bapak-bapak Indonesia.

## Fitur sosial

Dengan backend [Supabase](https://supabase.com) aktif, Ruang Bapak berjalan sebagai media sosial sungguhan:

- **Akun**: daftar & masuk dengan email/password (opsional Google), profil dibuat otomatis saat daftar.
- **Postingan** per ruang (Teras, Uneg-uneg, Diskusi, Aman Pak?, Paguyuban, Profil), termasuk mode **anonim** — identitas penulis disembunyikan dari pengguna lain di level database.
- **Dukungan "aman"** (like), **komentar bersarang**, dan hapus postingan milik sendiri.
- **Profil**: edit nama, username, bio, lokasi; halaman profil publik di `/u/<username>`.

Tanpa konfigurasi Supabase, aplikasi otomatis berjalan dalam **mode demo** memakai data contoh (tidak ada yang tersimpan).

## Menjalankan secara lokal

```sh
npm install
cp .env.example .env   # isi kredensial Supabase, atau biarkan kosong untuk mode demo
npm run dev
```

## Menyiapkan Supabase

1. Buat project baru di Supabase.
2. Jalankan migration di `supabase/migrations/` — lewat **SQL Editor** (tempel isi file lalu Run) atau `supabase db push` dengan Supabase CLI.
3. Salin **Project URL** dan **anon/publishable key** (Project Settings → API) ke `.env`:

   ```sh
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```

4. Di **Authentication → URL Configuration**, set *Site URL* ke alamat aplikasi (mis. `http://localhost:8080` saat development) agar tautan konfirmasi email kembali ke aplikasi.
5. (Opsional) Aktifkan provider **Google** di **Authentication → Providers** agar tombol "Google" berfungsi.

Secara default Supabase meminta konfirmasi email setelah daftar; matikan *Confirm email* di **Authentication → Providers → Email** jika ingin pengguna langsung masuk.

## Skrip

- `npm run dev` — server development
- `npm run build` — build produksi
- `npm test` — unit test (Vitest)
- `npm run lint` — ESLint
