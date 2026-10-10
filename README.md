# Future Tech

미래공학 클래스 커뮤니티. Next.js(App Router) + Neon PostgreSQL + Supabase Storage, Vercel 배포용.

## 아키텍처

```
브라우저 ──(HTTP-only 세션 쿠키)──▶ Next.js on Vercel
   │                                  │  서버 컴포넌트 / 서버 액션 (권한 검사, Zod 검증)
   │                                  ├──▶ Neon PostgreSQL (HTTP 드라이버, Drizzle ORM)
   │                                  │      사용자·글·댓글·앨범 메타데이터·공지·일정·설정·세션
   │                                  └──▶ Supabase Storage (service_role, 서버 전용)
   │                                         서명 업로드 URL 발급 / 서명 조회 URL 발급 / 삭제
   └──(1회용 서명 업로드 토큰)──────────────▶ Supabase Storage (비공개 버킷에 직접 업로드)
```

**업로드 흐름.** 사진 선택 → 미리보기 → 브라우저에서 긴 변 1920px로 축소 + WebP 변환(EXIF 제거) + 480px 썸네일 생성 → 서버 액션이 `{용도}/{userId}/{uuid}.webp` 경로로 서명 업로드 URL 발급 → 브라우저가 Supabase로 직접 업로드 → 경로만 서버 액션에 제출 → 서버가 경로의 소유자(userId)를 검증하고 Neon에 기록. DB 저장이 실패하면 업로드한 파일을 삭제합니다. 파일이 Vercel을 거치지 않으므로 요청 크기 제한(4.5MB)에 걸리지 않습니다.

**조회 흐름.** 버킷은 비공개입니다. 서버가 페이지를 렌더링할 때 필요한 경로를 모아 한 번에 서명 URL(2시간 유효)을 발급합니다. 목록에는 썸네일, 라이트박스에서만 원본을 불러옵니다.

**세션.** 로그인 시 32바이트 무작위 토큰을 쿠키(`httpOnly`, 운영 환경 `secure`, `sameSite=lax`)에 넣고, DB에는 `HMAC-SHA256(token, SESSION_SECRET)`만 저장합니다. `middleware.ts`는 쿠키 유무만 확인해 빠르게 리다이렉트하고, 실제 검증과 권한 확인은 모든 페이지와 서버 액션에서 다시 수행합니다.

## 데이터베이스 스키마

| 테이블 | 내용 |
| --- | --- |
| `users` | 학번(UNIQUE, 5자리), 이름, bcrypt 해시, 역할(student/teacher/admin), 학년·반·번호, 아바타 경로, 소개 |
| `sessions` | 세션 토큰 HMAC, 만료 시각 (사용자 삭제 시 CASCADE) |
| `user_preferences` | 테마(light/dark) |
| `rate_limit_events` | 로그인·비밀번호 시도 속도 제한용 기록 |
| `profile_posts`, `profile_images` | 개인 미니홈피 글·사진 |
| `board_posts` | 게시글 (번호 표시를 위해 serial id), 말머리, 조회수 |
| `board_images`, `board_likes`, `comments` | 첨부 사진, 추천, 댓글 |
| `album_posts`, `album_images` | 앨범 게시물과 사진 경로·순서 |
| `notices` | 공지 (고정 여부) |
| `calendar_events` | 일정 (시작·종료일, 하루 종일 여부, 시간) |
| `site_settings` | 공지/일정 비밀번호 해시 (단일 행) |
| `alumni` | 졸업생 이름, 졸업 시각만 보관 |

명세의 `user_profiles`는 `users`와 1:1이라 `users`에 통합했습니다(`avatar_path`, `bio`). 정의는 `lib/db/schema.ts`에 있으며 마이그레이션은 이 파일에서 생성합니다.

**계정 삭제 시 데이터 처리.** 한 트랜잭션(neon-http `batch`)으로 졸업생 기록 추가 → 세션 삭제 → 사용자 삭제를 실행합니다. 세션·환경설정·개인 글·개인 사진·추천은 CASCADE로 삭제되고, 프로필 사진과 개인 갤러리 파일은 스토리지에서도 지웁니다. 게시판 글·댓글·앨범·공지·일정은 반 공동의 기록이므로 남기되 작성자를 NULL로 바꿔 "졸업생"으로 표시합니다.

## 디렉터리 구조

```
future-tech/
├─ app/
│  ├─ page.tsx, login/, register/        로그인·회원가입 화면
│  ├─ (app)/                             로그인 필요 영역 (공통 레이아웃에서 세션 확인)
│  │  ├─ home/  album/  board/  notices/  members/
│  │  ├─ calendar/  profile/  settings/  search/
│  │  └─ layout.tsx, loading.tsx, error.tsx
│  ├─ layout.tsx, globals.css, icon.svg, not-found.tsx, error.tsx
├─ components/  auth/ layout/ ui/ upload/ board/ album/ notices/ calendar/ profile/ settings/
├─ lib/
│  ├─ db/          schema.ts, index.ts (Neon HTTP + Drizzle)
│  ├─ auth/        session.ts, password.ts, rate-limit.ts, gate.ts
│  ├─ actions/     서버 액션 (auth, upload, board, album, notices, calendar, profile, settings)
│  ├─ supabase/    server.ts (service_role, 서버 전용), client.ts (anon, 서명 업로드 전용)
│  ├─ validation/  Zod 스키마
│  ├─ image/       브라우저 이미지 압축
│  └─ utils/       날짜(Asia/Seoul), 학번 해석
├─ scripts/        migrate.ts, seed.ts
├─ drizzle/        생성된 마이그레이션 SQL
└─ middleware.ts
```

## 설치

Node.js 20 이상이 필요합니다.

```bash
npm install
cp .env.example .env.local
```

## 서비스 준비

**Neon.** [console.neon.tech](https://console.neon.tech)에서 프로젝트를 만들고 Connection Details의 **Pooled connection** 문자열을 `DATABASE_URL`에 넣습니다.

**Supabase.** [supabase.com](https://supabase.com)에서 프로젝트를 만듭니다. 데이터베이스는 쓰지 않고 Storage만 사용합니다. Project Settings → API에서 다음 값을 복사합니다.

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`
- `anon` (또는 새 키 체계의 publishable) 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` (또는 secret) 키 → `SUPABASE_SERVICE_ROLE_KEY`. **절대 `NEXT_PUBLIC_`을 붙이지 마세요.**

**세션 키.** `openssl rand -base64 48` 결과를 `SESSION_SECRET`에 넣습니다(32자 이상).

### 스토리지 버킷

버킷은 **비공개 버킷 하나(`future-tech`)에 폴더로 구분**하는 방식을 택했습니다. 접근 제어를 모두 서버의 서명 URL로 처리하므로 버킷을 나눠도 보안상 이득이 없고, 설정할 곳이 한 군데라 실수가 줄어듭니다.

```
future-tech/
├─ avatars/{userId}/{uuid}.webp
├─ album/{userId}/{uuid}.webp   (+ _thumb.webp)
├─ profile/{userId}/{uuid}.webp (+ _thumb.webp)
└─ board/{userId}/{uuid}.webp   (+ _thumb.webp)
```

`npm run db:seed`가 버킷을 자동으로 만들고 설정합니다(비공개, 파일당 5MB, WebP/JPEG만 허용). 수동으로 만든다면 Storage → New bucket에서 이름 `future-tech`, **Public 끄기**, 같은 제한을 설정하세요. RLS 정책은 추가할 필요가 없습니다. 브라우저는 서버가 발급한 1회용 업로드 토큰으로만 쓸 수 있고, anon 키로는 읽기·목록 조회가 불가합니다.

## 데이터베이스 초기화

```bash
npm run db:generate   # lib/db/schema.ts → drizzle/0000_*.sql 생성
npm run db:migrate    # Neon에 적용
npm run db:seed       # 관리자 계정·기본 비밀번호·버킷 생성 (여러 번 실행해도 안전)
```

생성된 `drizzle/` 폴더는 커밋하세요. 스키마를 바꿀 때마다 `db:generate` → `db:migrate`를 반복합니다. 빠르게 시험해볼 때는 `npm run db:push`로 마이그레이션 파일 없이 바로 반영할 수도 있습니다.

### 초기 계정과 비밀번호

| 항목 | 기본값 |
| --- | --- |
| 관리자 | 학번 `00000`, 이름 `N`, 비밀번호 `NNNNN` |
| 공지 작성 비밀번호 | `00000` |
| 일정 추가 비밀번호 | `00000` |

모두 bcrypt 해시로만 저장됩니다. **배포 직후 관리자로 로그인해 설정 → 계정에서 관리자 비밀번호를, 설정 → 관리자 설정에서 공지·일정 비밀번호를 바꾸세요.** 기본값은 이 README에 공개되어 있습니다.

## 개발

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # 타입 검사
```

## Vercel 배포

1. GitHub에 저장소를 만들고 푸시합니다. `.env.local`은 `.gitignore`에 있어 올라가지 않습니다.
   ```bash
   git init && git add . && git commit -m "Future Tech"
   git branch -M main
   git remote add origin https://github.com/<계정>/future-tech.git
   git push -u origin main
   ```
2. [vercel.com/new](https://vercel.com/new)에서 저장소를 Import합니다. 프레임워크는 Next.js로 자동 인식됩니다.
3. Settings → Environment Variables에 `.env.example`의 6개 값을 모두 넣습니다(Production, Preview 모두).
   Neon을 Vercel Marketplace 통합으로 연결했다면 `DATABASE_URL`이 자동으로 들어갑니다.
4. `SESSION_SECRET`은 로컬과 다른 새 값을 쓰는 것을 권장합니다.
5. Deploy를 누릅니다.
6. 마이그레이션과 시드는 **로컬에서 운영 DB를 대상으로** 한 번 실행합니다. 빌드 단계에 넣지 않은 이유는 프리뷰 배포마다 운영 DB가 변경되는 것을 막기 위해서입니다.
   ```bash
   # .env.local의 DATABASE_URL을 운영 Neon 주소로 맞춘 뒤
   npm run db:migrate && npm run db:seed
   ```
7. Supabase 대시보드 Storage에서 `future-tech` 버킷이 **Private**인지 확인하고, 사이트에서 프로필 사진을 한 장 올려 동작을 확인합니다.

## 보안 요약

- 비밀번호, 공지·일정 비밀번호는 bcrypt(12 rounds) 해시만 저장. 현재 값을 클라이언트로 돌려주는 경로 없음
- 세션은 HTTP-only 쿠키 + DB에는 HMAC만 저장. 비밀번호 변경 시 다른 기기 세션 전부 종료
- 모든 서버 액션이 자체적으로 로그인·소유권·관리자 권한을 확인 (버튼 숨김에 의존하지 않음)
- 수정·삭제 쿼리의 WHERE 절에 작성자 조건 포함. 스토리지 경로는 `{용도}/{본인 userId}/` 형식만 허용해 남의 파일을 참조·삭제할 수 없음
- 로그인(학번당 15분 5회, IP당 40회), 공지/일정 비밀번호(사용자당 15분 5회), 비밀번호 변경·계정 삭제·업로드 요청 속도 제한
- 존재하지 않는 학번으로 로그인해도 같은 시간이 걸리도록 더미 bcrypt 비교
- 사용자 입력은 Zod로 검증하고 React가 이스케이프한 일반 텍스트로만 렌더링 (HTML 렌더링 없음)
- 검색어의 LIKE 와일드카드 이스케이프
- `service_role` 키와 `DATABASE_URL`은 `server-only` 모듈에서만 사용
- 업로드 이미지는 캔버스로 다시 인코딩되어 GPS 등 EXIF 메타데이터가 제거됨
- 보안 헤더(`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`)

## 명세와 다르게 판단한 부분

- **교사 계정도 공지·일정 비밀번호 면제.** 명세는 관리자만 면제였지만, 관리자가 교사로 지정한 계정이 매번 비밀번호를 입력하는 것은 어색해 교사·관리자 모두 면제했습니다. 고정 공지 지정도 교사·관리자만 가능합니다. 관리자만 면제하려면 `lib/utils/student.ts`의 `isStaff` 사용처를 `role === 'admin'`으로 바꾸면 됩니다.
- **교사 계정 만들기.** 교사도 일반 회원가입(임의의 유효한 5자리 학번)을 한 뒤, 관리자가 설정 → 사용자 역할 관리에서 교사로 바꿉니다.
- **관리자 계정은 삭제 불가.** 유일한 관리자가 사라지는 것을 막기 위해서입니다.
- **게시글 수정은 작성자만**, 삭제는 작성자와 관리자. 앨범도 같습니다.
- **댓글 답글은 넣지 않았습니다.** 추천(좋아요)은 게시글에 구현했습니다.

## 알아둘 점

- 서명 URL은 렌더링할 때마다 새로 발급되므로 브라우저 이미지 캐시 효율이 낮습니다. 반 규모에서는 문제없지만, 사용자가 많아지면 서명 URL을 캐싱하는 방안을 고려하세요.
- 사진을 올리고 글 작성을 중간에 취소하면 업로드된 파일이 버킷에 남을 수 있습니다(실패 시에는 자동 정리됨). 필요하면 DB에 경로가 없는 파일을 정리하는 스크립트를 주기적으로 실행하세요.
- 아이폰 HEIC 사진은 사파리에서는 자동 변환되지만 크롬 등 일부 브라우저는 디코딩하지 못합니다. 이 경우 오류 메시지가 표시됩니다.
- 검색은 `ILIKE` 기반입니다. 게시글이 수만 건 이상으로 늘면 `pg_trgm` 인덱스를 추가하세요.
- 의존성 버전은 작성 시점 기준입니다. 설치 후 `npm audit`으로 보안 패치를 확인하세요.
