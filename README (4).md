# Future Tech

미래공학 학급 커뮤니티. 사진, 이야기, 일정을 한곳에 모으는 Next.js 애플리케이션입니다.

- **애플리케이션 데이터** — Neon PostgreSQL (Drizzle ORM)
- **이미지 파일** — Supabase Storage (비공개 버킷)
- **배포** — Vercel

---

## 1. 아키텍처

```
브라우저
  │  이미지: 캔버스로 리사이즈 → WebP 변환 (EXIF 제거)
  ▼
Next.js (Vercel)
  ├─ Server Components  ─ 화면 렌더링
  ├─ Server Actions     ─ 쓰기 작업 + 권한 검사
  ├─ /api/upload        ─ 인증된 업로드만 통과
  └─ /api/media         ─ 세션 확인 후 서명 URL로 리다이렉트
       │                                  │
       ▼                                  ▼
  Neon PostgreSQL                  Supabase Storage
  (모든 관계형 데이터)              (이미지 파일, 비공개)
```

핵심 규칙 세 가지:

1. **이미지 바이트는 Neon에 저장하지 않습니다.** Neon에는 `album/uuid/photo.webp` 같은 경로만 들어갑니다.
2. **service_role 키는 서버에서만 씁니다.** 클라이언트 컴포넌트에서는 절대 참조하지 않습니다.
3. **권한 검사는 항상 서버에서 합니다.** 버튼을 숨기는 것은 UI 편의일 뿐이며, 모든 서버 액션이 세션과 소유권을 다시 확인합니다.

### Supabase 버킷 구성 — 하나의 비공개 버킷

버킷을 넷으로 나누는 대신 `future-tech` 하나만 만들고 폴더로 나눕니다.

```
future-tech/            (Public bucket = OFF)
├─ avatars/{userId}/{uuid}.webp
├─ album/{batchId}/{uuid}.webp
├─ posts/{batchId}/{uuid}.webp
└─ profile/{userId}/{uuid}.webp
```

이렇게 한 이유는, 정책이 "이 버킷은 공개하지 않는다" 한 줄로 끝나고 환경 변수도 하나면 되기 때문입니다. 모든 읽기는 `/api/media` 가 세션을 확인한 뒤 만들어 주는 서명 URL로만 이루어집니다.

### Drizzle 스키마에 대한 메모

요구사항의 `user_profiles` 는 별도 테이블 대신 `users.bio` / `users.avatar_path` 로 합쳤습니다. 프로필 정보가 사용자와 1:1이고 항상 함께 읽히기 때문에, 조인을 늘리는 대신 한 행에 두는 편이 단순합니다. 나머지 테이블은 요구사항 그대로입니다.

| 테이블 | 내용 |
| --- | --- |
| `users` | 계정, 역할, 학년/반/번호, 프로필 |
| `sessions` | 세션 토큰 해시, 만료 시각 |
| `profile_posts`, `profile_images` | 미니홈 한 줄 기록과 사진첩 |
| `board_posts`, `board_images`, `comments`, `post_likes` | 게시판 |
| `album_posts`, `album_images` | 학급 앨범 |
| `notices` | 공지사항 (고정 여부 포함) |
| `calendar_events` | 학급 일정 |
| `site_settings` | 공지/일정 비밀번호 **해시** |
| `user_preferences` | 테마 설정 |
| `alumni` | 졸업생 이름과 졸업 날짜만 |
| `login_attempts` | 로그인·비밀번호 시도 제한 |

---

## 2. 설치

```bash
npm install
```

Node.js 20 이상이 필요합니다.

## 3. 환경 변수

```bash
cp .env.example .env.local
```

| 변수 | 어디서 얻나요 | 브라우저 노출 |
| --- | --- | --- |
| `DATABASE_URL` | Neon → Connection string (**Pooled** 를 고르세요) | ❌ |
| `SUPABASE_URL` | Supabase → Project Settings → API | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | 같은 화면의 `service_role` 키 | ❌ **절대 금지** |
| `SUPABASE_STORAGE_BUCKET` | 만든 버킷 이름 (기본 `future-tech`) | ❌ |
| `NEXT_PUBLIC_SUPABASE_URL` | 프로젝트 URL | ⭕ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` 키 | ⭕ |
| `SESSION_SECRET` | 직접 생성 | ❌ |

`SESSION_SECRET` 생성:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`.env.local` 은 `.gitignore` 에 들어 있습니다. 커밋하지 마세요.

## 4. Supabase Storage 준비

1. Supabase 대시보드 → **Storage** → **New bucket**
2. 이름 `future-tech`, **Public bucket 은 끄기**
3. 파일 크기 제한 6MB, 허용 MIME `image/webp`, `image/jpeg`, `image/png` (선택)

RLS 정책은 따로 만들지 않아도 됩니다. 서버가 service_role 키로만 접근하고, 브라우저는 서명 URL로만 읽습니다.

## 5. 데이터베이스

```bash
npm run db:migrate   # drizzle/0000_init.sql 적용
npm run db:seed      # 관리자 계정 + 기본 비밀번호 생성
```

한 번에:

```bash
npm run db:setup
```

스키마를 바꾼 뒤에는:

```bash
npm run db:generate   # 스키마 변경 → 새 마이그레이션 파일 생성
npm run db:migrate
```

빠르게 밀어 넣고 싶다면 `npm run db:push` 도 쓸 수 있지만, 실제 배포에는 마이그레이션을 권합니다. Neon SQL Editor에서 직접 실행하고 싶다면 `scripts/schema.sql` 을 붙여 넣어도 됩니다.

### 시드가 만드는 것

| 항목 | 기본값 |
| --- | --- |
| 관리자 학번 | `00000` |
| 관리자 이름 | `N` |
| 관리자 비밀번호 | `NNNNN` (bcrypt 해시로 저장) |
| 공지 작성 비밀번호 | `00000` (해시) |
| 일정 추가 비밀번호 | `00000` (해시) |

시드는 **멱등**합니다. 두 번 실행해도 관리자가 중복 생성되지 않고, 이미 바꾼 비밀번호를 되돌리지도 않습니다.

> 배포 후 관리자로 처음 로그인하면 **설정 → 계정**에서 비밀번호를 바로 바꾸세요.

## 6. 개발

```bash
npm run dev
```

http://localhost:3000 → 로그인 화면.

```bash
npm run typecheck   # 타입 검사
npm run lint
```

## 7. Vercel 배포

1. **GitHub 저장소 만들기**

   ```bash
   git init
   git add .
   git commit -m "Future Tech"
   git branch -M main
   git remote add origin https://github.com/<사용자>/<저장소>.git
   git push -u origin main
   ```

2. **Vercel에서 Import** — vercel.com → Add New → Project → 저장소 선택. 프레임워크는 Next.js로 자동 인식됩니다.

3. **환경 변수 입력** — Settings → Environment Variables 에 `.env.local` 의 값을 그대로 넣습니다 (Production / Preview / Development 모두). `SESSION_SECRET` 을 빠뜨리면 로그인 시 오류가 납니다.

4. **Deploy**

5. **마이그레이션 실행** — 로컬에서 프로덕션 `DATABASE_URL` 을 가리킨 채 한 번만 돌립니다.

   ```bash
   DATABASE_URL="<프로덕션 문자열>" npm run db:migrate
   DATABASE_URL="<프로덕션 문자열>" npm run db:seed
   ```

6. **확인** — `https://<도메인>/api/health` 가 `{"ok":true}` 를 돌려주면 Neon 연결이 정상입니다. 그다음 회원가입 → 프로필 사진 업로드까지 해 보면 Storage 설정까지 검증됩니다.

### Vercel 호환성

- Neon HTTP 드라이버를 써서 요청마다 커넥션을 새로 열지 않습니다.
- 로컬 디스크에 파일을 쓰지 않습니다. 업로드는 곧바로 Supabase로 갑니다.
- 서버 메모리에 상태를 두지 않습니다. 세션과 시도 제한 모두 Postgres에 있습니다.
- 미들웨어는 엣지에서 쿠키 존재 여부만 봅니다. bcrypt 같은 Node 전용 코드는 서버 액션과 라우트 핸들러에서만 실행됩니다.

---

## 8. 보안 설계

| 항목 | 구현 |
| --- | --- |
| 비밀번호 | bcryptjs, cost 12. 평문은 어디에도 저장하지 않습니다 |
| 세션 | 임의 토큰을 쿠키에, SHA-256 해시를 DB에 저장. `httpOnly` + `sameSite=lax`, 운영에서는 `secure` |
| 보호된 경로 | 미들웨어가 리다이렉트하고, 레이아웃과 모든 액션이 서버에서 다시 확인 |
| 소유권 | 수정·삭제 시 작성자 또는 관리자인지 서버에서 검사 |
| 입력 검증 | 모든 폼이 Zod 스키마를 통과 |
| XSS | 사용자 입력은 전부 일반 텍스트로 렌더링. `dangerouslySetInnerHTML` 을 쓰지 않습니다 |
| 로그인 제한 | 5회 실패 시 10분 잠금. 공지·일정 비밀번호에도 같은 제한 |
| 파일 접근 | 비공개 버킷 + 세션 확인 후 1시간짜리 서명 URL |
| 업로드 | 서버가 경로를 만들기 때문에 다른 사람 폴더에 쓸 수 없습니다. 크기·MIME 검사 포함 |
| 공지/일정 비밀번호 | 해시만 저장하고, 클라이언트로 절대 보내지 않습니다 |

---

## 9. 주요 화면

| 경로 | 설명 |
| --- | --- |
| `/`, `/login`, `/register` | 로그인 / 회원가입 |
| `/home` | 대시보드 — 공지, 게시글, 사진, 일정 |
| `/album`, `/album/new`, `/album/[id]`, `/album/[id]/edit` | 학급 앨범 |
| `/board`, `/board/new`, `/board/[id]`, `/board/[id]/edit` | 게시판 |
| `/notices`, `/notices/new`, `/notices/[id]` | 공지사항 |
| `/members` | 학년별·교사·졸업생 목록 |
| `/calendar` | 월간 캘린더 |
| `/profile/[userId]`, `/profile/edit` | 미니홈 |
| `/settings` | 계정, 테마, 관리자 설정, 계정 삭제 |
| `/search` | 통합 검색 |

### 학번 규칙

```
20208  →  2학년 2반 8번
│││││
││││└─ 번호 뒷자리
│││└── 번호 앞자리
││└─── 반 뒷자리
│└──── 반 앞자리
└───── 학년
```

학년·반·번호는 학번에서 자동으로 정해지며 학생이 직접 바꿀 수 없습니다. 학번은 중복될 수 없고, 이름은 중복돼도 괜찮습니다. `00000` 은 관리자 전용이라 학생으로 해석하지 않습니다.

### 졸업(계정 삭제)

비밀번호 → 비밀번호 다시 → `학교를 졸업하겠습니다` 세 가지를 모두 서버에서 확인한 뒤, 한 트랜잭션 안에서 졸업생 기록을 남기고 계정을 지웁니다. 글·사진·댓글·세션은 외래 키 CASCADE로 함께 사라지고, Storage 파일은 그 뒤에 정리합니다. 졸업생 목록에는 이름과 날짜만 남고 프로필로 연결되지 않습니다.

---

## 10. 프로젝트 구조

```
future-tech/
├─ app/
│  ├─ page.tsx              랜딩 (로그인/회원가입)
│  ├─ login/  register/
│  ├─ (app)/                로그인이 필요한 모든 화면
│  │  ├─ layout.tsx         헤더 + 사이드바 + 서버 인증
│  │  ├─ home/  album/  board/  notices/
│  │  ├─ members/  calendar/  profile/  settings/  search/
│  └─ api/
│     ├─ upload/            인증된 업로드
│     ├─ media/             서명 URL 리다이렉트
│     └─ health/            배포 확인용
├─ actions/                 서버 액션 (auth, board, album, notices, calendar, profile, settings, account)
├─ components/
│  ├─ ui/  layout/  auth/  board/  album/  profile/  calendar/  settings/
├─ lib/
│  ├─ db/                   Drizzle 스키마와 클라이언트
│  ├─ auth/                 비밀번호, 세션, 권한, 시도 제한
│  ├─ supabase/             Storage (서버 전용)
│  ├─ validation/           Zod 스키마
│  └─ utils/                날짜, 학번, 이미지 처리
├─ drizzle/                 마이그레이션
├─ scripts/                 migrate.ts, seed.ts, schema.sql
└─ middleware.ts
```

## 11. 자주 겪는 문제

**로그인하면 `SESSION_SECRET` 오류가 납니다**
Vercel에 변수를 넣은 뒤 재배포해야 반영됩니다.

**이미지가 깨져 보입니다**
버킷 이름이 `SUPABASE_STORAGE_BUCKET` 과 같은지, service_role 키가 맞는지 확인하세요. `/api/media?path=...` 를 직접 열어 보면 원인이 드러납니다.

**`사이트 설정이 없습니다` 오류**
`npm run db:seed` 를 아직 돌리지 않은 경우입니다.

**공지 비밀번호를 잊었습니다**
관리자로 로그인해 설정에서 새로 지정하세요. 기존 값은 해시라 복구할 수 없습니다.
