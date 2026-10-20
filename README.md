# 방구석 요리사 — 보유 재료 기반 AI 레시피 추천 웹앱

냉장고에 있는 재료를 입력하면 만들 수 있는 요리를 추천하는 웹앱입니다. 기존 레시피 검색과 AI 생성을 결합해, 재료 입력부터 조리 방법 확인까지 한 화면에서 이어지도록 구현했습니다.

## 구현 목적

“집에 있는 재료로 무엇을 만들 수 있을까?”라는 일상적인 고민에서 출발했습니다. 요리 이름을 먼저 정하고 검색하는 대신, **지금 가진 재료를 기준으로 메뉴를 찾는 경험**을 만드는 것이 목표입니다.

별도 서버를 운영하는 부담을 줄이기 위해 Google Apps Script와 Google Sheets로 초기 서비스를 구성하고, Gemini API를 연결해 기존 데이터만으로 부족한 추천을 보완했습니다.

구현 과정에서는 다음 문제에 집중했습니다.

- **간단한 이용 흐름:** 재료 입력 → 최대 3개 레시피 추천 → 상세 조리 방법 확인으로 이어지도록 구성했습니다. 조리 시간, 인분, 필수 도구, 대체 재료와 알레르기 정보도 함께 보여줍니다.
- **AI 호출 최소화:** 임시 캐시와 시트에 저장한 이전 검색 결과, 기존 레시피를 우선 활용하고 추천 개수가 부족할 때만 AI를 호출합니다. 생성한 레시피는 저장해 다음 검색에서 재사용합니다.
- **동시 요청 처리:** 같은 검색이 동시에 들어왔을 때 중복 생성과 저장을 줄이도록 Apps Script의 잠금 기능을 사용했습니다.
- **모바일 이용 편의:** 작은 화면을 고려한 화면 구성, 검색 중 표시, 중복 검색 버튼 비활성화, 오류 안내를 적용했습니다.
- **설정값 분리:** Gemini API 키와 연결할 스프레드시트 ID는 소스에 직접 넣지 않고 Apps Script의 스크립트 속성에서 읽습니다.

기본 브랜치(`main`)에는 Google Apps Script 버전의 실행 소스와 설명 문서를 담았습니다. Cloudflare 이전 준비 작업은 [별도 브랜치](https://github.com/cupid75/bangguseok-chef/tree/codex/cloudflare-migration)에 보존했습니다. Cloudflare 버전의 레시피 검색 기능은 아직 이전 준비 단계입니다.

## 사용 기술

| 구분 | 기술 | 활용 내용 |
| --- | --- | --- |
| 사용자 화면 | HTML, CSS, JavaScript | 재료 입력, 추천 카드, 레시피 상세 화면과 모바일 레이아웃 |
| 화면·서버 연결 | `google.script.run` | 화면에서 서버의 레시피 검색 함수를 비동기로 호출 |
| 서버 처리 | Google Apps Script | 재료 정규화, 레시피 검색, AI 요청 및 결과 저장 |
| 데이터 저장 | Google Sheets | 레시피, 검색 결과 캐시, 기본 조미료 관리 |
| AI 연동 | Google Gemini API | 부족한 레시피 생성 및 JSON 형식의 결과 수신 |
| 캐시·동시 요청 제어 | `CacheService`, `LockService` | 반복 검색 결과 재사용 및 중복 작업 감소 |
| 설정 관리 | `PropertiesService` | API 키와 스프레드시트 연결 설정 분리 |
| 버전 관리 | Git, GitHub | 소스와 변경 이력 관리 |

기존 서비스의 주요 코드는 [서버 로직(Code.gs)](legacy-apps-script/Code.gs)와 [사용자 화면(Index.html)](legacy-apps-script/Index.html)에서 확인할 수 있습니다.

## 파일 구성

```text
README.md                       프로젝트 소개
legacy-apps-script/
├── Code.gs                      검색·캐시·AI·데이터 저장
└── Index.html                   화면·스타일·브라우저 동작
docs/
├── SETUP.md                     실행 환경 및 배포 방법
└── DEVELOPMENT.md               처리 흐름과 구현 과정
.gitignore                      비밀 설정·로컬 백업 등 업로드 제외
```

## 실행 방법과 구현 과정

이 앱은 Google Apps Script 환경에서 실행합니다. Google Sheets와 Gemini API 설정이 필요합니다.

- [실행 및 배포 방법](docs/SETUP.md): 소스 등록, 시트 구성, 설정값 입력, 웹앱 배포
- [구현 과정과 설계 선택](docs/DEVELOPMENT.md): 검색 처리 흐름, AI 호출 감소, 동시 요청 처리, 모바일 화면 보완

운영용 API 키와 Google Sheets 데이터는 저장소에 포함하지 않습니다.

## 사이트 바로가기

[방구석 요리사 이용하기 — Google Apps Script 웹앱](https://script.google.com/macros/s/AKfycbxFM_YwO2A-bOn5eEZfvsPfUqmvp5uZ0csxWjt1QZCGIPEH7b6jD0ns_pteamLISPgR/exec)
