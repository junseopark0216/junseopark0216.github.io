---
title: "보안 이슈 데일리 클리핑"
subtitle: "매일 X에서 모은 보안 뉴스"
date: 2026-11-06 20:30:00 +0900
category: tech
group: blog
tags: ["보안뉴스", "클리핑", "daily"]
---

매일 X에 올라오는 **최신 보안 이슈**를 한 곳에 모은다. 

*최근 업데이트: {{ site.time | date: "%Y-%m-%d" }}*

> **규칙** — 하루 최소 1건, 월 최소 28건. 새로 추가한 건은 각 월 블록의 **맨 위**에 쌓는다(최신이 위로).

---

## 2026년 11월

### 11/20

- [phpAfterShell — CVE-2026-126714(CVSS v4.0 9.2): PHP 기본 파일 기반 세션 핸들러 결함, 10월 PHP2Shell 패치를 우회하고 별도 PHP 버그와 엮어 인증 없이 원격 코드 실행, 11/19 연구진 공개·시연](https://x.com/The_Cyber_News/status/2123600465673785672)
- [VMware vCenter 등 취약점 5건 패치(VMSA-2026-0009) — 최고 위험 CVE-2026-123890(CVSS 9.8): VMware Directory Service 인증 우회로 네트워크 접근만 있으면 로그인 없이 vCenter 장악, vCenter·SDDC Manager·VMware Tools 대상 CVSS 6.7~9.8, 우회책 없음, Broadcom 11/19 공개](https://x.com/The_Cyber_News/status/2123524464985964963)

### 11/19

- [PHP 보안 업데이트 사전 예고 — 11/19 14:00~14:30 UTC(한국 시간 23:00~23:30) 지원 중인 모든 PHP 브랜치에 패치 배포, 최고 심각도 Critical, 다만 Critical 이슈는 기본값이 아닌 설정이나 흔치 않은 구성에서만 악용 가능, 미리 준비해 두고 나오는 즉시 설치 권고(정기 4주 릴리스 주기)](https://x.com/The_Cyber_News/status/2123233606986551773)
- [NGINX HTTP/2 취약점 2건 — CVE-2026-123633·CVE-2026-123007(Critical): 메모리 손상으로 인증 없이 원격 코드 실행 가능, 둘 다 HTTP/2 클라이언트 연결 허용 시 해당, 하나는 일부 리버스 프록시 구성, 다른 하나는 정적 파일만 서빙하는 서버도 영향, 11/18 공개](https://x.com/The_Cyber_News/status/2123087843518296424)

### 11/18

- [Apache HTTP Server 취약점 악용 중 — CVE-2026-119618(CVSS 3.1 8.1): mod_http2 결함으로 인증 없이 원격 코드 실행, 11/11 2.4.71에서 수정, 싱가포르 CSA가 11/17 실제 악용·공개 PoC 존재 경고(피해 규모 미공개)](https://x.com/The_Cyber_News/status/2122929041464570334)
- [Perforce Puppet Enterprise 취약점 악용 중 — CVE-2026-115731(CVSS 4.0 9.4): 취약한 Puppet Server에서 Puppet 서비스 계정 권한으로 코드 실행, 11/3 공개, CISA가 11/17 KEV 등재, 미 연방 민간기관 12/1까지 조치](https://x.com/The_Cyber_News/status/2123024450417549750)

### 11/17

- [Google GTIG·Mandiant AI Threat Tracker — 공격자가 챗봇 활용을 넘어 AI 에이전트로 스캔·침투·내부 확산까지 사람 개입 거의 없이 자동화, 사이버범죄·스파이·영향력 공작 전반에서 AI 악용이 "임계 변곡점" 도달, 공격 시간 단축·규모 확대·다단계 침입을 기계 속도로 수행(11/16 발표)](https://x.com/The_Cyber_News/status/2122434785108771314)
- [Optimizely Web 공급망 공격 — 11/16 실험 플랫폼에 악성 JavaScript가 심겨 Zoom·BBC·CNN·Salesforce·GitLab·IKEA·HSBC·Equifax·Air France-KLM·Ledger·Peacock 등 178개 조직 사이트 방문자에게 유포, 암호화폐 지갑 주소 바꿔치기·결제 카드 정보 탈취·쿠키·스크린샷 수집, iPhone·iPad 사용자에게 Coruna·DarkSword 익스플로잇 킷 배포](https://x.com/The_Cyber_News/status/2122506787614245103)

### 11/16

- [Claude Code로 1994년식 Jeep Cherokee ECU 리버스 엔지니어링 — OBD2 포트가 없는 구형 ECU가 크라이슬러 구형 SCI 프로토콜을 쓴다는 걸 파악, $3 Arduino Nano로 내부 코드를 읽고 복사한 뒤 실행까지 성공(약 1주), NOx 과다로 떨어졌던 캘리포니아 배출가스 검사 통과](https://x.com/The_Cyber_News/status/2122152438815920160)

### 11/15

- [FBI FLASH 경보 — 공격자가 오픈소스 보안 테스트 프레임워크 ARTEX(Go, 외부 LLM을 연결해 지시를 명령으로 변환) AI 에이전트로 네트워크 공격 자동화, 탈취 계정·노출 앱·클라우드 권한을 엮어 일부는 3시간 안에 특권 접근 획득(11/13 발표)](https://x.com/The_Cyber_News/status/2121786067217183153)
- [M365 장애 악용 피싱 진행 중 — 11/12 Microsoft 365 장애를 미끼로 MS 서비스 상태 공지를 흉내 내고 실제 Exchange Online 장애 번호 EX1550543을 인용, "장애 중 보류된 메일을 복구하지 않으면 24시간 안에 삭제된다"며 가짜 복구 링크로 비밀번호 탈취, Microsoft Threat Intelligence가 11/13 탐지](https://x.com/The_Cyber_News/status/2121569566749044901)


### 11/14

- [Check Point Gaia OS 0-day 악용 중 — CVE-2026-123039(CVSS 7.8): DynamicCLI 서비스 결함으로 로컬 사용자가 root 권한 획득, 방화벽·관리 시스템 위험, 고객 수십 곳 대상 실제 악용 확인, CISA KEV 등재(11/13)](https://x.com/The_Cyber_News/status/2121502390960414879)

### 11/13

- [Europol Operation Endgame — Gootloader·CastleRAT·StealC 인프라 무력화, 서버 235대·도메인 257개 차단, 피해자 데이터셋 640만 건 회수(랜섬웨어 초기 침투·정보 탈취용 서비스형 사이버범죄 겨냥)](https://x.com/The_Cyber_News/status/2120925296681783789)
- [Microsoft 365 대규모 장애 — 11/12 미주 Exchange Online 메일함 접속 장애로 시작해 Outlook·Teams·SharePoint·Copilot·Defender XDR로 확산, 10시간 넘게 지속, 복구된 서버가 트래픽 재개 시 다시 먹통·완전 복구 시점 미정](https://x.com/The_Cyber_News/status/2121128140366098654)

### 11/12

- [Node.js 보안 결함 16건 패치 — CVE-2026-123864(High): 0-length TLS write가 유발한 UAF·OOB read로 인증 없이 타 연결 메모리(TLS 개인키 등) 유출, v22.23.5/v24.22.3/v26.13.1에서 수정](https://x.com/The_Cyber_News/status/2120723250011607191?s=46)
- [Ubuntu 26.10(Stonking Stingray), curl에 인증서 폐기(revocation) 검사 추가 — 폐기된 SSL 인증서 HTTPS 연결 차단, upki 지원 도입](https://x.com/The_Cyber_News/status/2120569228508254284)

### 11/11

- [Outlook 0-day 악용 중 — 특수 제작 메시지 파일을 열면 외부 콘텐츠 경고 없이 공격자 네트워크에 연결돼 Windows 인증 해시 유출, 계정·사전 접근 불필요](https://x.com/the_cyber_news/status/2120411774860378507?a=gn_AX65BRFOBiAwyr6Y&s=46)

### 11/10

- [Notepad++ 8.9.9 — 취약점 6건 패치(CVE 미할당), WM_COPYDATA 기반 조건부 플러그인 명령 실행·메모리 노출·버퍼 오버플로 등 수정](https://x.com/The_Cyber_News/status/2119841449709883738)

### 11/09

- [React Server Components 인증 불필요 RCE(GHSA-xqc2-xf4c-x3h3) — 로그인 없이 원격 코드 실행, CVSS v4 9.5(Critical), react-server-dom-webpack/parcel/turbopack 영향 (악용 조건은 까다로움)](https://x.com/The_Cyber_News/status/2119713352507335105?s=12)

### 11/08

- [ChatGPT Lockdown Mode 우회 취약점 — Check Point 발견, 숨은 팝업 트릭으로 사용자 모르게 전체 대화 기록 탈취·가짜 창·멀웨어 유포 가능 (ChatGPT Classic 데스크톱 앱)](https://x.com/the_cyber_news/status/2119247150672695322)

### 11/07

- [WordPress 코어 인증 불필요 RCE(CVE-2026-119977) — 로그인 없이 코드 실행 가능, 패치 당일부터 24만 건+ 공격 시도, CVSS 8.1(High), 미패치 4.7~7.1.3 영향](https://x.com/The_Cyber_News/status/2118970448402952590?s=46)

### 11/06

- [Microsoft Paint 0-click 취약점(CVE-2026-83844) — OOB read로 사용자 상호작용 없이 원격 코드 실행 가능, CVSS 8.1(High), Paint 11.2605.91.0에서 패치](https://x.com/the_cyber_news/status/2118513873972277757)
