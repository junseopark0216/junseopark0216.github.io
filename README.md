# Zune — 보안 기술 블로그 (Jekyll + GitHub Pages)

학습 및 포트폴리오 용으로 기록하는 보안 블로그. Jekyll로 만든 커스텀 테마이며,
GitHub Pages 기본 빌드로 배포됩니다.

## 카테고리 (과제 요건 6개)

| 폴더 | 이름 | 글의 `category` 값 |
|------|------|-----|
| `dev/`        | 개발            | `dev` |
| `ctf/`        | CTF/Wargame     | `ctf` |
| `bugbounty/`  | Bug Bounty      | `bugbounty` |
| `tech/`       | 블로그/기술문서 | `tech` |
| `paper/`      | 논문/컨퍼런스   | `paper` |
| `contest/`    | 공모전/자격증   | `contest` |

---

## 1. 글 쓰는 법

`_posts/` 폴더에 `YYYY-MM-DD-제목.md` 형식으로 파일을 만듭니다.
맨 위 머리말(front matter)에서 **`category`** 값만 위 표에 맞게 넣으면
해당 카테고리 페이지와 홈에 자동으로 나타납니다.

```markdown
---
title: "글 제목"
subtitle: "부제 (선택)"
date: 2026-10-28 21:00:00 +0900
category: ctf          # dev / ctf / bugbounty / tech / paper / contest 중 하나
tags: ["pwn", "heap"]  # 선택
---

여기에 본문을 Markdown으로 작성합니다.

## 소제목
이미지는 `assets/img/posts/` 에 넣고 아래처럼 불러옵니다.
![설명]({{ site.baseurl }}/assets/img/posts/파일이름.png)
```

- 목차(TOC)는 자동 생성됩니다. 끄려면 머리말에 `toc: false` 를 추가하세요.
- 글 주소는 `/카테고리/제목/` 형태가 됩니다. (예: `/ctf/locked-out/`)

### 카테고리 안에서 하위 분류로 나누기

일부 카테고리는 글의 `group` 값으로 상단 토글(분류 탭)이 갈립니다.
토글은 페이지에서 눌러 걸러볼 수 있고, `group` 을 안 넣어도 `전체` 에는 항상 나옵니다.

| category | group 값 → 탭 이름 |
|----------|-----|
| `ctf`     | `ctf` → CTF 라이트업, `wargame` → 워게임 |
| `tech`    | `blog` → 블로그, `doc` → 기술문서 |
| `paper`   | `paper` → 논문 리뷰, `conf` → 컨퍼런스 |
| `contest` | `contest` → 공모전, `cert` → 자격증 |

예시 (드림햄 등 상시 워게임):

```markdown
category: ctf
group: wargame
tags: ["Dreamhack", "pwnable"]   # 플랫폼 구분은 태그로 (검색에 유용)
```

- 탭 이름/추가·삭제는 `_data/categories.yml` 각 카테고리의 `groups:` 에서 바꿉니다.
- `개발(dev)`, `Bug Bounty(bugbounty)` 는 하위 분류가 없습니다.
  나누고 싶으면 `categories.yml` 의 해당 항목에 `groups:` 를 똑같이 추가하면 됩니다.

### 한 글에 한/영 토글 넣기 (선택)

한 글을 **한국어·영어 두 버전으로 함께** 쓰고 싶으면, 머리말에 `langs` 를 넣고
본문을 `<!--ko-->` / `<!--en-->` 주석으로 나눕니다. 글 상단에 `한국어/English`
토글이 생기고, 누르면 **페이지 이동 없이** 그 자리에서 언어가 바뀝니다.
(선택한 언어는 브라우저에 기억되고, 목차도 해당 언어로 다시 그려집니다.)

```markdown
---
title: "..."
category: ctf
langs: [ko, en]      # 맨 앞이 기본 언어. 이 줄이 없으면 토글도 없음(단일 언어)
---

공통으로 보여줄 내용(예: 문제 설명 이미지)은 맨 위, 구분자 앞에 둡니다.

<!--ko-->

## 보호 기법 확인
한글 본문...

<!--en-->

## Check security techniques
English body...
```

- **한 언어로만 쓸 거면** `langs` 줄과 `<!--ko-->/<!--en-->` 구분자를 빼면 됩니다. 그러면 토글이 안 생깁니다.
- 자동 번역이 아니라, 직접 쓴 두 버전을 전환하는 방식입니다. (코드·용어 정확도를 위해 의도된 설계)
- 구분자 앞(공통 영역)에 둔 내용은 어느 언어에서나 항상 보입니다.

## 2. 자기소개 · 메뉴 고치기

- **자기소개(About, 홈 소개)**: `_data/profile.yml` 한 파일만 고치면 됩니다.
  (이름, 한 줄 소개, 타임라인, 프로젝트, 스킬, 소셜 링크 등)
- **카테고리 설명**: `_data/categories.yml`
- **사이트 제목·설명·주소**: `_config.yml`
  - 배포 전 `url` 값을 본인 주소로 바꾸세요. (예: `https://junseopark0216.github.io`)
- **아바타**: `assets/img/avatar.jpg` 교체

## 3. 로컬에서 미리보기 (선택)

Ruby가 설치돼 있다면:

```bash
bundle install
bundle exec jekyll serve
# http://localhost:4000 에서 확인
```

## 4. 배포 (GitHub Pages)

이 저장소를 `사용자이름.github.io` 레포의 기본 브랜치에 올린 뒤,
**Settings → Pages → Build and deployment → Source** 를
`Deploy from a branch` / `main` / `/ (root)` 로 설정하면
GitHub이 Jekyll로 빌드해 자동 배포합니다.

> 기존 Hexo 블로그에서 바꾸는 경우: 배포 안내는 `DEPLOY.md` 를 참고하세요.

## 디자인 메모

- 색/간격 등 모든 토큰은 `assets/css/main.css` 상단 `:root` 에 모여 있습니다.
- 다크 모드 값은 `:root[data-theme="dark"]` 블록에서 덮어씁니다.
- 동작(다크모드, 검색 `Ctrl+K`, whoami 타이핑, 하프톤 배경, 목차)은 `assets/js/main.js`.
