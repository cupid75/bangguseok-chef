# P0 기존 Google Apps Script 시스템 조사 결과

조사일: 2026-09-30  
조사 방식: Apps Script 편집기, 배포 설정, 공개 웹앱, 연결된 Google Sheets를 읽기 전용으로 확인

백업 완료:

- `legacy-apps-script/Code.gs`
- `legacy-apps-script/Index.html`
- `legacy-data/방구석 요리사_DB.xlsx`
- Script Properties의 실제 비밀값은 백업 파일에 포함하지 않음

## 1. 조사 결과 요약

현재 서비스는 별도의 ASP 서버나 일반 웹 서버가 없는 단일 Google Apps Script 웹앱이다.

```text
Apps Script Web App
├── Index.html        고객용 화면, CSS, 브라우저 JavaScript
├── Code.gs           검색, 캐시, Gemini 호출, Sheets 읽기/쓰기
└── Google Sheets     레시피, 검색캐시, 기본조미료
```

- 프로젝트명: 방구석 요리사
- 현재 운영 배포: 버전 21
- 배포일: 2026-09-29 오후 5:19
- 실행 권한: 프로젝트 소유자 계정으로 실행
- 접근 권한: 모든 사용자
- 화면 파일: `Index.html` 1개
- 서버 파일: `Code.gs` 1개
- 현재 회원 로그인: 없음
- 현재 사진 업로드: 없음
- 갤러리: 화면 상단에 `사진 갤러리 · 준비 중` 문구만 존재

## 2. 현재 화면 구조

현재 `Index.html`은 새 URL로 이동하지 않는 단일 화면형 애플리케이션이다.

1. 홈
   - 보유 재료 입력
   - 추천 검색어 버튼
   - 레시피 찾기
2. 검색 결과
   - 최대 3개 레시피 카드
   - 기본 레시피 또는 AI 추천 표시
3. 레시피 상세
   - 요리 제목
   - 조리 시간과 인분
   - 구성 재료
   - 필수 도구
   - 대체 재료
   - 알레르기 주의
   - 만드는 방법
4. 갤러리
   - 아직 구현되지 않음

## 3. 현재 서버 기능

브라우저는 Apps Script 전용 `google.script.run`으로 아래 함수를 호출한다.

```text
searchRecipes(rawInput)
```

`Code.gs`에서 확인된 주요 처리:

- 재료 입력 정규화
- 기본 조미료 제외
- 메모리 캐시 조회
- Google Sheets 검색 캐시 조회
- 기존 레시피 검색
- Gemini API를 통한 신규 레시피 생성
- 생성된 레시피를 Google Sheets에 저장
- 검색 횟수 증가
- 레시피 조리 방법 형식 정리

사용 중인 Apps Script 서비스:

- `PropertiesService`
- `CacheService`
- `LockService`
- `UrlFetchApp`
- `SpreadsheetApp`
- `HtmlService`

비밀정보는 프론트가 아니라 Script Properties에서 읽도록 구성되어 있다.

```text
SPREADSHEET_ID
GEMINI_API_KEY
```

## 4. Google Sheets 구조

확인된 시트:

```text
레시피
검색캐시
기본조미료
```

레시피 데이터에서 사용하는 열:

```text
레시피ID
요리제목
구성재료
정규화재료
조리시간(분)
인분
필수도구
대체재료
알레르기주의
만드는방법
생성출처
사용여부
등록일
수정일
검색횟수
```

## 5. Cloudflare 이전 시 중요한 제약

현재 프론트의 `google.script.run`은 Apps Script가 제공하는 페이지 내부에서만 동작한다. 따라서 `Index.html`을 그대로 Cloudflare에 복사하면 레시피 검색이 동작하지 않는다.

Cloudflare 이전 시 아래 둘 중 하나가 필요하다.

### 방안 A: Apps Script를 HTTP API로 개조

- Apps Script에 `doPost()` 기반 JSON API 추가
- Cloudflare 프론트에서 HTTP 요청
- CORS, 인증, 오류 처리 추가
- Google Sheets와 기존 Gemini 로직 유지

장점: 데이터 이전이 적다.  
단점: Apps Script 제약과 Google 종속성이 계속 남고 CORS 구성이 번거롭다.

### 방안 B: Cloudflare Worker와 D1으로 이전 — 권장

- `searchRecipes()` 로직을 Worker API로 이전
- 레시피와 기본조미료를 D1으로 이전
- Gemini 키를 Worker Secret으로 저장
- 사진은 R2에 저장
- 기존 Apps Script는 전환 완료까지 읽기 전용 백업으로 유지

장점: 프론트, API, DB, 사진 저장소가 Cloudflare에 통합된다.  
단점: 초기 데이터 이전 작업이 필요하다.

현재 프로젝트는 파일 2개와 시트 3개로 비교적 작기 때문에 방안 B가 장기적으로 더 단순하다.

## 6. 권장 Cloudflare 최종 구조

```text
Cloudflare Static Assets
├── 메인과 레시피 화면
└── 사진 갤러리 화면

Cloudflare Worker
├── POST /api/recipes/search
├── GET  /api/gallery
├── GET  /api/gallery/:id
├── POST /api/gallery
├── POST /api/gallery/:id/images
└── DELETE /api/gallery/:id

Cloudflare D1
├── recipes
├── pantry_items
├── search_cache
├── gallery_posts
└── gallery_images

Cloudflare R2
├── gallery/original/
└── gallery/thumbnail/
```

## 7. 누구나 사진 업로드할 때 필요한 보호장치

로그인 없이 누구나 업로드할 수 있게 하면 스팸, 불법 콘텐츠, 대용량 파일로 무료 사용량이 소진될 수 있다. 따라서 다음 보호장치를 필수로 적용한다.

- Cloudflare Turnstile 사람 확인
- IP 또는 브라우저 기준 업로드 횟수 제한
- JPEG, PNG, WebP만 허용
- 사진 한 장 최대 10MB
- 게시글 하나당 최대 10장
- 서버에서 실제 MIME 형식 확인
- UUID 기반 파일명 사용
- 신규 게시글을 `검토 대기` 상태로 저장하는 방안 검토
- 신고 및 관리자 삭제 수단
- 업로드 실패 및 미게시 임시 파일 자동 정리

초기 권장 정책:

```text
열람: 누구나
작성: 누구나 + Turnstile
수정/삭제: 작성할 때 발급한 관리 코드 또는 관리자
공개: 즉시 공개 대신 검토 후 공개 권장
```

## 8. 다음 실행 순서

1. [완료] Apps Script `Code.gs`와 `Index.html`을 로컬에 백업
2. [완료] Google Sheets 전체 문서를 Excel 파일로 백업
3. 로컬 Git 저장소 초기화
4. Cloudflare용 프로젝트 골격 생성
5. D1 스키마 작성
6. 레시피와 기본조미료 데이터 가져오기
7. Worker에 레시피 검색 API 이전
8. 기존 화면을 Cloudflare 프론트로 이전
9. R2 기반 사진 갤러리 구현
10. 테스트 후 기존 Apps Script 주소에서 Cloudflare 주소로 전환

## 9. 아직 필요한 결정

- 사용할 최종 도메인
- 갤러리 게시물 즉시 공개 또는 관리자 승인 후 공개
- 익명 작성자의 수정·삭제 방식
- 사진 원본 보관 여부
- 게시글 보관 및 삭제 정책
