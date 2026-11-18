---
title: "Space Alone 올클리어"
subtitle: "Pwnable · 시스템해킹 · Ch.1~10 올클리어"
date: 2026-10-28 21:00:00 +0900
category: ctf
group: wargame
tags: ["pwn", "pwnable", "wargame"]
---

HSpace의 시스템해킹 워게임 **Space Alone**을 Ch.1부터 Ch.10까지 전부 클리어하며 정리한 라이트업이다. 스택 오버플로우 기초부터 ROP·ret2libc·포맷 스트링까지 단계별로 다룬다.

> 대상 워게임: [hspace-io/Space_Alone](https://github.com/hspace-io/Space_Alone)

아래에서 챕터를 선택하면 해당 풀이가 새 창으로 열린다.

**챕터 바로가기**

<nav class="chapter-index" aria-label="챕터 바로가기">
  <a href="/ctf/space-alone/ch1/" target="_blank" rel="noopener"><b>Ch.1</b><span>오버플로우로 스택 변수 변조 → admin 계정으로 로그인 → 클리어.</span></a>
  <a href="/ctf/space-alone/ch2/" target="_blank" rel="noopener"><b>Ch.2</b><span>셸코드 주입 → 오버플로우로 셸코드를 스택에서 실행 → 셸코드가 setreuid로 권한을 고정하고 /bin/sh 실행 → 다음 챕터(Breaking) 셸 획득 → 클리어.</span></a>
  <a href="/ctf/space-alone/ch3/" target="_blank" rel="noopener"><b>Ch.3</b><span>오버플로우로 리턴 주소를 win함수로 덮어 → system(&quot;/bin/sh&quot;) 실행 → 다음 유저(Scavening) 셸 획득 → 클리어.</span></a>
  <a href="/ctf/space-alone/ch4/" target="_blank" rel="noopener"><b>Ch.4</b><span>read() 오버플로우(NX 때문에 셸코드 실행 불가) → ROP 체인으로 system(&quot;/bin/sh&quot;) 호출. libc는 유출(&amp;read)로 주소 계산. → 셸 획득</span></a>
  <a href="/ctf/space-alone/ch5/" target="_blank" rel="noopener"><b>Ch.5</b><span>목표: setuid 바이너리 ips(소유자 = 다음 유저 Crisis_at_the_Vault)를 익스플로잇해서</span></a>
  <a href="/ctf/space-alone/ch6/" target="_blank" rel="noopener"><b>Ch.6</b><span>canary leak &amp; libc leak → libc base → libc gadget exploit</span></a>
  <a href="/ctf/space-alone/ch7/" target="_blank" rel="noopener"><b>Ch.7</b><span>OOB write(임의 쓰기)로 __stack_chk_fail@got를 덮어 카나리를 우회 → startup BOF로 ROP → puts(puts@got)로 libc leak → system(&quot;/bin/sh&quot;)</span></a>
  <a href="/ctf/space-alone/ch8/" target="_blank" rel="noopener"><b>Ch.8</b><span>FSB 이용 → printf@got 주소에 win 함수 덮기</span></a>
  <a href="/ctf/space-alone/ch9/" target="_blank" rel="noopener"><b>Ch.9</b><span>ret2libc( loop 우회)</span></a>
  <a href="/ctf/space-alone/ch10/" target="_blank" rel="noopener"><b>Ch.10</b><span>포맷 스트링(%n)으로 파일 출력 우회 → 임의 주소 쓰기</span></a>
</nav>