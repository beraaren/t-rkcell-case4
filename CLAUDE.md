# EduCell — CLAUDE.md

## Proje
Turkcell CodeNight 2026 hackathon projesi. Çevrimiçi eğitim platformu.
**Deadline:** Tek gece, 18:00–04:00.

## Stack
- **Monorepo:** pnpm workspaces (`apps/api`, `apps/web`)
- **Backend:** NestJS + Prisma ORM + PostgreSQL
- **Frontend:** React + TanStack Router + TanStack Start + Vite + shadcn/ui + Tailwind
- **Auth:** JWT + Refresh Token (localStorage: `educell:token`, `educell:refresh`)
- **DB URL:** `postgresql://educell:educell_secret@localhost:5432/educell`
- **API Base:** `http://localhost:3001/api/v1`
- **Dev:** `pnpm dev` (root'tan her ikisini çalıştırır)

## Mimari

```
Kurs → Modül → Ders → Sınav → Soru
```

- Her modülün sonunda 1 sınav olabilir
- Önceki modül sınavı geçilmeden sonraki modül kilitli (`isUnlocked`)
- Ders tamamlama → `LessonProgress` kaydı
- Sınav: başlat (`start`) → server-side `expiresAt` → gönder (`submit`) → otomatik puanla
- Sertifika: tüm modüller + sınavlar tamamlandığında üretilir

## DB Şeması — Önemli Noktalar

| Model | Kritik Alanlar |
|-------|---------------|
| `ExamAttempt` | `startedAt`, `expiresAt`, `status` (IN_PROGRESS/SUBMITTED/EXPIRED) |
| `Question` | `options: Json` → `[{id, text, is_correct}]` |
| `UserAnswer` | `selectedOptionIds: Json` (array) |
| `Certificate` | `number` unique, `@@unique([userId, courseId])` |

## API Kuralları

- Response format: `{ data: ... }` wrapper — `api.ts` otomatik `.data` çıkarır
- Auth guard: tüm endpoint'ler JWT ister, `@Public()` ile muaf tutulur
- Roles guard: `@Roles(Role.X)` — yanlış role → 403
- `PATCH /lessons/:id/complete` → sadece `STUDENT` rolü (dikkat!)

## Field İsimleri (Backend → Frontend)

Backend `getCurriculum` şu anda döndürür:
- `isCompleted` (ders tamamlandı mı) ✓ düzeltildi
- `isUnlocked` (modül açık mı) ✓ düzeltildi
- `title` (kurs başlığı) ✓ düzeltildi

## Sınav Puanlama

- Tek seçim: tam puan veya sıfır
- MULTI_SELECT: kısmi puan → `(doğru seçilen / toplam doğru) * (1/toplamSoru) * 100`
- Geçme: `score >= passingScore`
- En yüksek `score` geçerli (3 deneme hakkı)

## OTP

Simülasyon — her zaman `1234` kabul edilir.

## Seed Data

```bash
cd apps/api && pnpm prisma:seed
```

3 kurs, her birinde 3 modül, modül başına 3 ders + 1 sınav (10 soru).

## Sık Kullanılan Komutlar

```bash
pnpm dev                          # her ikisini başlat
pnpm dev:api                      # sadece backend
pnpm dev:web                      # sadece frontend
cd apps/api && pnpm prisma:studio # DB görsel arayüz (localhost:5555)
cd apps/api && pnpm prisma:migrate # migration çalıştır
cd apps/api && pnpm prisma:seed   # seed data
```

## Eksik / Yapılacaklar

- [ ] Sertifika otomatik üretimi (tüm modüller tamamlandığında trigger)
- [ ] Server-side sınav süresi doğrulaması (`expiresAt` kontrolü submit'te)
- [ ] `PATCH /lessons/:id/complete` — STUDENT dışı roller çalışmıyor (roles guard kısıtı)
- [ ] Bonus: Sertifika PDF + QR
- [ ] Bonus: Eğitmen dashboard istatistikleri
- [ ] Bonus: Leaderboard
