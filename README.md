# 테트리스 (교육용)

HTML, CSS, JavaScript만 사용하는 브라우저 테트리스 게임입니다.  
빌드 도구나 외부 라이브러리 없이 동작하며, GitHub Pages에 정적 배포할 수 있습니다.

## 프로젝트 소개

- **대상**: 프론트엔드 입문 수강생
- **기술 스택**: HTML, CSS, Vanilla JavaScript
- **보드 크기**: 10열 × 20행
- **블록**: I, O, T, S, Z, J, L (7종 테트로미노)

게임 보드, 자동 낙하, 키보드 조작, 줄 삭제, 점수, 게임 오버, 재시작까지 구현된 교육용 프로젝트입니다.

## 실행 방법

### 방법 1: 파일 직접 열기

1. 이 폴더를 파일 탐색기에서 엽니다.
2. `index.html`을 더블클릭하거나 브라우저 창에 끌어다 놓습니다.
3. **시작** 버튼을 눌러 게임을 시작합니다.

### 방법 2: Live Server (개발 시)

1. Cursor / VS Code에서 `index.html`을 엽니다.
2. 우클릭 후 **Open with Live Server**를 선택합니다.

### 방법 3: GitHub Pages (배포 후)

저장소 Settings → Pages에서 배포가 완료되면 아래 주소로 접속합니다.

```
https://<GitHub-사용자명>.github.io/<저장소-이름>/
```

## 조작법

게임 **시작** 후 키보드로 조작합니다. (시작 전·게임 오버 후에는 키 입력이 무시됩니다.)

| 키 | 동작 |
|---|---|
| ← (`ArrowLeft`) | 왼쪽 이동 |
| → (`ArrowRight`) | 오른쪽 이동 |
| ↓ (`ArrowDown`) | 한 칸 빠르게 내리기 (바닥·블록에 닿으면 고정) |
| ↑ (`ArrowUp`) | 시계 방향 90° 회전 (충돌 시 취소) |
| Space | 즉시 낙하 (Hard Drop) |

## 구현 기능

| 기능 | 설명 |
|---|---|
| 게임 보드 | 10×20 CSS Grid 격자 |
| 블록 생성 | 7종 테트로미노, 상단 중앙 스폰 |
| 자동 낙하 | 약 0.8초 간격 (`requestAnimationFrame`) |
| 충돌 판정 | `canMove()` — 벽, 바닥, 고정 블록 |
| 키보드 조작 | 좌우 이동, 회전, 소프트/하드 드롭 |
| 블록 고정 | 이동 불가 시 보드에 고정 후 새 블록 생성 |
| 줄 삭제 | 가득 찬 가로 줄 제거, 위 줄 하강 |
| 점수 | 1/2/3/4줄 삭제 시 100/300/500/800점 |
| 게임 오버 | 새 블록 스폰 불가 시 종료 |
| 재시작 | 보드·점수·타이머·상태 초기화 |

## 품질 점검 방법

배포 전 아래 항목을 브라우저에서 확인합니다.

1. **리소스 로드** — 개발자 도구(F12) → Network 탭에서 `style.css`, `script.js`가 200으로 로드되는지 확인
2. **콘솔 에러** — Console 탭에 빨간 에러가 없는지 확인
3. **기본 플레이** — 시작 → 낙하 → 좌우 이동 → 회전 → Space 하드 드롭
4. **줄 삭제·점수** — 가로 1줄을 채워 고정 후 줄 삭제 및 +100점 확인
5. **게임 오버** — 보드를 채운 뒤 오버 메시지·빨간 테두리 확인
6. **재시작** — 재시작 후 점수 0, 빈 보드, T 블록 미리보기 확인
7. **GitHub Pages** — 배포 URL에서 동일하게 동작하는지 확인 (로컬과 동일 경로 구조)

## GitHub Pages 배포 방법

### 1. Git 저장소 준비

```bash
git init
git add index.html style.css script.js README.md .gitignore
git commit -m "Initial commit: Tetris game for GitHub Pages"
git branch -M main
git remote add origin https://github.com/<사용자명>/<저장소-이름>.git
git push -u origin main
```

### 2. GitHub Pages 활성화

1. GitHub 저장소 → **Settings** → **Pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: `main` / Folder: **`/ (root)`**
4. **Save** 클릭

### 3. 배포 확인

- 1~2분 후 `https://<사용자명>.github.io/<저장소-이름>/` 접속
- 게임이 로드되고 **시작** 버튼이 동작하면 배포 완료

> **참고**: 이 프로젝트는 루트의 `index.html`을 진입점으로 사용합니다. `docs/` 폴더 배포를 쓰려면 파일을 `docs/`로 옮기거나 Pages 설정을 `/docs`로 변경해야 합니다.

## 파일 구조

```
tetris-cursor/
├── index.html   # 진입점 (GitHub Pages)
├── style.css    # 스타일
├── script.js    # 게임 로직
├── README.md    # 프로젝트 안내
└── .gitignore   # Git 제외 목록 (선택)
```

## 라이선스

교육용 프로젝트입니다. 자유롭게 학습·배포에 활용할 수 있습니다.
