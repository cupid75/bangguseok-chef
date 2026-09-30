# CHIRO Web Design System

Version: 1.0
Status: Active
Primary style: Minimal / Vercel-inspired / Mobile First

---

## 1. Design Philosophy

치로 웹 디자인 시스템은 깔끔하고 정돈된 화면을 기본으로 한다.

핵심 목표는 다음과 같다.

- 불필요한 장식을 줄인다.
- 정보가 한눈에 들어오도록 한다.
- 모바일 사용성을 우선한다.
- 버튼과 입력창은 충분한 터치 영역을 확보한다.
- 검정, 흰색, 회색을 중심으로 색상을 제한한다.
- 화면마다 같은 여백, 같은 모서리, 같은 버튼 스타일을 사용한다.
- 30~60대 사용자도 편하게 읽을 수 있도록 지나치게 작은 글자를 사용하지 않는다.
- Vercel의 미니멀한 디자인 언어를 참고하되 브랜드 로고, 문구, 고유 디자인을 복제하지 않는다.

기본 인상:

> Simple · Clean · Reliable · Comfortable

---

# 2. Design Principles

## 2.1 Minimal

화면에 꼭 필요한 요소만 배치한다.

사용자가 해야 할 행동이 명확하다면 장식을 추가하지 않는다.

## 2.2 Mobile First

모바일 화면을 먼저 설계한다.

기본 화면 폭은 작은 스마트폰에서도 자연스럽게 표시되어야 한다.

## 2.3 Visual Hierarchy

정보의 중요도에 따라 크기와 굵기를 구분한다.

권장 순서:

1. 페이지 제목
2. 핵심 정보
3. 주요 행동 버튼
4. 보조 설명
5. 부가 정보

## 2.4 Consistency

같은 기능은 모든 화면에서 같은 모양을 사용한다.

예:

- 버튼 높이
- 입력창 높이
- 카드 모서리
- 색상
- 여백
- 글자 크기

---

# 3. Color System

## 3.1 Primary

```css
--color-primary: #111111;
--color-primary-hover: #333333;
```

주요 버튼, 제목, 핵심 텍스트에 사용한다.

## 3.2 Background

```css
--color-background: #ffffff;
--color-surface: #ffffff;
```

기본 배경은 흰색을 사용한다.

## 3.3 Text

```css
--color-text-primary: #171717;
--color-text-secondary: #666666;
--color-text-tertiary: #999999;
--color-text-disabled: #b5b5b5;
```

### 사용 기준

| 용도 | 색상 |
|---|---|
| 제목 | #171717 |
| 본문 | #171717 |
| 보조 설명 | #666666 |
| 비활성/부가 정보 | #999999 |
| Disabled | #B5B5B5 |

## 3.4 Border

```css
--color-border: #e5e5e5;
--color-border-light: #eeeeee;
--color-border-focus: #111111;
```

기본 테두리는 최대한 눈에 띄지 않게 한다.

## 3.5 Status Colors

상태 표현이 필요한 경우에만 사용한다.

```css
--color-success: #16803c;
--color-warning: #a15c00;
--color-error: #d1242f;
--color-info: #2563eb;
```

상태 색상을 화면 전체의 장식 색상으로 사용하지 않는다.

---

# 4. Typography

## 4.1 Font Family

기본적으로 시스템 폰트를 사용한다.

```css
font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
```

한글 환경에서는 브라우저와 운영체제의 기본 한글 폰트를 자연스럽게 사용한다.

## 4.2 Font Scale

| 용도 | 크기 | 굵기 |
|---|---:|---:|
| Page Title | 24~28px | 600 |
| Section Title | 18~20px | 600 |
| Card Title | 16~18px | 600 |
| Body | 15~16px | 400 |
| Button | 14~15px | 500 |
| Label | 14px | 500 |
| Caption | 12~13px | 400 |

모바일에서 본문을 13px 이하로 줄이지 않는다.

## 4.3 Letter Spacing

제목:

```css
letter-spacing: -0.4px;
```

본문:

```css
letter-spacing: 0;
```

한글 문장은 지나친 자간 축소를 피한다.

---

# 5. Spacing System

기본 간격 단위:

```css
4px
8px
12px
16px
20px
24px
28px
32px
40px
48px
64px
```

권장 사용:

| 상황 | 간격 |
|---|---:|
| 아이콘과 텍스트 | 8px |
| 입력창 내부 요소 | 12~14px |
| 항목 간 간격 | 12~16px |
| 카드 내부 | 20~28px |
| 섹션 간 | 32~48px |
| 주요 영역 간 | 48~64px |

---

# 6. Border Radius

기본적으로 작은 라운드를 사용한다.

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

권장:

- Input: 7~8px
- Button: 7~8px
- Card: 10~12px
- Modal: 12~16px

과도하게 둥근 Pill 형태는 특별한 목적이 있을 때만 사용한다.

---

# 7. Shadow

그림자는 매우 약하게 사용한다.

기본 카드:

```css
box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.03),
    0 1px 3px rgba(0, 0, 0, 0.04);
```

가능하면 테두리만으로 영역을 구분한다.

강한 그림자:

- 사용하지 않는다.
- 특별히 떠 있는 UI가 필요한 경우에만 제한적으로 사용한다.

---

# 8. Layout

## 8.1 Container

모바일:

```css
width: 100%;
padding: 20px;
```

일반 데스크톱:

```css
max-width: 1200px;
margin: 0 auto;
padding: 0 24px;
```

좁은 콘텐츠:

```css
max-width: 720px;
```

로그인/회원가입:

```css
max-width: 400px;
```

---

# 9. Mobile First

기본 CSS는 모바일 기준으로 작성한다.

```css
.container {
    width: 100%;
    padding: 20px;
}

@media (min-width: 768px) {
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
    }
}
```

모바일에서 가로 스크롤이 발생하지 않도록 한다.

---

# 10. Button

## 10.1 Primary Button

```css
.btn-primary {
    width: 100%;
    min-height: 44px;
    padding: 0 16px;

    border: 0;
    border-radius: 7px;

    background: #111111;
    color: #ffffff;

    font-size: 14px;
    font-weight: 500;

    cursor: pointer;
}
```

Hover:

```css
.btn-primary:hover {
    background: #333333;
}
```

Active:

```css
.btn-primary:active {
    transform: translateY(1px);
}
```

## 10.2 Secondary Button

```css
.btn-secondary {
    min-height: 44px;
    padding: 0 16px;

    border: 1px solid #e5e5e5;
    border-radius: 7px;

    background: #ffffff;
    color: #171717;

    font-size: 14px;
    font-weight: 500;
}
```

## 10.3 Button Rules

- 기본 터치 영역은 44px 이상
- Primary는 검정
- Secondary는 흰색 + 회색 테두리
- 버튼 문구는 짧고 명확하게
- 한 화면에서 Primary 버튼을 과도하게 사용하지 않는다.

---

# 11. Input

기본 입력창:

```css
.input {
    width: 100%;
    height: 44px;

    padding: 0 13px;

    border: 1px solid #d9d9d9;
    border-radius: 7px;

    background: #ffffff;
    color: #171717;

    font-size: 15px;

    outline: none;
}
```

Focus:

```css
.input:focus {
    border-color: #111111;
    box-shadow: 0 0 0 1px #111111;
}
```

Placeholder:

```css
.input::placeholder {
    color: #a3a3a3;
}
```

입력창은 모바일에서 손가락으로 쉽게 누를 수 있도록 최소 44px 높이를 유지한다.

---

# 12. Card

기본 카드:

```css
.card {
    background: #ffffff;

    border: 1px solid #eaeaea;
    border-radius: 12px;

    padding: 24px;

    box-shadow:
        0 4px 10px rgba(0, 0, 0, 0.03),
        0 1px 3px rgba(0, 0, 0, 0.04);
}
```

카드 안에 카드가 반복되는 구조는 가급적 피한다.

---

# 13. Form

Label:

```css
.form-label {
    display: block;
    margin-bottom: 8px;

    font-size: 14px;
    font-weight: 500;
}
```

Field 간격:

```css
.form-group {
    margin-bottom: 18px;
}
```

에러 메시지:

```css
.form-error {
    margin-top: 6px;

    color: #d1242f;
    font-size: 13px;
}
```

에러는 색상만으로 전달하지 않고 문구로도 설명한다.

---

# 14. Navigation

모바일에서는 복잡한 메뉴를 피한다.

권장:

- 로고
- 현재 페이지
- 핵심 행동
- 최소한의 메뉴

Header 기본 구조:

```text
[Logo]                  [Menu]
```

또는

```text
[←]  페이지 제목
```

상단 Header의 높이는 일반적으로 56~64px 범위에서 설계한다.

---

# 15. Login Page

기본 로그인 화면은 다음 구조를 권장한다.

```text
Logo

서비스명
짧은 설명

┌──────────────────────┐
│ 이메일               │
│ [                  ] │
│                      │
│ 비밀번호             │
│ [                  ] │
│                      │
│ [      로그인       ]│
│                      │
│          또는        │
│                      │
│ [ 게스트로 둘러보기 ]│
│                      │
│ 회원가입  비밀번호 찾기│
└──────────────────────┘

약관 안내
```

로그인 카드 폭:

```css
max-width: 400px;
```

모바일에서는 화면 좌우 여백을 약 20px 정도 확보한다.

---

# 16. Search UI

검색 화면에서는 검색창을 가장 중요한 요소로 취급한다.

권장 구조:

```text
페이지 제목

[ 지역을 검색하세요        🔍 ]

필터

┌─────────────────────┐
│ 검색 결과            │
│                     │
│ 결과 카드            │
│ 결과 카드            │
│ 결과 카드            │
└─────────────────────┘
```

검색 버튼과 검색창은 충분한 터치 영역을 확보한다.

---

# 17. List UI

목록은 모바일에서 한 항목씩 명확하게 구분한다.

예:

```text
┌─────────────────────┐
│ 제목                │
│ 보조 정보            │
│ 설명                │
└─────────────────────┘

┌─────────────────────┐
│ 제목                │
│ 보조 정보            │
│ 설명                │
└─────────────────────┘
```

불필요한 구분선과 아이콘을 줄인다.

---

# 18. Detail Page

상세 페이지는 다음 계층을 권장한다.

1. 대표 이미지
2. 제목
3. 핵심 정보
4. 상세 설명
5. 주요 행동
6. 부가 정보

핵심 행동 버튼은 사용자가 쉽게 찾을 수 있도록 한다.

---

# 19. Tables

모바일에서는 표를 그대로 축소하지 않는다.

열이 많다면:

- 핵심 정보만 남긴다.
- 가로 스크롤을 허용한다.
- 또는 카드형 목록으로 변경한다.

표 기본 스타일:

```css
table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    padding: 12px;
    border-bottom: 1px solid #eeeeee;
    text-align: left;
}

th {
    font-size: 13px;
    font-weight: 600;
}

td {
    font-size: 14px;
}
```

---

# 20. Modal

Modal은 꼭 필요한 경우에만 사용한다.

기본:

```css
.modal {
    width: min(400px, calc(100% - 40px));
    padding: 24px;

    background: #ffffff;

    border: 1px solid #e5e5e5;
    border-radius: 12px;

    box-shadow:
        0 12px 30px rgba(0, 0, 0, 0.08);
}
```

---

# 21. Icon

아이콘은 정보를 보조하는 용도로 사용한다.

아이콘만으로 중요한 행동을 표현하지 않는다.

가능하면:

```text
🔍 검색
```

보다

```text
검색
```

처럼 텍스트를 함께 제공한다.

아이콘 스타일이 화면마다 달라지지 않도록 하나의 아이콘 세트를 사용한다.

---

# 22. Images

이미지는 서비스 목적에 맞게 사용한다.

기본 원칙:

- 과도한 이미지 사용 금지
- 이미지가 정보 전달에 도움이 될 때 사용
- 카드 이미지 비율을 통일
- 이미지 모서리는 카드와 동일한 Radius 사용
- 이미지 위에 과도한 텍스트를 배치하지 않는다.

---

# 23. Accessibility

모든 주요 UI는 키보드와 터치 환경에서 사용할 수 있어야 한다.

필수 기준:

- 버튼과 입력창 최소 44px 터치 영역
- 충분한 색상 대비
- 이미지에는 적절한 `alt`
- 입력창에는 `label`
- 포커스 상태를 제거하지 않는다.
- 색상만으로 상태를 구분하지 않는다.
- `button`은 버튼 기능에 사용한다.
- 링크는 페이지 이동에 사용한다.

---

# 24. Interaction

애니메이션은 짧고 조용하게 사용한다.

권장:

```css
transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
```

피해야 할 것:

- 과도한 화면 전환
- 긴 애니메이션
- 계속 움직이는 장식
- 사용자의 행동을 방해하는 효과

---

# 25. Responsive Breakpoints

기본 기준:

```text
0 ~ 767px       Mobile
768 ~ 1023px    Tablet
1024px 이상     Desktop
```

단, 화면 설계에 따라 breakpoint는 조정할 수 있다.

---

# 26. Recommended CSS Variables

새 프로젝트에서는 다음 변수를 기본으로 사용할 수 있다.

```css
:root {
    --color-primary: #111111;
    --color-primary-hover: #333333;

    --color-background: #ffffff;
    --color-surface: #ffffff;

    --color-text-primary: #171717;
    --color-text-secondary: #666666;
    --color-text-tertiary: #999999;

    --color-border: #e5e5e5;
    --color-border-light: #eeeeee;
    --color-border-focus: #111111;

    --color-success: #16803c;
    --color-warning: #a15c00;
    --color-error: #d1242f;
    --color-info: #2563eb;

    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;

    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-7: 28px;
    --space-8: 32px;
    --space-9: 40px;
    --space-10: 48px;
    --space-11: 64px;
}
```

---

# 27. Component Checklist

새로운 화면을 만들 때 다음을 확인한다.

## Layout

- [ ] 모바일에서 먼저 자연스럽게 보이는가?
- [ ] 좌우 여백이 충분한가?
- [ ] 콘텐츠 폭이 지나치게 넓지 않은가?

## Typography

- [ ] 제목과 본문의 크기 차이가 명확한가?
- [ ] 본문 글자가 너무 작지 않은가?
- [ ] 중요한 정보가 먼저 보이는가?

## Components

- [ ] 버튼 높이가 충분한가?
- [ ] 입력창 높이가 충분한가?
- [ ] 카드 Radius가 통일되어 있는가?
- [ ] 테두리가 지나치게 진하지 않은가?

## Visual

- [ ] 색상이 지나치게 많지 않은가?
- [ ] 그림자가 과하지 않은가?
- [ ] 불필요한 아이콘이나 장식이 없는가?

## Accessibility

- [ ] 키보드로 사용할 수 있는가?
- [ ] 포커스 상태가 보이는가?
- [ ] 이미지에 alt가 있는가?
- [ ] 색상 외에도 상태를 알 수 있는가?

---

# 28. Default HTML Structure

새로운 모바일 웹 페이지를 시작할 때 권장하는 기본 구조:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>페이지 제목</title>

    <link rel="stylesheet" href="/css/common.css">
</head>

<body>

    <header>
        <!-- Header -->
    </header>

    <main>
        <!-- Page Content -->
    </main>

    <footer>
        <!-- Footer -->
    </footer>

    <script src="/js/common.js"></script>

</body>
</html>
```

---

# 29. Project Structure Recommendation

작은 프로젝트:

```text
/
├── index.html
├── login.html
├── signup.html
├── css/
│   └── common.css
├── js/
│   └── common.js
└── images/
```

조금 큰 프로젝트:

```text
/
├── index.html
├── login.html
├── signup.html
├── search.html
├── detail.html
├── mypage.html
│
├── css/
│   ├── common.css
│   ├── layout.css
│   └── components.css
│
├── js/
│   ├── common.js
│   └── app.js
│
└── images/
```

---

# 30. Design Decision Rule

새로운 디자인 요소가 필요할 때 다음 순서로 판단한다.

1. 기존 컴포넌트를 재사용할 수 있는가?
2. 기존 색상으로 표현할 수 있는가?
3. 기존 Radius와 간격으로 표현할 수 있는가?
4. 정말 새로운 UI가 필요한가?

새로운 스타일을 추가할 때는 기존 디자인 시스템과 충돌하지 않는지 확인한다.

---

# 31. Final Principle

치로 웹 디자인의 핵심은

> "많이 보여주는 것이 아니라, 필요한 것을 편하게 보여주는 것"

이다.

화려함보다 가독성,
장식보다 사용성,
복잡함보다 명확함을 우선한다.

새로운 웹사이트를 만들 때 별도의 디자인 요구가 없다면 이 DESIGN.md를 기본 디자인 기준으로 사용한다.

별도의 디자인 요구사항이 있다면 해당 요구사항을 우선하되, 가능한 범위에서 본 디자인 시스템의 색상, 간격, 타이포그래피, 컴포넌트 원칙을 유지한다.
