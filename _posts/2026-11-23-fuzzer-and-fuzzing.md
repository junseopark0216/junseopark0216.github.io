---
title: "fuzzer와 fuzzing"
subtitle: "fuzzing 개념 학습 및 덤퍼저 구현 및 실습"
date: 2026-11-23 14:59:32 +0900
category: tech
group: doc
tags: ["Fuzzing", "Fuzzer", "Python"]
---

## 1. Fuzzing이란?

### 정의

**Fuzzing**은 프로그램에 무작위 또는 변이된 입력 데이터를 자동으로 반복 주입하여 비정상적인 동작(메모리 손상, 크래시, 무한 루프 등)을 유발하고, 소프트웨어의 안정성과 보안 취약점을 찾아내는 자동화 테스트 기법이다.

### 목적

개발자가 사전에 예상하지 못한 입력 조합을 빠르게 도출할 수 있으며, 소스 코드가 없는 상태에서도 컴파일된 바이너리만으로 테스트를 수행할 수 있다는 장점이 있다.

### Fuzzing의 3대 핵심 구성 요소

![image.png]({{ site.baseurl }}/assets/img/posts/fuzzer-and-fuzzing/01.png)

사진 출처: [https://velog.io/@156/Fuzzing에-대하여](https://velog.io/@156/Fuzzing%EC%97%90-%EB%8C%80%ED%95%98%EC%97%AC)

1. **TestCase Generator(입력 생성):** 대상 프로그램에 전달할 입력 데이터를 생성한다. 구조 파악 여부에 따라 무작위·변이 방식과 문법·구조 기반 방식으로 나뉜다.
2. **Worker(실행 및 감시):** 생성된 입력을 대상 프로그램에 전달해 실행하고, 반환 코드나 시그널, 타임아웃 등 이상 징후를 감시한다.
3. **Logger(기록 및 분석):** 크래시를 유발한 입력 케이스, 발생 시각, 시그널 정보, 커버리지 통계 등을 저장해 재현과 원인 분석을 돕는다.

### 주요 Fuzzing 기법 비교

- **무작위 기반 (Dumb Fuzzing):** 대상 입력 포맷이나 내부 로직을 고려하지 않고 무작위 바이트나 단순 변이 입력을 생성한다. 구현이 단순하지만, 헤더나 문법 검증이 엄격한 입력에서는 앞단에서 거부되어 깊은 내부 로직까지 도달하기 어렵다.
- **변이 기반 (Mutation-based Fuzzing):** 정상 입력(Seed)의 일부를 변경(Flip, Insert, Delete, Duplicate 등)해 새 입력을 만든다. 여기에 실행 결과를 피드백해 새로운 경로를 여는 입력을 남기는 **커버리지 가이드(Coverage-guided)** 방식이 결합되면 탐색 효율이 크게 높아진다.
- **생성 기반 (Generation-based Fuzzing):** 프로토콜이나 파일 포맷, 문법 규칙을 바탕으로 구조적으로 유효한 입력을 생성한다. 문법 오류로 인한 조기 탈락을 줄여 파서 이후의 처리 로직이나 상태 머신을 검증하는 데 유리하다.

## 2. Fuzzing 작동 원리

퍼징은 기본적으로 **입력 생성 → 대상 실행 → 상태·결과 판별 → 피드백 반영 및 기록**의 사이클을 빠른 속도로 반복한다.

### 기본 실행 루프

1. **초기 입력(Seed) 준비:** 정상 동작하는 샘플 파일이나 미리 정의된 입력, 혹은 무작위 바이트 데이터를 초기 입력으로 준비한다.
2. **입력 변이/생성:** 현재 보유한 입력을 바탕으로 바이트 flip/삽입/삭제/복제 등의 변이 연산을 적용해 새로운 테스트 케이스를 만든다.
3. **대상 프로그램 실행:** 생성한 입력을 파일이나 표준 입력, 인자 등으로 대상 프로그램에 전달하고 실행한다. 이때 무한 루프나 응답 지연을 막기 위해 타임아웃을 함께 둔다.
4. **이상 징후 판별:** 실행 종료 후 종료 코드, 시그널(`SIGSEGV`, `SIGABRT` 등), 타임아웃 여부를 검사한다. 비정상 종료나 메모리 오류 징후가 나타나면 크래시/이상 케이스로 분류해 입력과 로그를 저장한다.
5. **반복:** 결과를 기록한 뒤 다음 입력을 생성해 루프를 계속 이어간다.

### 커버리지 피드백 기반 탐색 흐름

단순 무작위/변이 퍼저는 같은 분기만 반복하기 때문에 비효율적일 수 있다. 커버리지 기반 퍼저는 이 루프 중간에 **경로 추적 피드백**을 넣는다.

- 대상 프로그램이 실행될 때 어떤 기본 블록(Basic Block)이나 엣지(Edge)를 지났는지 계측 정보로 수집한다.
- 기존에 없던 새로운 코드 경로를 발견한 입력은 흥미로운 입력(Interesting Seed)으로 판단해 코퍼스(Corpus)에 보관한다.
- 이후 변이 단계에서 보관된 입력을 다시 재료로 삼아, 파서 앞단을 넘긴 입력이 점차 더 깊은 분기까지 파고들도록 유도한다.

## 3. Fuzzer의 종류와 비교

퍼저는 대상 정보 접근 수준(**블랙박스 / 그레이박스 / 화이트박스**)에 따라 분류할 수 있으며, 실제 도구들은 이 분류를 바탕으로 각각 다른 강점과 활용 영역을 가진다.

- **블랙박스 퍼저 (Black-box Fuzzer):** 대상의 소스 코드나 내부 실행 경로 정보를 보지 않고 외부 입력과 출력, 크래시 여부만 관찰한다. 구현이 단순하고 대상 제약이 적지만, 깊은 조건 분기를 뚫는 효율은 낮을 수 있다.
- **그레이박스 퍼저 (Grey-box Fuzzer):** 컴파일러 계측이나 바이너리 계측/에뮬레이션 등을 통해 코드 커버리지 같은 가벼운 실행 정보를 피드백받아 입력 변이를 유도한다. 실무와 취약점 분석에서 가장 널리 쓰인다.
- **화이트박스 퍼저 (White-box Fuzzer):** 심볼릭 실행이나 동적 테인트 분석 등으로 프로그램 내부 분기 조건을 분석해 특정 경로에 도달하는 입력을 계산한다. 정밀도는 높지만 경로 폭발(Path Explosion) 문제로 계산 비용이 크다.

#### 대표 Fuzzer 비교표

| **구분** | **대표 도구** | **내부 정보 활용** | **커버리지 피드백** | **주요 특징 및 활용 맥락** |
| --- | --- | --- | --- | --- |
| **블랙박스** | 단순 덤퍼저, **Radamsa** | 없음 | 없음 | 입력 포맷이나 내부 상태 없이 바이트/구조 변이로 빠른 테스트 가능 |
| **그레이박스** | **AFL++** | 컴파일러 계측 등 | 있음 | 풍부한 변이 전략과 corpus 관리, 딕셔너리 기반의 범용 퍼징 강점 |
| **그레이박스** | **libFuzzer** | 인메모리 계측 | 있음 | 대상 함수/라이브러리를 프로세스 내 함수 호출 형태로 빠르게 퍼징 |
| **그레이박스** | **honggfuzz** | 하드웨어/계측 기반 | 있음 | 멀티스레드·하드웨어 피드백 등 다양한 환경의 취약점 탐색 지원 |
| **화이트박스** | **angr**, **KLEE** | 심볼릭·제약 분석 | 경로 탐색 기반 | 조건 분기 해를 직접 구할 수 있으나 대상 규모가 커지면 비용 급증 |

## 4. 덤퍼저

덤퍼저(Dumb Fuzzer)란 대상 입력 포맷이나 내부 로직에 대한 정보 없이, 무작위 데이터나 단순 바이트 변이 입력을 생성해 프로그램에 주입하는 퍼저를 말한다. 구조 파악이 필요 없어 구현이 빠르지만, 입력 검증이 엄격한 구간에서는 앞단에서 탈락하기 쉽다는 특징이 있다.

## 5. 덤퍼저 실습

대상 프로그램의 내부 구조를 가정하지 않는 블랙박스 관점에서 바이트 단위 변이 기반의 범용 덤퍼저(`fuzzer.py`)를 직접 구현해보았다.

### 설계 시 고려한 사항

- **환경 안정성:** 수만 회 이상 반복 실행되므로 이전 실행 잔여 파일이 남거나 무한 루프가 발생하면 퍼징이 멈출 수 있다. `subprocess.run(..., timeout=1)`로 지연·루프 프로세스를 강제 종료하고, `finally` 블록에서 임시 파일을 정리하도록 구성했다.
- **변이 범위 조절:** 변이율이 너무 높으면 입력 형식이 망가져 파서 앞단에서 즉시 탈락하고, 너무 낮으면 변화가 부족하다. 변이 비율(`0.1%` ~ `20%`)을 선택할 수 있게 했다.
- **크래시 탐지 및 기록:** 반환 코드의 음수 값(시그널 종료)을 확인해 `SIGSEGV`, `SIGABRT`, `SIGBUS`, `SIGILL`, `SIGFPE`를 크래시로 분류했다(`SIGINT`는 사용자 중단과 구분해 제외). 크래시 유발 입력은 타임스탬프를 붙여 `./crash` 디렉터리에 저장했다.

### 입력 생성 및 변이 로직

- **시드 기반 모드:** 시드 파일이 있으면 `bytearray`로 읽어 `flip`, `insert`, `delete`, `duplicate` 연산 중 하나를 선택해 변이율에 맞춰 변이를 수행한다.
- **무작위 기반 모드:** 시드 파일이 없을 경우 32바이트 무작위 바이트 데이터를 생성해 초기 입력으로 사용한다.
- **확장자 유연성:** 특정 확장자 제한을 두지 않고 시드 폴더 내 파일이나 확장자 필터를 유연하게 지정할 수 있게 했다.

### 구현 중 겪은 문제와 해결

- **WSL 경로 I/O 이슈 및 예외 처리:** `/mnt/c` 경로 사용 시 파일 입출력 예외가 발생할 수 있어 `try-except-finally` 구조로 예외를 흡수하고 임시 파일 삭제를 보장했다.
- **경로·확장자 유연성:** 타겟 경로, 시드 폴더, 확장자 필터를 사용자 입력으로 받아 고정 경로 의존도를 줄였다.
- **출력 오버헤드 감소:** 실행 시 표준 출력을 `subprocess.DEVNULL`로 돌려 콘솔 출력으로 인한 입출력 병목을 줄였다.

```python
# fuzzer.py

import subprocess
import random
import os
import shutil
import time
import signal

# Crash로 인정할 Signal 목록
CRASH_SIGNALS = {
    signal.SIGSEGV,  # Segmentation Fault
    signal.SIGABRT,  # Abort
    signal.SIGBUS,   # Bus Error
    signal.SIGILL,   # Illegal Instruction
    signal.SIGFPE    # Floating Point Exception
}

def Mutator(data, rate):
    """
    Mutation Operators
    - Flip
    - Insert
    - Delete
    - Duplicate
    """

    mutated = bytearray(data)

    if len(mutated) == 0:
        return bytes([random.randint(0, 255)])

    mutation_type = random.choice([
        "flip",
        "insert",
        "delete",
        "duplicate"
    ])

    # -------------------------
    # Byte Flip
    # -------------------------
    if mutation_type == "flip":

        num_flips = max(
            1,
            int(len(mutated) * rate)
        )

        for _ in range(num_flips):

            idx = random.randint(
                0,
                len(mutated) - 1
            )

            mutated[idx] = random.randint(
                0,
                255
            )

    # -------------------------
    # Byte Insert
    # -------------------------
    elif mutation_type == "insert":

        insert_count = max(
            1,
            int(len(mutated) * rate)
        )

        for _ in range(insert_count):

            pos = random.randint(
                0,
                len(mutated)
            )

            mutated.insert(
                pos,
                random.randint(0, 255)
            )

    # Byte Delete
    elif mutation_type == "delete":

        if len(mutated) > 1:

            delete_count = min(
                max(1, int(len(mutated) * rate)),
                len(mutated) - 1
            )

            for _ in range(delete_count):

                if len(mutated) <= 1:
                    break

                pos = random.randint(
                    0,
                    len(mutated) - 1
                )

                del mutated[pos]

    # Byte Duplicate
    elif mutation_type == "duplicate":

        if len(mutated) > 0:

            start = random.randint(
                0,
                len(mutated) - 1
            )

            max_len = min(
                16,
                len(mutated) - start
            )

            block_len = random.randint(
                1,
                max_len
            )

            block = mutated[
                start:start + block_len
            ]

            insert_pos = random.randint(
                0,
                len(mutated)
            )

            mutated[
                insert_pos:insert_pos
            ] = block

    return bytes(mutated)

def Fuzzing(
    target_bin,
    seeds,
    use_seed,
    rate,
    crash_dir,
    tmp_dir
):

    count = 0

    while True:

        count += 1

        # 시드 선택
        if use_seed:

            seed_path = random.choice(seeds)

            with open(seed_path, 'rb') as f:
                data = f.read()

        else:

            data = bytes(
                [random.randint(0, 255) for _ in range(32)]
            )

        # 변이 수행
        mutated_data = Mutator(
            data,
            rate
        )

        # 임시 입력 생성
        input_path = os.path.join(
            tmp_dir,
            f"fuzz_{time.time()}"
        )

        with open(input_path, 'wb') as f:
            f.write(mutated_data)

        try:

            # 실행
            proc = subprocess.run(
                [target_bin, "-s", input_path],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                timeout=1
            )

            # Crash 탐지
            if proc.returncode < 0:

                sig_num = -proc.returncode

                try:
                    sig_enum = signal.Signals(
                        sig_num
                    )

                except ValueError:
                    sig_enum = None

                if sig_enum in CRASH_SIGNALS:

                    crash_name = os.path.join(
                        crash_dir,
                        f"bug_{time.time()}.crash"
                    )

                    shutil.copy(
                        input_path,
                        crash_name
                    )

                    print(
                        f"\\n[!!!] CRASH DETECTED "
                        f"| Signal={sig_enum.name} "
                        f"| Saved={crash_name}"
                    )

        except subprocess.TimeoutExpired:
            pass

        except Exception as e:

            print(
                f"\\n[*] Error: {e}"
            )

        finally:

            try:

                if (
                    input_path
                    and os.path.exists(input_path)
                ):
                    os.remove(input_path)

            except OSError:
                pass

        # 상태 출력
        if count % 50 == 0:

            print(
                f"[*] 실행 횟수: {count}회 진행 중...",
                end='\\r'
            )

if __name__ == "__main__":

    target = input(
        "타겟 바이너리 경로: "
    )

    use_seed_input = input(
        "시드 파일을 사용하시겠습니까? (y/n): "
    ).lower()

    seeds = []
    use_seed = False

    if use_seed_input == 'y':

        seed_folder = input(
            "시드 파일 폴더 경로: "
        )

        ext = input(
            "시드 파일 확장자 입력 (전체 선택은 엔터): "
        )

        seeds = [
            os.path.join(seed_folder, f)
            for f in os.listdir(seed_folder)
            if f.endswith(ext)
            and os.path.isfile(
                os.path.join(seed_folder, f)
            )
        ]

        if not seeds:

            print(
                "[!] 오류: 해당 조건의 파일이 없습니다."
            )

            exit()

        use_seed = True

        print(
            f"[*] 시드 파일 {len(seeds)}개 발견"
        )

    else:

        print(
            "[*] 랜덤 데이터 기반 퍼징 모드 활성화"
        )

    choice = int(
        input(
            "변이 강도 선택 "
            "(1: 0.1%, 2: 1%, 3: 5%, 4: 10%, 5: 20%): "
        )
    )

    rates = {
        1: 0.001,
        2: 0.01,
        3: 0.05,
        4: 0.1,
        5: 0.2
    }

    os.makedirs(
        "./crash",
        exist_ok=True
    )

    os.makedirs(
        "./tmp",
        exist_ok=True
    )

    print(
        f"[*] Fuzzing 시작 | 타겟: {target}"
    )

    Fuzzing(
        target,
        seeds,
        use_seed,
        rates.get(choice, 0.01),
        "./crash",
        "./tmp"
    )
```

### 연습용 타겟을 통한 크래시 탐지 검증

구현한 `fuzzer.py`가 실제로 크래시를 탐지하고 저장하는지 확인하기 위해, 입력 길이를 초과해 스택 버퍼 오버플로우가 발생할 수 있는 간단한 C 테스트 바이너리(`vuln_test`)를 만들어 실행해 보았다.

```c
#include <stdio.h>
#include <string.h>

static void parse_input(const char *path) {
    FILE *fp = fopen(path, "rb");
    char buf[32];

    if (!fp) {
        return;
    }

    // 32바이트 버퍼를 초과해 읽을 수 있도록 작성한 테스트용 함수
    size_t n = fread(buf, 1, 256, fp);
    fclose(fp);

    if (n > 0) {
        printf("read %zu bytes\n", n);
    }
}

int main(int argc, char **argv) {
    if (argc == 3 && strcmp(argv[1], "-s") == 0) {
        parse_input(argv[2]);
    }
    return 0;
}
```

![image.png]({{ site.baseurl }}/assets/img/posts/fuzzer-and-fuzzing/02.png)

랜덤 데이터 기반 퍼징 모드(`n`)와 변이 강도 `3`(`5%`)으로 `./vuln_test`를 대상으로 실행한 결과, `SIGSEGV`가 발생하면서 `./crash/bug_<timestamp>.crash` 형태로 크래시 입력 파일이 정상 저장되는 것을 확인했다.

![image.png]({{ site.baseurl }}/assets/img/posts/fuzzer-and-fuzzing/03.png)

> `./crash` 폴더에 저장된 크래시 입력 파일을 확인해 보면, 임의 바이트와 복제된 블록이 섞인 바이너리 데이터가 그대로 남아 있어 실제 크래시 유발 입력이 저장되었음을 확인할 수 있다.
> 

이번에 만든 연습용 타겟(`vuln_test`)처럼 입력 포맷 제약이 약하고 버퍼 길이 초과만으로 크래시가 발생하는 단순한 환경에서는 바이트 단위 덤퍼저로도 빠르게 크래시를 잡아낼 수 있다.

하지만 일반적인 프로그램이나 구조화된 입력을 다루는 환경으로 넘어가면 덤퍼저 특유의 한계가 나타난다.

- **구조·인코딩 훼손:** 정해진 포맷이나 멀티바이트 문자·토큰 규칙을 요구하는 입력에 무작위 바이트 변이를 가하면 파싱 앞단에서 탈락하기 쉽다.
- **피드백 부재:** 실행 경로 피드백이 없기 때문에 특정 조건 분기나 깊은 내부 로직으로 탐색을 유도하는 데 한계가 있다.

---
