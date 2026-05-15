# EduCell

EduCell; öğrencilerin kurslara kaydolduğu, modül bazlı dersleri tamamladığı, sınavlara girerek sertifika alabildiği; eğitmenlerin ise kurs, ders, sınav ve performans yönetimi yapabildiği full-stack eğitim platformudur.

Proje monorepo yapısındadır:

- `apps/web`: React + Vite frontend uygulaması
- `apps/api`: NestJS REST API
- `apps/api/prisma`: Prisma şeması, migration ve seed verileri
- `docker-compose.yml`: PostgreSQL ve Adminer servisleri

## İçindekiler

- [Özellikler](#özellikler)
- [Teknoloji Stack'i](#teknoloji-stacki)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Demo Kullanıcıları](#demo-kullanıcıları)
- [Çalıştırma Komutları](#çalıştırma-komutları)
- [Proje Yapısı](#proje-yapısı)
- [Mimari](#mimari)
- [Veri Modeli](#veri-modeli)
- [Frontend Rotaları](#frontend-rotaları)
- [API Özeti](#api-özeti)
- [Temel Kullanıcı Akışları](#temel-kullanıcı-akışları)
- [AI Özellikleri](#ai-özellikleri)
- [Sınav ve Sertifika Mantığı](#sınav-ve-sertifika-mantığı)
- [Geliştirme Notları](#geliştirme-notları)
- [Sorun Giderme](#sorun-giderme)

## Özellikler

### Öğrenci

- GSM, şifre ve OTP ile kayıt/giriş
- Kurs kataloğunda arama ve filtreleme
- Kursa kayıt olma
- Modül ve ders bazlı ilerleme takibi
- Ders içerikleri, video gömme desteği, yorumlar ve kişisel notlar
- Ders bağlamını bilen AI asistan
- Modül sınavları, süre sayacı ve otomatik gönderim
- Sınav sonucu, doğru/yanlış geri bildirimi ve skor
- Sertifika kazanma, PDF indirme ve QR/numara ile doğrulama
- Liderlik tablosu

### Eğitmen

- Eğitmen paneli
- Kurs oluşturma ve düzenleme
- Kurs yayın durumunu yönetme: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- Modül ve ders oluşturma
- Sınav oluşturma
- Soru ekleme/silme
- AI ile modül içeriğinden sınav sorusu üretme
- Kurs performans metrikleri: kayıt, tamamlama ve sınav geçme oranları

### Admin

- Kullanıcıları listeleme
- Kullanıcı rolü güncelleme
- Kursları yönetme
- Kurs arşivleme / arşivden çıkarma
- Platform istatistiklerini görüntüleme

## Teknoloji Stack'i

### Frontend

- React 19
- Vite
- TanStack Router
- TanStack React Query
- shadcn/ui + Radix UI
- Tailwind CSS
- Recharts
- Lucide React
- Sonner toast bildirimleri

### Backend

- NestJS 10
- Prisma ORM
- PostgreSQL
- JWT authentication
- Passport JWT
- bcrypt
- class-validator / class-transformer
- Swagger

### AI

- OpenAI Chat Completions API
- Ders/modül bağlamlı chat
- JSON formatında sınav sorusu üretimi

### Geliştirme Araçları

- pnpm workspace
- Docker Compose
- Prisma Migrate
- Prisma Studio
- Adminer

## Hızlı Başlangıç

### 1. Gereksinimler

Aşağıdaki araçların kurulu olması gerekir:

- Node.js 20 veya üzeri
- pnpm
- Docker ve Docker Compose
- Git

pnpm kurulu değilse:

```bash
npm install -g pnpm
```

### 2. Bağımlılıkları kur

```bash
pnpm install
```

### 3. PostgreSQL'i başlat

```bash
docker compose up -d
```

Bu komut iki servis başlatır:

- PostgreSQL: `localhost:5432`
- Adminer: `http://localhost:8080`

### 4. API ortam dosyasını oluştur

```bash
cp apps/api/.env.example apps/api/.env
```

`apps/api/.env` içinde en az şu değerler olmalıdır:

```env
DATABASE_URL="postgresql://educell:educell_secret@localhost:5432/educell"
JWT_SECRET="educell_jwt_secret_local_dev"
PORT=3001

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

AI özelliklerini kullanmak için `OPENAI_API_KEY` değerini doldurun. Anahtar yoksa temel platform özellikleri çalışır, AI chat ve AI soru üretimi çalışmaz.

### 5. Prisma client üret

```bash
pnpm --filter api prisma:generate
```

### 6. Migration'ları uygula

```bash
pnpm --filter api prisma:migrate
```

### 7. Demo verilerini yükle

```bash
pnpm --filter api prisma:seed
```

Seed komutu demo kullanıcıları, kurslar, modüller, dersler, sınavlar ve sorular oluşturur.

### 8. Uygulamayı başlat

```bash
pnpm dev
```

Varsayılan adresler:

- Web: `http://localhost:5173`
- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`
- Adminer: `http://localhost:8080`

## Ortam Değişkenleri

Backend ortam dosyası: `apps/api/.env`

| Değişken | Zorunlu | Açıklama |
| --- | --- | --- |
| `DATABASE_URL` | Evet | PostgreSQL bağlantı adresi |
| `JWT_SECRET` | Evet | Local geliştirme için JWT secret |
| `JWT_ACCESS_SECRET` | Hayır | Access token imzalama secret'ı |
| `JWT_REFRESH_SECRET` | Hayır | Refresh token imzalama secret'ı |
| `JWT_ACCESS_EXPIRES_IN` | Hayır | Access token süresi, varsayılan `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Hayır | Refresh token süresi, varsayılan `7d` |
| `PORT` | Hayır | API portu, varsayılan `3001` |
| `OPENAI_API_KEY` | AI için evet | OpenAI API anahtarı |
| `OPENAI_MODEL` | Hayır | Kullanılacak model |
| `OPENAI_BASE_URL` | Hayır | OpenAI uyumlu API base URL |

Güvenlik notu: `.env` dosyası repoya commit edilmemelidir. Sadece `.env.example` paylaşılmalıdır.

## Demo Kullanıcıları

Seed sonrası aşağıdaki hesaplar kullanılabilir.

| Rol | GSM | Şifre | Not |
| --- | --- | --- | --- |
| Eğitmen | `05551112233` | `Test1234` | Kurs ve sınav yönetimi |
| Öğrenci | `05554445566` | `Test1234` | Öğrenme ve sınav akışı |
| Admin | `05557778899` | `Test1234` | Admin paneli |
| Öğrenci | `05550000000` | `Bera1234` | Ek demo hesabı |

OTP kodu geliştirme ortamında sabittir:

```text
1234
```

## Çalıştırma Komutları

Kök dizin komutları:

| Komut | Açıklama |
| --- | --- |
| `pnpm dev` | API ve web uygulamasını birlikte başlatır |
| `pnpm dev:api` | Sadece API'yi başlatır |
| `pnpm dev:web` | Sadece web uygulamasını başlatır |
| `pnpm build` | API ve web build alır |

API komutları:

| Komut | Açıklama |
| --- | --- |
| `pnpm --filter api dev` | NestJS API geliştirme modunda çalışır |
| `pnpm --filter api build` | API build alır |
| `pnpm --filter api start` | Build edilmiş API'yi çalıştırır |
| `pnpm --filter api prisma:migrate` | Prisma migration uygular |
| `pnpm --filter api prisma:generate` | Prisma client üretir |
| `pnpm --filter api prisma:seed` | Demo verilerini yükler |
| `pnpm --filter api prisma:studio` | Prisma Studio açar |

Web komutları:

| Komut | Açıklama |
| --- | --- |
| `pnpm --filter web dev` | Vite dev server başlatır |
| `pnpm --filter web build` | Frontend build alır |
| `pnpm --filter web preview` | Build çıktısını önizler |
| `pnpm --filter web lint` | ESLint çalıştırır |
| `pnpm --filter web format` | Prettier formatlama yapar |

Docker komutları:

```bash
docker compose up -d
docker compose down
docker compose logs -f postgres
```

Veritabanını tamamen sıfırlamak için:

```bash
docker compose down -v
docker compose up -d
pnpm --filter api prisma:migrate
pnpm --filter api prisma:seed
```

## Proje Yapısı

```text
.
├── apps
│   ├── api
│   │   ├── prisma
│   │   │   ├── migrations
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src
│   │   │   ├── admin
│   │   │   ├── ai
│   │   │   ├── auth
│   │   │   ├── certificates
│   │   │   ├── common
│   │   │   ├── courses
│   │   │   ├── exams
│   │   │   ├── interactions
│   │   │   ├── leaderboard
│   │   │   ├── lessons
│   │   │   ├── modules
│   │   │   ├── notes
│   │   │   ├── prisma
│   │   │   ├── users
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── package.json
│   └── web
│       ├── src
│       │   ├── components
│       │   ├── hooks
│       │   ├── lib
│       │   ├── routes
│       │   ├── router.tsx
│       │   └── styles.css
│       └── package.json
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## Mimari

EduCell katmanlı ve modüler bir mimari kullanır:

```mermaid
flowchart LR
    U[Öğrenci / Eğitmen / Admin] --> W[React Web App]
    W -->|REST + Bearer JWT| A[NestJS API]
    A --> G[Global Guards\nJWT + Role]
    G --> S[Domain Servisleri]
    S --> P[Prisma ORM]
    P --> DB[(PostgreSQL)]
    S --> O[OpenAI API]
    A --> D[Swagger Docs]
```

### Backend mimari kararları

- Her domain kendi modülünde tutulur: `auth`, `courses`, `lessons`, `exams`, `certificates`, `ai` vb.
- Controller katmanı HTTP kontratını yönetir.
- Service katmanı iş kurallarını uygular.
- Prisma veri erişimi ve ilişki yönetimi için kullanılır.
- Global `JwtAuthGuard` ile API genelinde kimlik doğrulama yapılır.
- `@Public()` decorator'ı ile public endpointler ayrılır.
- `RolesGuard` ile öğrenci, eğitmen ve admin yetkileri kontrol edilir.
- Global `ValidationPipe` ile DTO doğrulama ve dönüştürme yapılır.
- Global response interceptor ve exception filter ile standart API cevabı sağlanır.

### Frontend mimari kararları

- Dosya bazlı route yapısı `apps/web/src/routes` altında tutulur.
- `apps/web/src/lib/api.ts` API client görevini görür.
- Access token ve refresh token local storage içinde saklanır.
- 401 cevabında refresh token ile yeni access token alınır.
- shadcn/ui ve Radix bileşenleri ile tutarlı UI kullanılır.
- `AppHeader`, `CourseCard`, `ExamTimer`, `LessonChat` gibi tekrar kullanılabilir bileşenler ayrılmıştır.

## Veri Modeli

Temel Prisma modelleri:

| Model | Açıklama |
| --- | --- |
| `User` | Öğrenci, eğitmen ve admin kullanıcıları |
| `Course` | Kurs temel bilgileri ve yayın durumu |
| `Module` | Kurs içindeki sıralı modüller |
| `Lesson` | Modül içindeki dersler |
| `Exam` | Modüle bağlı sınav ayarları |
| `Question` | Sınav soruları ve seçenekleri |
| `Enrollment` | Kullanıcının kurs kaydı |
| `LessonProgress` | Ders tamamlama bilgisi |
| `ExamAttempt` | Sınav denemesi, süre ve skor bilgisi |
| `UserAnswer` | Kullanıcının sınav cevapları |
| `Certificate` | Kurs tamamlandığında üretilen sertifika |
| `Comment` | Ders yorumları ve cevapları |
| `Review` | Kurs değerlendirmeleri |
| `Note` | Ders bazlı kişisel notlar |

Önemli enum'lar:

| Enum | Değerler |
| --- | --- |
| `Role` | `STUDENT`, `INSTRUCTOR`, `ADMIN` |
| `Level` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| `CourseStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `QuestionType` | `MULTIPLE_CHOICE`, `TRUE_FALSE`, `MULTI_SELECT` |
| `AttemptStatus` | `IN_PROGRESS`, `SUBMITTED`, `EXPIRED` |

## Frontend Rotaları

| Rota | Açıklama |
| --- | --- |
| `/` | Kullanıcı durumuna göre yönlendirme |
| `/login` | Giriş |
| `/register` | Kayıt |
| `/courses` | Kurs kataloğu |
| `/courses/:id` | Kurs detay |
| `/my-courses` | Kayıtlı kurslar |
| `/learn/:courseId` | Ders ve modül öğrenme ekranı |
| `/learn/:courseId/exam/:examId` | Sınav ekranı |
| `/learn/:courseId/exam/:examId/result` | Sınav sonucu |
| `/profile` | Profil ve sertifikalar |
| `/verify/:number` | Sertifika doğrulama |
| `/leaderboard` | Liderlik tablosu |
| `/instructor` | Eğitmen paneli |
| `/instructor/new` | Yeni kurs oluşturma |
| `/instructor/:courseId` | Kurs düzenleme |
| `/admin` | Admin paneli |

## API Özeti

API base URL:

```text
http://localhost:3001/api/v1
```

Swagger:

```text
http://localhost:3001/api/docs
```

### Auth

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| `POST` | `/auth/register` | Kayıt isteği oluşturur |
| `POST` | `/auth/login` | Giriş isteği oluşturur |
| `POST` | `/auth/verify-otp` | OTP doğrular ve token döner |
| `POST` | `/auth/refresh` | Refresh token ile yeni token üretir |
| `GET` | `/auth/me` | Oturum kullanıcısını döner |

### Courses

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| `GET` | `/courses` | Yayındaki kursları listeler |
| `GET` | `/courses/:id` | Kurs detayını getirir |
| `GET` | `/courses/:id/curriculum` | Kayıtlı kullanıcı için müfredat ve ilerleme getirir |
| `POST` | `/courses` | Eğitmen/admin kurs oluşturur |
| `PATCH` | `/courses/:id` | Eğitmen/admin kurs günceller |
| `POST` | `/courses/:id/enroll` | Öğrenciyi kursa kaydeder |
| `GET` | `/courses/:id/recommendations` | Kurs önerileri getirir |

### Modules and Lessons

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| `GET` | `/courses/:courseId/modules` | Kurs modüllerini listeler |
| `POST` | `/courses/:courseId/modules` | Modül oluşturur |
| `GET` | `/modules/:id` | Modül detayı |
| `POST` | `/modules/:moduleId/lessons` | Ders oluşturur |
| `GET` | `/lessons/:id` | Ders detayı |
| `PATCH` | `/lessons/:id` | Ders günceller |
| `PATCH` | `/lessons/:id/complete` | Dersi tamamlandı işaretler |
| `DELETE` | `/lessons/:id/complete` | Ders tamamlanmasını geri alır |

### Exams

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| `POST` | `/modules/:moduleId/exam` | Modül sınavı oluşturur/günceller |
| `POST` | `/exams/:examId/questions` | Soru ekler |
| `DELETE` | `/questions/:questionId` | Soru siler |
| `GET` | `/exams/:examId/manage` | Eğitmen için sınav ve soruları getirir |
| `POST` | `/exams/:examId/start` | Öğrenci sınav denemesi başlatır |
| `POST` | `/exams/:examId/submit` | Sınavı gönderir |
| `GET` | `/exams/:examId/result` | En iyi/tamamlanmış sonucu getirir |
| `GET` | `/exams/:examId/attempts` | Deneme geçmişini getirir |

### Interactions, Notes, Certificates

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| `GET` | `/lessons/:lessonId/comments` | Ders yorumları |
| `POST` | `/lessons/:lessonId/comments` | Yorum ekler |
| `POST` | `/comments/:commentId/reply` | Yoruma cevap verir |
| `GET` | `/lessons/:lessonId/notes` | Kişisel ders notunu getirir |
| `PUT` | `/lessons/:lessonId/notes` | Not oluşturur/günceller |
| `DELETE` | `/lessons/:lessonId/notes` | Not siler |
| `GET` | `/certificates/:number/verify` | Sertifika doğrular |

### AI

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| `POST` | `/ai/chat` | Ders/modül bağlamlı AI chat |
| `POST` | `/ai/generate-questions` | Modül içeriğinden sınav sorusu üretir |

### Admin and Leaderboard

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| `GET` | `/admin/stats` | Platform istatistikleri |
| `GET` | `/admin/users` | Kullanıcı listesi |
| `PATCH` | `/admin/users/:id/role` | Kullanıcı rolü günceller |
| `GET` | `/admin/courses` | Admin kurs listesi |
| `PATCH` | `/admin/courses/:id/archive` | Kurs arşivler |
| `PATCH` | `/admin/courses/:id/unarchive` | Kursu arşivden çıkarır |
| `GET` | `/admin/instructor-stats` | Eğitmen kurs metrikleri |
| `GET` | `/leaderboard` | Liderlik tablosu |

## Temel Kullanıcı Akışları

### Öğrenci öğrenme akışı

```mermaid
sequenceDiagram
    participant S as Öğrenci
    participant W as Web
    participant A as API
    participant DB as PostgreSQL

    S->>W: Giriş yapar
    W->>A: POST /auth/login
    A-->>W: OTP bekleniyor
    S->>W: 1234 OTP girer
    W->>A: POST /auth/verify-otp
    A-->>W: Access + refresh token

    S->>W: Kurs seçer ve kaydolur
    W->>A: POST /courses/:id/enroll
    A->>DB: Enrollment oluşturur
    A-->>W: Kayıt başarılı

    S->>W: Dersi tamamlar
    W->>A: PATCH /lessons/:id/complete
    A->>DB: LessonProgress oluşturur
    A-->>W: İlerleme güncellendi
```

### Sınav ve sertifika akışı

```mermaid
sequenceDiagram
    participant S as Öğrenci
    participant W as Web
    participant A as API
    participant DB as PostgreSQL

    S->>W: Modül sınavını başlatır
    W->>A: POST /exams/:id/start
    A->>DB: Enrollment, progress ve modül kilidi kontrolü
    A->>DB: ExamAttempt oluşturur
    A-->>W: Sorular + expiresAt

    S->>W: Cevapları gönderir
    W->>A: POST /exams/:id/submit
    A->>DB: Cevapları kaydeder
    A->>A: Skoru hesaplar
    A->>DB: Gerekirse sertifika oluşturur
    A-->>W: Skor, passed ve certificate bilgisi
```

## AI Özellikleri

### Ders asistanı

Öğrenci ders ekranında AI asistana soru sorabilir. Backend, seçili ders veya modül içeriğini sistem bağlamı olarak modele gönderir. Böylece asistan genel cevap vermek yerine aktif eğitim içeriğine göre yanıt üretir.

Örnek kullanım:

```json
{
  "lessonId": "lesson-id",
  "messages": [
    {
      "role": "user",
      "content": "Bu dersteki async/await konusunu kısa anlatır mısın?"
    }
  ]
}
```

### AI ile soru üretimi

Eğitmen, modül içeriğinden otomatik sınav sorusu üretebilir. Backend:

- Eğitmen yetkisini kontrol eder.
- Modül ve ders içeriklerini toplar.
- Modelden sadece JSON döndürmesini ister.
- JSON çıktısını parse eder.
- Seçenekleri normalize eder.
- Soruları veritabanına kaydeder.

Desteklenen soru tipleri:

- `MULTIPLE_CHOICE`
- `TRUE_FALSE`
- `MULTI_SELECT`

## Sınav ve Sertifika Mantığı

### Sınav güvenliği

- Doğru cevap bilgisi frontend'e gönderilmez.
- `Question.options` verisi veritabanında doğru seçenekleri içerir, ancak öğrenci sınavında `isCorrect` alanı çıkarılır.
- Skor backend'de hesaplanır.
- Çoklu seçim sorularında yanlış seçimler puanı düşürür.
- Süre kontrolü backend'de `expiresAt` ile yapılır.
- Süresi geçen deneme `EXPIRED` olur.
- Maksimum deneme hakkı `maxAttempts` ile sınırlandırılır.

### Modül kilidi

- Öğrenci sınava girebilmek için modüldeki tüm dersleri tamamlamalıdır.
- İlk modül varsayılan olarak açıktır.
- Sonraki modülün sınavına girebilmek için önceki modül sınavı geçilmiş olmalıdır.
- Frontend kilit durumunu API'den gelen `isUnlocked` ve `passed` alanlarına göre gösterir.

### Sertifika üretimi

- Sertifika, kursun tüm sınavlı modülleri başarıyla geçildiğinde üretilir.
- Her kullanıcı-kurs çifti için tek sertifika oluşturulur.
- Sertifika numarası unique tutulur.
- Profil ekranından PDF indirilebilir.
- `/verify/:number` sayfası ve API doğrulama endpoint'i ile sertifika doğrulanabilir.

## Geliştirme Notları

### API response yapısı

API global interceptor ile cevapları standart hale getirir. Frontend `apps/web/src/lib/api.ts` içinde `json.data ?? json` yaklaşımıyla hem standart hem doğrudan response'ları destekler.

### Token yenileme

Frontend isteklerinde access token `Authorization: Bearer ...` olarak gönderilir. API `401` dönerse refresh token ile `/auth/refresh` çağrılır ve istek tekrar denenir. Refresh başarısız olursa tokenlar temizlenir ve kullanıcı `/login` sayfasına yönlendirilir.

### Swagger

API çalışırken Swagger dokümantasyonu şu adrestedir:

```text
http://localhost:3001/api/docs
```

### Adminer bilgileri

Adminer'a girmek için:

| Alan | Değer |
| --- | --- |
| System | PostgreSQL |
| Server | `postgres` veya localden bağlanıyorsanız `localhost` |
| Username | `educell` |
| Password | `educell_secret` |
| Database | `educell` |

### Prisma Studio

```bash
pnpm --filter api prisma:studio
```

Varsayılan olarak tarayıcıda Prisma Studio açılır ve veritabanı kayıtları görsel olarak incelenebilir.

## Sorun Giderme

### Port 5432 kullanımda

Bilgisayarda başka PostgreSQL çalışıyor olabilir. Çözüm seçenekleri:

- Yerel PostgreSQL servisini durdurun.
- `docker-compose.yml` içinde dış portu değiştirin.
- `DATABASE_URL` değerini yeni porta göre güncelleyin.

Örnek:

```yaml
ports:
  - '5433:5432'
```

```env
DATABASE_URL="postgresql://educell:educell_secret@localhost:5433/educell"
```

### API veritabanına bağlanamıyor

Kontrol edin:

```bash
docker compose ps
docker compose logs postgres
```

Ardından migration ve seed'i tekrar çalıştırın:

```bash
pnpm --filter api prisma:migrate
pnpm --filter api prisma:seed
```

### Prisma client bulunamadı

Şunu çalıştırın:

```bash
pnpm --filter api prisma:generate
```

### Login sonrası OTP bekleniyor

Bu demo ortamında OTP SMS gönderilmez. Kod sabittir:

```text
1234
```

### AI çalışmıyor

Kontrol edin:

- `apps/api/.env` içinde `OPENAI_API_KEY` dolu mu?
- API yeniden başlatıldı mı?
- OpenAI hesabında kota veya erişim problemi var mı?
- `OPENAI_MODEL` geçerli bir model adı mı?

AI dışındaki kurs, sınav, sertifika ve admin özellikleri API anahtarı olmadan çalışmaya devam eder.

### Frontend API'ye ulaşamıyor

Frontend API adresi `apps/web/src/lib/api.ts` içinde şu şekilde tanımlıdır:

```ts
const BASE = "http://localhost:3001/api/v1";
```

API farklı portta çalışıyorsa bu değer güncellenmelidir.

## Sunum İçin Kısa Demo Sırası

1. Öğrenci hesabıyla giriş yap.
2. Kurs kataloğunda arama ve filtreleme göster.
3. Kurs detayına gir ve müfredatı anlat.
4. Öğrenme ekranında ders, not, yorum ve AI asistanı göster.
5. Dersi tamamla, ilerleme yüzdesini vurgula.
6. Modül sınavını aç, süre ve soru tiplerini göster.
7. Sonuç ekranında skor ve geri bildirimi göster.
8. Profilde sertifika, PDF ve QR doğrulamayı göster.
9. Eğitmen hesabına geçip panel, istatistikler ve AI soru üretimini göster.
10. Swagger ve mimari diyagram üzerinden teknik kısmı anlat.

## Lisans

Bu proje case/demo çalışması olarak hazırlanmıştır.

