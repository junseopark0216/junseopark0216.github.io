# 배포 가이드 — 기존 Hexo 블로그를 이 Jekyll 블로그로 교체하기

현재 `junseopark0216.github.io` 레포는 Hexo로 되어 있습니다.
(소스가 `main`, 빌드 결과가 `gh-pages` 브랜치)
아래 순서대로 하면 이 Jekyll 블로그로 안전하게 바꿀 수 있습니다.

> ⚠️ 바꾸기 전에 기존 레포를 통째로 백업해 두는 걸 권합니다.
> (레포를 zip으로 내려받거나, 로컬 클론을 따로 복사)

## 방법 A — GitHub Pages 기본 빌드 (가장 간단, 추천)

1. **`_config.yml` 의 `url` 수정**
   ```yaml
   url: "https://junseopark0216.github.io"
   baseurl: ""
   ```

2. **`main` 브랜치의 기존 Hexo 파일을 이 블로그 파일로 교체**
   - 로컬에서 기존 클론의 내용을 지우고(`.git` 폴더는 남김) 이 폴더 내용을 복사하거나,
   - 깨끗하게 새로 밀어 넣습니다:
     ```bash
     cd zune-blog
     git init
     git add .
     git commit -m "Switch blog to custom Jekyll theme"
     git branch -M main
     git remote add origin https://github.com/junseopark0216/junseopark0216.github.io.git
     git push -f origin main
     ```

3. **GitHub에서 Pages 소스 변경**
   - 레포 → **Settings → Pages**
   - **Build and deployment → Source** 를 `Deploy from a branch` 로
   - 브랜치 `main` / 폴더 `/ (root)` 선택 → Save
   - (기존 `gh-pages` 브랜치는 더 이상 쓰지 않으니 나중에 삭제해도 됩니다.)

4. 1~2분 뒤 `https://junseopark0216.github.io` 에서 새 블로그 확인.

## 방법 B — GitHub Actions 로 빌드 (플러그인 자유롭게 쓰고 싶을 때)

이 레포에 `.github/workflows/pages.yml` 이 들어 있습니다.
Settings → Pages → Source 를 **GitHub Actions** 로 선택하면,
push 할 때마다 Actions가 Jekyll로 빌드해서 배포합니다.
(기본 Pages가 허용하지 않는 플러그인을 추가하고 싶을 때 이 방법을 쓰세요.)

## 이전된 기존 글

Hexo에 있던 두 글을 그대로 옮겨 두었습니다.
- `_posts/2026-08-23-brunnerctf-2026-locked-out.md`
- `_posts/2026-08-23-brunnerctf-2026-stocks.md`

둘 다 `category: ctf` 로 설정되어 **CTF/Wargame** 카테고리에 들어갑니다.
본문 이미지(22장)는 `assets/img/posts/` 에 함께 넣어 두었습니다.

> 이미지 경로는 Hexo의 `/images/...` 에서 `{{ site.baseurl }}/assets/img/posts/...`
> 로 바꿔 두었습니다.
