# Ruang Bapak

Aplikasi komunitas digital untuk bapak-bapak Indonesia.

## Fitur sosial

Dengan backend [Supabase](https://supabase.com) aktif, Ruang Bapak berjalan sebagai media sosial sungguhan:

- **Akun**: daftar & masuk dengan email/password (opsional Google), **lupa password** lewat tautan email, profil dibuat otomatis saat daftar.
- **Postingan** per ruang (Teras, Uneg-uneg, Diskusi, Aman Pak?, Paguyuban, Profil), termasuk mode **anonim** — identitas penulis disembunyikan dari pengguna lain di level database.
- **Dukungan "aman"** (like), **komentar bersarang**, dan hapus postingan milik sendiri.
- **Profil**: edit nama, username, bio, lokasi; halaman profil publik di `/u/<username>`.
- **Inbox**: pesan langsung antar bapak (tombol "Kirim Pesan" di profil) dan **notifikasi** saat postingan dapat dukungan, komentar, atau balasan. Badge Inbox menampilkan jumlah yang belum dibaca; data diperbarui berkala (polling), bukan realtime.
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
3. Salin **Project URL** dan **anon/publishable key** (Project Settings → API) ke `.env`:

   ```sh
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```

4. Di **Authentication → URL Configuration**, tambahkan alamat aplikasi dengan wildcard (mis. `http://localhost:8080/**` dan `https://domain-vercel-anda/**`) ke *Redirect URLs* agar tautan konfirmasi email, reset password (`/reset-password`), dan login Google kembali ke aplikasi. Jika project Supabase dipakai bersama aplikasi lain, jangan ubah *Site URL*; cukup tambahkan ke *Redirect URLs*.
5. Untuk deploy (mis. Vercel), isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di environment variables hosting lalu deploy ulang — variabel `VITE_*` dibaca saat build.
6. (Opsional) Aktifkan provider **Google** di **Authentication → Providers** agar tombol "Google" berfungsi.

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
