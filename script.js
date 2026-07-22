const menuToggle = document.querySelector('.menu-toggle');
const primaryMenu = document.querySelector('#primary-menu');

if (menuToggle && primaryMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = primaryMenu.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  primaryMenu.addEventListener('click', (event) => {
    if (event.target.matches('a')) {
      primaryMenu.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const canvas = document.querySelector('#game-board');
const startButton = document.querySelector('#start-game');
const pauseButton = document.querySelector('#pause-game');
const restartButton = document.querySelector('#restart-game');
const scoreOutput = document.querySelector('#score');
const highScoreOutput = document.querySelector('#high-score');
const healthOutput = document.querySelector('#health');
const feverStatusOutput = document.querySelector('#fever-status');
const statusOutput = document.querySelector('#game-status');
const directionButtons = document.querySelectorAll('[data-direction]');
const gamePanel = document.querySelector('.game-panel');
const context = canvas ? canvas.getContext('2d') : null;

const BOARD_SIZE = 20;
const CELL_SIZE = 20;
const TICK_MS = 150;
const START_HEALTH = 3;
const FEVER_ITEM_MIN_MS = 20000;
const FEVER_ITEM_MAX_MS = 30000;
const FEVER_DURATION_TICKS = Math.ceil(6000 / TICK_MS);
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const keyDirections = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

let snake = [];
let food = null;
let feverItem = null;
let enemies = [];
let direction = directions.right;
let nextDirection = directions.right;
let score = 0;
let health = START_HEALTH;
let highScore = readHighScore();
let gameTimer = null;
let enemyTimer = null;
let feverSpawnTimer = null;
let feverTicksRemaining = 0;
let isRunning = false;
let isPaused = false;
let touchStart = null;
let pickupEffects = [];
const prefersReducedMotion = typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function readHighScore() {
  try {
    return Number.parseInt(localStorage.getItem('jw-koo-worm-high-score') || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore() {
  try {
    localStorage.setItem('jw-koo-worm-high-score', String(highScore));
  } catch {
    // 최고 점수 저장이 제한된 환경에서도 게임은 계속할 수 있다.
  }
}

function samePosition(first, second) {
  return first.x === second.x && first.y === second.y;
}

function isOccupied(position) {
  return snake.some((segment) => samePosition(segment, position))
    || enemies.some((enemy) => samePosition(enemy, position))
    || (food && samePosition(food, position))
    || (feverItem && samePosition(feverItem, position));
}

function randomPosition() {
  const available = [];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!isOccupied({ x, y })) available.push({ x, y });
    }
  }
  return available.length ? available[Math.floor(Math.random() * available.length)] : null;
}

function spawnFood() {
  food = randomPosition();
}

function spawnFeverItem() {
  if (!isRunning || isPaused || feverItem || feverTicksRemaining > 0) return;
  feverItem = randomPosition();
  if (feverItem) setStatus('피버 아이템이 나타났습니다.');
  draw();
}

function spawnEnemy() {
  const difficulty = getDifficultyLevel();
  if (!isRunning || isPaused || enemies.length >= difficulty + 1) return;
  const position = randomPosition();
  if (position) enemies.push({ ...position, direction: randomEnemyDirection() });
}

function getDifficultyLevel() {
  return Math.min(4, 1 + Math.floor(score / 50));
}

function randomEnemyDirection() {
  const options = Object.values(directions);
  return options[Math.floor(Math.random() * options.length)];
}

function scheduleEnemy() {
  window.clearTimeout(enemyTimer);
  if (!isRunning || isPaused) return;
  enemyTimer = window.setTimeout(() => {
    spawnEnemy();
    scheduleEnemy();
  }, Math.max(5000, 12000 - getDifficultyLevel() * 1500) + Math.floor(Math.random() * 2001));
}

function scheduleFeverItem() {
  window.clearTimeout(feverSpawnTimer);
  if (!isRunning || isPaused || feverItem || feverTicksRemaining > 0) return;
  const delay = FEVER_ITEM_MIN_MS + Math.floor(Math.random() * (FEVER_ITEM_MAX_MS - FEVER_ITEM_MIN_MS + 1));
  feverSpawnTimer = window.setTimeout(() => {
    spawnFeverItem();
    scheduleFeverItem();
  }, delay);
}

function clearTimers() {
  window.clearInterval(gameTimer);
  window.clearTimeout(enemyTimer);
  window.clearTimeout(feverSpawnTimer);
  gameTimer = null;
  enemyTimer = null;
  feverSpawnTimer = null;
}

function clearPickupEffects() {
  pickupEffects = [];
}

function createPickupEffect(position) {
  pickupEffects.push({ ...position, age: 0, lifetime: prefersReducedMotion ? 1 : 10 });
}

function updatePickupEffects() {
  pickupEffects = pickupEffects
    .map((effect) => ({ ...effect, age: effect.age + 1 }))
    .filter((effect) => effect.age < effect.lifetime);
}

function updateScore() {
  scoreOutput.textContent = String(score);
  highScoreOutput.textContent = String(highScore);
  healthOutput.textContent = String(health);
  updateFeverStatus();
}

function updateFeverStatus() {
  if (!feverStatusOutput || !gamePanel) return;
  const active = feverTicksRemaining > 0;
  gamePanel.classList.toggle('is-fever', active);
  feverStatusOutput.textContent = active
    ? `${Math.ceil((feverTicksRemaining * TICK_MS) / 1000)}초`
    : (feverItem ? '아이템' : '대기');
}

function setStatus(message) {
  statusOutput.textContent = message;
}

function resetGame() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  direction = directions.right;
  nextDirection = directions.right;
  feverItem = null;
  feverTicksRemaining = 0;
  enemies = [];
  score = 0;
  health = START_HEALTH;
  clearPickupEffects();
  spawnFood();
  updateScore();
  draw();
}

function startLoop() {
  window.clearInterval(gameTimer);
  gameTimer = window.setInterval(tick, TICK_MS);
  scheduleEnemy();
  scheduleFeverItem();
}

function startGame() {
  if (isRunning && !isPaused) return;
  if (!isRunning) resetGame();
  isRunning = true;
  isPaused = false;
  pauseButton.disabled = false;
  pauseButton.textContent = '일시정지';
  startButton.textContent = '진행 중';
  setStatus('게임이 시작되었습니다.');
  startLoop();
}

function pauseGame() {
  if (!isRunning) return;
  isPaused = !isPaused;
  if (isPaused) {
    clearTimers();
    clearPickupEffects();
    pauseButton.textContent = '계속하기';
    setStatus('일시정지되었습니다.');
  } else {
    pauseButton.textContent = '일시정지';
    setStatus('게임을 계속합니다.');
    startLoop();
  }
}

function restartGame() {
  clearTimers();
  clearPickupEffects();
  isRunning = false;
  isPaused = false;
  startButton.textContent = '시작';
  pauseButton.disabled = true;
  pauseButton.textContent = '일시정지';
  resetGame();
  setStatus('새 게임을 시작할 준비가 되었습니다.');
}

function gameOver(message = '게임 오버! 재시작 버튼으로 다시 도전하세요.') {
  clearTimers();
  clearPickupEffects();
  feverItem = null;
  feverTicksRemaining = 0;
  isRunning = false;
  isPaused = false;
  startButton.textContent = '시작';
  pauseButton.disabled = true;
  setStatus(message);
}

function setDirection(name) {
  const requested = directions[name];
  if (!requested) return;
  if (requested.x === -direction.x && requested.y === -direction.y) return;
  if (requested.x === -nextDirection.x && requested.y === -nextDirection.y) return;
  nextDirection = requested;
}

function moveEnemies() {
  enemies = enemies.map((enemy) => {
    const options = [enemy.direction, randomEnemyDirection()];
    const chosen = options[Math.floor(Math.random() * options.length)];
    const next = { x: enemy.x + chosen.x, y: enemy.y + chosen.y };
    if (next.x < 0 || next.x >= BOARD_SIZE || next.y < 0 || next.y >= BOARD_SIZE) {
      return { ...enemy, direction: { x: -chosen.x, y: -chosen.y } };
    }
    return { ...enemy, ...next, direction: chosen };
  });
}

function tick() {
  updatePickupEffects();
  const feverWasActive = feverTicksRemaining > 0;
  direction = nextDirection;
  const head = snake[0];
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
  const hitWall = nextHead.x < 0 || nextHead.x >= BOARD_SIZE || nextHead.y < 0 || nextHead.y >= BOARD_SIZE;
  const hitSelf = snake.some((segment) => samePosition(segment, nextHead));
  if (hitWall || hitSelf) {
    gameOver('벽 또는 자신의 몸에 부딪혔습니다.');
    return;
  }

  if (feverItem && samePosition(nextHead, feverItem)) {
    feverItem = null;
    feverTicksRemaining = FEVER_DURATION_TICKS;
    createPickupEffect(nextHead);
    setStatus('피버 모드! 6초 동안 바이러스를 먹을 수 있습니다.');
    updateFeverStatus();
    scheduleFeverItem();
  }

  const hitEnemyIndex = enemies.findIndex((enemy) => samePosition(enemy, nextHead));
  if (hitEnemyIndex >= 0) {
    enemies.splice(hitEnemyIndex, 1);
    if (feverWasActive) {
      score += 25;
      if (score > highScore) {
        highScore = score;
        saveHighScore();
      }
      createPickupEffect(nextHead);
      setStatus('바이러스를 먹었습니다. +25점!');
    } else {
      health -= 1;
    }
    updateScore();
    if (!feverWasActive && health <= 0) {
      gameOver('체력을 모두 잃었습니다. 재시작 버튼으로 다시 도전하세요.');
      return;
    }
    if (!feverWasActive) setStatus(`바이러스와 충돌했습니다. 체력 ${health}칸 남음.`);
  }

  snake.unshift(nextHead);
  if (food && samePosition(nextHead, food)) {
    score += 10;
    if (score > highScore) {
      highScore = score;
      saveHighScore();
    }
    spawnFood();
    createPickupEffect(nextHead);
    setStatus('음식을 먹었습니다. 지렁이가 성장합니다.');
  } else {
    snake.pop();
  }
  moveEnemies();
  if (feverWasActive) {
    feverTicksRemaining -= 1;
    if (feverTicksRemaining === 0) {
      setStatus('피버 모드가 끝났습니다. 바이러스에 다시 주의하세요.');
      scheduleFeverItem();
    } else if (feverTicksRemaining % 7 === 0) {
      setStatus(`피버 모드: ${Math.ceil((feverTicksRemaining * TICK_MS) / 1000)}초 남음.`);
    }
  }
  updateFeverStatus();
  updateScore();
  draw();
}

function drawCell(position, color, radius = 4) {
  const padding = 2;
  const size = CELL_SIZE - padding * 2;
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(position.x * CELL_SIZE + padding, position.y * CELL_SIZE + padding, size, size, radius);
  context.fill();
}

function draw() {
  if (!context) return;
  context.fillStyle = '#0a1020';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(244, 247, 255, 0.06)';
  for (let line = 0; line <= BOARD_SIZE; line += 1) {
    const offset = line * CELL_SIZE;
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, canvas.height);
    context.moveTo(0, offset);
    context.lineTo(canvas.width, offset);
    context.stroke();
  }
  if (food) {
    context.fillStyle = '#ffd166';
    context.beginPath();
    context.arc(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2, 6, 0, Math.PI * 2);
    context.fill();
  }
  context.font = '16px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  enemies.forEach((enemy) => context.fillText('🦠', enemy.x * CELL_SIZE + CELL_SIZE / 2, enemy.y * CELL_SIZE + CELL_SIZE / 2));
  if (feverItem) context.fillText('⚡', feverItem.x * CELL_SIZE + CELL_SIZE / 2, feverItem.y * CELL_SIZE + CELL_SIZE / 2);
  snake.forEach((segment, index) => drawCell(segment, index === 0 ? '#78e4c3' : '#4bbd9c'));
  pickupEffects.forEach((effect) => {
    const centerX = effect.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = effect.y * CELL_SIZE + CELL_SIZE / 2;
    const progress = effect.age / effect.lifetime;
    context.save();
    context.globalAlpha = 1 - progress;
    context.strokeStyle = '#ffd166';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(centerX, centerY, 5 + progress * 14, 0, Math.PI * 2);
    context.stroke();
    if (!prefersReducedMotion) {
      context.fillStyle = '#78e4c3';
      for (let particle = 0; particle < 6; particle += 1) {
        const angle = (Math.PI * 2 * particle) / 6;
        const distance = 5 + progress * 16;
        context.fillRect(centerX + Math.cos(angle) * distance - 1, centerY + Math.sin(angle) * distance - 1, 2, 2);
      }
    }
    context.restore();
  });
}

function handleSwipe(event) {
  if (!touchStart) return;
  const deltaX = event.clientX - touchStart.x;
  const deltaY = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 18) return;
  if (Math.abs(deltaX) > Math.abs(deltaY)) setDirection(deltaX > 0 ? 'right' : 'left');
  else setDirection(deltaY > 0 ? 'down' : 'up');
}

Object.entries(keyDirections).forEach(([key, name]) => {
  window.addEventListener('keydown', (event) => {
    if (event.key === key) {
      event.preventDefault();
      setDirection(name);
    }
  });
});
window.addEventListener('keydown', (event) => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    if (event.key === ' ') pauseGame();
    else if (!isRunning) startGame();
  }
});

startButton?.addEventListener('click', startGame);
pauseButton?.addEventListener('click', pauseGame);
restartButton?.addEventListener('click', restartGame);
directionButtons.forEach((button) => button.addEventListener('click', () => setDirection(button.dataset.direction)));
canvas?.addEventListener('pointerdown', (event) => { touchStart = { x: event.clientX, y: event.clientY }; });
canvas?.addEventListener('pointerup', handleSwipe);

resetGame();
