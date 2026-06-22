// ─── 상수 ───────────────────────────────────────────────────────────────────
// 게임 보드 크기 (가로 10칸, 세로 20칸) — JS가 단일 기준
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 24;
const DROP_INTERVAL_MS = 800;

// 한 번에 삭제한 줄 수별 점수 (1~4줄)
const LINE_SCORES = [0, 100, 300, 500, 800];

// 테트로미노 블록 모양 정의 (1 = 채워진 칸)
const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const PIECE_TYPES = Object.keys(SHAPES);

const COLORS = {
  I: "piece-i",
  O: "piece-o",
  T: "piece-t",
  S: "piece-s",
  Z: "piece-z",
  J: "piece-j",
  L: "piece-l",
};

// ─── DOM 참조 ─────────────────────────────────────────────────────────────────
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const startButton = document.getElementById("start-btn");
const restartButton = document.getElementById("restart-btn");
const statusMessage = document.getElementById("status-message");

// ─── 게임 상태 ───────────────────────────────────────────────────────────────
let score = 0;
let isPlaying = false;
let isGameOver = false;
let board = createEmptyGrid();
let currentPiece = null;
let dropAnimationId = null;
let lastDropTime = 0;
let isKeyboardRegistered = false;

// ─── 보드 유틸리티 ───────────────────────────────────────────────────────────
function applyBoardDimensions() {
  const root = document.documentElement;
  root.style.setProperty("--cols", String(COLS));
  root.style.setProperty("--rows", String(ROWS));
  root.style.setProperty("--cell-size", `${CELL_SIZE}px`);
}

function createEmptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function initBoardDOM() {
  if (!boardElement || boardElement.children.length > 0) {
    return;
  }

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      boardElement.appendChild(cell);
    }
  }
}

function isCellOnBoard(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

// ─── 블록 생성·변형 ──────────────────────────────────────────────────────────
function copyShape(shape) {
  return shape.map((row) => [...row]);
}

function getSpawnRow(shape) {
  for (let rowOffset = 0; rowOffset < shape.length; rowOffset++) {
    if (shape[rowOffset].some((cell) => cell === 1)) {
      return -rowOffset;
    }
  }

  return 0;
}

function createPiece(type) {
  let pieceType = type;

  if (pieceType && !SHAPES[pieceType]) {
    console.warn(`알 수 없는 블록 타입: ${pieceType}. 무작위 블록을 사용합니다.`);
    pieceType = undefined;
  }

  pieceType = pieceType || PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  const shape = copyShape(SHAPES[pieceType]);
  const spawnCol = Math.floor((COLS - shape[0].length) / 2);

  return {
    type: pieceType,
    shape,
    row: getSpawnRow(shape),
    col: spawnCol,
  };
}

function rotateShape(shape) {
  const rowCount = shape.length;
  const colCount = shape[0].length;
  const rotated = Array.from({ length: colCount }, () => Array(rowCount).fill(0));

  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      rotated[col][rowCount - 1 - row] = shape[row][col];
    }
  }

  return rotated;
}

/**
 * 블록의 채워진 칸마다 콜백을 실행합니다.
 * @param {{ shape: number[][], row: number, col: number }} piece
 * @param {(row: number, col: number) => void} callback
 */
function forEachPieceCell(piece, callback) {
  piece.shape.forEach((rowCells, rowOffset) => {
    rowCells.forEach((filled, colOffset) => {
      if (filled) {
        callback(piece.row + rowOffset, piece.col + colOffset);
      }
    });
  });
}

/**
 * 이동량을 적용한 위치의 채워진 칸마다 콜백을 실행합니다.
 */
function forEachMovedPieceCell(piece, deltaCol, deltaRow, callback) {
  piece.shape.forEach((rowCells, rowOffset) => {
    rowCells.forEach((filled, colOffset) => {
      if (filled) {
        callback(
          piece.row + deltaRow + rowOffset,
          piece.col + deltaCol + colOffset
        );
      }
    });
  });
}

// ─── 충돌·이동 ───────────────────────────────────────────────────────────────
function canMove(piece, deltaCol, deltaRow, lockedBoard) {
  let canPlace = true;

  forEachMovedPieceCell(piece, deltaCol, deltaRow, (targetRow, targetCol) => {
    if (!canPlace) {
      return;
    }

    if (targetCol < 0 || targetCol >= COLS) {
      canPlace = false;
      return;
    }

    if (targetRow >= ROWS) {
      canPlace = false;
      return;
    }

    if (targetRow >= 0 && lockedBoard[targetRow][targetCol] !== null) {
      canPlace = false;
    }
  });

  return canPlace;
}

function hasActivePiece() {
  return isPlaying && currentPiece !== null;
}

function tryMovePiece(deltaCol, deltaRow) {
  if (!hasActivePiece()) {
    return false;
  }

  if (!canMove(currentPiece, deltaCol, deltaRow, board)) {
    return false;
  }

  currentPiece.col += deltaCol;
  currentPiece.row += deltaRow;
  return true;
}

function tryRotatePiece() {
  if (!hasActivePiece()) {
    return false;
  }

  const rotatedShape = rotateShape(currentPiece.shape);
  const rotatedPiece = {
    type: currentPiece.type,
    shape: rotatedShape,
    row: currentPiece.row,
    col: currentPiece.col,
  };

  if (!canMove(rotatedPiece, 0, 0, board)) {
    return false;
  }

  currentPiece.shape = rotatedShape;
  return true;
}

// ─── 고정·라인·점수 ──────────────────────────────────────────────────────────
function lockPiece(piece) {
  forEachPieceCell(piece, (targetRow, targetCol) => {
    if (isCellOnBoard(targetRow, targetCol)) {
      board[targetRow][targetCol] = piece.type;
    }
  });
}

function isRowFull(row) {
  return row.every((cell) => cell !== null);
}

function clearFullLines() {
  let linesCleared = 0;

  for (let row = ROWS - 1; row >= 0; row--) {
    if (!isRowFull(board[row])) {
      continue;
    }

    board.splice(row, 1);
    board.unshift(Array(COLS).fill(null));
    linesCleared++;
    row++;
  }

  return linesCleared;
}

function getLineScore(linesCleared) {
  return LINE_SCORES[linesCleared] || linesCleared * 100;
}

function addScore(linesCleared) {
  score += getLineScore(linesCleared);
  updateScoreDisplay();
}

function lockAndSpawn() {
  lockPiece(currentPiece);

  const linesCleared = clearFullLines();
  if (linesCleared > 0) {
    addScore(linesCleared);
  }

  spawnNextPiece(linesCleared);
  renderBoard();
}

function hardDrop() {
  if (!hasActivePiece()) {
    return;
  }

  while (tryMovePiece(0, 1)) {}

  lockAndSpawn();
}

function setPieceSpawnMessage(pieceType, linesCleared) {
  if (linesCleared > 0) {
    const points = getLineScore(linesCleared);
    setStatusMessage(
      `${linesCleared}줄 삭제! +${points}점 (총 ${score}점) · ${pieceType} 블록 생성`
    );
    return;
  }

  setStatusMessage(`${pieceType} 블록이 생성되었습니다.`);
}

function spawnNextPiece(linesCleared = 0) {
  const nextPiece = createPiece();

  if (!canMove(nextPiece, 0, 0, board)) {
    handleGameOver(nextPiece);
    return;
  }

  currentPiece = nextPiece;
  setPieceSpawnMessage(currentPiece.type, linesCleared);
}

// ─── 낙하 루프 ───────────────────────────────────────────────────────────────
function tick() {
  if (!hasActivePiece()) {
    return;
  }

  if (tryMovePiece(0, 1)) {
    renderBoard();
    return;
  }

  lockAndSpawn();
}

function dropLoop(timestamp) {
  if (!isPlaying) {
    dropAnimationId = null;
    return;
  }

  if (lastDropTime === 0) {
    lastDropTime = timestamp;
  }

  const elapsed = timestamp - lastDropTime;

  if (elapsed >= DROP_INTERVAL_MS) {
    lastDropTime = timestamp - (elapsed % DROP_INTERVAL_MS);
    tick();
  }

  dropAnimationId = window.requestAnimationFrame(dropLoop);
}

function startDropLoop() {
  stopDropLoop();
  lastDropTime = 0;
  dropAnimationId = window.requestAnimationFrame(dropLoop);
}

function stopDropLoop() {
  if (dropAnimationId !== null) {
    cancelAnimationFrame(dropAnimationId);
    dropAnimationId = null;
  }

  lastDropTime = 0;
}

// ─── 게임 상태 전환 ──────────────────────────────────────────────────────────
function handleGameOver(blockedPiece) {
  isPlaying = false;
  isGameOver = true;
  currentPiece = blockedPiece;
  stopDropLoop();
  updateButtonStates();
  updateBoardVisualState();
  renderBoard();
  setStatusMessage("게임 오버! 블록이 더 이상 들어갈 수 없습니다. 재시작 버튼을 눌러주세요.");
}

function resetGame() {
  stopDropLoop();
  score = 0;
  isPlaying = false;
  isGameOver = false;
  board = createEmptyGrid();
  currentPiece = createPiece("T");
  updateScoreDisplay();
  updateButtonStates();
  updateBoardVisualState();
  renderBoard();
  setStatusMessage("시작 버튼을 눌러 게임을 시작하세요.");
}

function startGame() {
  if (isPlaying) {
    return;
  }

  isPlaying = true;
  isGameOver = false;
  board = createEmptyGrid();
  currentPiece = createPiece();
  updateButtonStates();
  updateBoardVisualState();
  renderBoard();
  startDropLoop();
  setStatusMessage(`${currentPiece.type} 블록이 떨어지기 시작했습니다.`);
}

// ─── 렌더링 ──────────────────────────────────────────────────────────────────
function drawPiece(targetBoard, piece) {
  forEachPieceCell(piece, (targetRow, targetCol) => {
    if (isCellOnBoard(targetRow, targetCol)) {
      targetBoard[targetRow][targetCol] = piece.type;
    }
  });
}

function buildDisplayBoard() {
  const displayBoard = board.map((row) => [...row]);

  if (currentPiece) {
    drawPiece(displayBoard, currentPiece);
  }

  return displayBoard;
}

function getCellClassName(cellType) {
  return cellType ? `cell ${COLORS[cellType]}` : "cell";
}

function paintBoardCells(displayBoard) {
  const cells = boardElement.children;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = cells[row * COLS + col];
      cell.className = getCellClassName(displayBoard[row][col]);
    }
  }
}

function renderBoard() {
  initBoardDOM();

  if (!boardElement) {
    return;
  }

  paintBoardCells(buildDisplayBoard());
}

function updateBoardVisualState() {
  if (!boardElement) {
    return;
  }

  boardElement.classList.toggle("game-over", isGameOver);
}

// ─── UI 갱신 ─────────────────────────────────────────────────────────────────
function updateScoreDisplay() {
  if (scoreElement) {
    scoreElement.textContent = String(score);
  }
}

function setStatusMessage(message) {
  if (statusMessage) {
    statusMessage.textContent = message;
  }
}

function updateButtonStates() {
  if (startButton) {
    startButton.disabled = isPlaying;
  }
}

// ─── 입력 ────────────────────────────────────────────────────────────────────
function moveAndRender(deltaCol, deltaRow) {
  if (tryMovePiece(deltaCol, deltaRow)) {
    renderBoard();
  }
}

function softDropAndRender() {
  if (tryMovePiece(0, 1)) {
    renderBoard();
    return;
  }

  lockAndSpawn();
}

function handleKeyDown(event) {
  if (!hasActivePiece()) {
    return;
  }

  switch (event.code) {
    case "ArrowLeft":
      event.preventDefault();
      moveAndRender(-1, 0);
      break;
    case "ArrowRight":
      event.preventDefault();
      moveAndRender(1, 0);
      break;
    case "ArrowDown":
      event.preventDefault();
      softDropAndRender();
      break;
    case "ArrowUp":
      event.preventDefault();
      if (tryRotatePiece()) {
        renderBoard();
      }
      break;
    case "Space":
      event.preventDefault();
      hardDrop();
      break;
    default:
      break;
  }
}

function registerKeyboardControls() {
  if (isKeyboardRegistered) {
    return;
  }

  document.addEventListener("keydown", handleKeyDown);
  isKeyboardRegistered = true;
}

// ─── 초기화 ──────────────────────────────────────────────────────────────────
function initApp() {
  if (!boardElement || !scoreElement || !startButton || !restartButton || !statusMessage) {
    console.error("필수 DOM 요소를 찾을 수 없습니다. index.html을 확인하세요.");
    return;
  }

  applyBoardDimensions();
  registerKeyboardControls();
  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", resetGame);
  initBoardDOM();
  resetGame();
}

initApp();
