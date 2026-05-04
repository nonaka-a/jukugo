function toggleBGM() {
    if (isBgmPlaying) {
        bgm.pause();
        isBgmPlaying = false;
    } else {
        bgm.play().catch(e => console.log("BGM再生エラー:", e));
        isBgmPlaying = true;
    }
}

function toggleSettings() {
    const overlay = document.getElementById('settings-overlay');
    overlay.style.display = overlay.style.display === 'flex' ? 'none' : 'flex';
}

function toggleSound() {
    state.isSoundOn = !state.isSoundOn;
    document.getElementById('sound-toggle-btn').textContent = state.isSoundOn ? 'ON' : 'OFF';
    if (state.isSoundOn) {
        if (isBgmPlaying) bgm.play();
    } else {
        bgm.pause();
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function showGameOverModal() {
    document.getElementById('game-over-overlay').style.display = 'flex';
}

function backToTitleFromGameOver() {
    document.getElementById('game-over-overlay').style.display = 'none';
    backToTitle();
}

let popupDelay = 0;
let popupResetTimer = null;

function showTimePlusPopup(amount) {
    const timeContainer = document.getElementById('time-container');
    if (!timeContainer) return;

    setTimeout(() => {
        const popup = document.createElement('div');
        popup.className = 'time-plus-popup';
        popup.textContent = `+${amount}`;
        
        // 上下左右にランダムに少しずらす
        const offsetX = (Math.random() - 0.5) * 20 + 10;
        const offsetY = (Math.random() - 0.5) * 20;
        popup.style.left = `calc(100% + ${offsetX}px)`;
        popup.style.top = `${offsetY}px`;

        timeContainer.appendChild(popup);

        setTimeout(() => {
            if (popup.parentNode) popup.remove();
        }, 1000);
    }, popupDelay);

    // 次のポップアップを300ms遅らせる
    popupDelay += 300;
    
    // 一定時間追加がなければ遅延をリセット
    clearTimeout(popupResetTimer);
    popupResetTimer = setTimeout(() => {
        popupDelay = 0;
    }, popupDelay + 100);
}

function updateStatsUI() {
    const stageEl = document.getElementById('stage-val');
    const timeEl = document.getElementById('time-val');
    const enemyEl = document.getElementById('enemy-val');
    if (stageEl) stageEl.textContent = state.currentStage + 1;
    if (timeEl) timeEl.textContent = state.timeLimit;
    const uniqueEnemies = new Set(Object.values(state.enemies));
    if (enemyEl) enemyEl.textContent = uniqueEnemies.size;
    updateLampsUI();
}

function initLampsUI() {
    const container = document.getElementById('lamp-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const lamp = document.createElement('div');
        lamp.className = 'lamp';
        container.appendChild(lamp);
    }
}

function updateLampsUI() {
    const container = document.getElementById('lamp-container');
    if (!container) return;
    const lamps = container.querySelectorAll('.lamp');
    lamps.forEach((lamp, i) => {
        lamp.classList.remove('on', 'power-on');
        if (i < state.lampCount) {
            if (state.isPowerUpActive) {
                lamp.classList.add('power-on');
            } else {
                lamp.classList.add('on');
            }
        }
    });

    if (state.lampCount >= 5 && !state.isRouletteActive && !state.isPowerUpActive) {
        setTimeout(startRoulette, 2500);
    }

    const pLabel = document.getElementById('powerup-label');
    if (pLabel) {
        let text = "";
        if (state.powerUps.explosionRange > 1) text += "【花火】";
        if (state.powerUps.isCross) text += "【十字】";
        if (state.powerUps.isDiagonal) text += "【対角】";
        pLabel.textContent = text;
    }
}

// Roulette Logic
const ROULETTE_DATA = {
    upper: ["花", "爆", "十", "対", "残", "失"],
    lower: ["火", "発", "字", "角", "念", "敗"]
};

let rouletteState = {
    step: 0, 
    upper: { pos: 0, speed: 3, active: false, stopping: false, targetPos: 0, strip: null, data: ROULETTE_DATA.upper },
    lower: { pos: 0, speed: 3, active: false, stopping: false, targetPos: 0, strip: null, data: ROULETTE_DATA.lower },
    animId: null
};

function startRoulette() {
    state.isRouletteActive = true;
    rouletteState.step = 0;
    
    const overlay = document.getElementById('roulette-overlay');
    overlay.style.display = 'flex';
    overlay.onclick = handleRouletteClick;

    // タイトルを画像に差し替え
    const container = document.getElementById('roulette-container');
    const titleH2 = container.querySelector('h2');
    if (titleH2) {
        titleH2.innerHTML = '<img src="assets/Roulette.png" alt="ぱわーあっぷるーれっと！">';
    }
    
    // 説明文の特定の単語を強調
    const description = container.querySelector('.roulette-description');
    if (description) {
        description.innerHTML = 'ルーレットを止めて<strong>「花火」「十字」「対角」「爆発」</strong>の熟語を作ろう！';
    }

    initStrip('upper', document.getElementById('strip-upper'));
    initStrip('lower', document.getElementById('strip-lower'));

    document.getElementById('slot-upper').classList.remove('stopped');
    document.getElementById('slot-lower').classList.remove('stopped');

    if (rouletteState.animId) cancelAnimationFrame(rouletteState.animId);
    rouletteState.animId = requestAnimationFrame(updateRoulette);
}


function initStrip(id, el) {
    const data = rouletteState[id].data;
    el.innerHTML = '';
    const repeatCount = 20; 
    for (let i = 0; i < repeatCount; i++) {
        data.forEach(char => {
            const span = document.createElement('div');
            span.className = 'slot-char';
            if (["花", "火", "爆", "発", "十", "字", "対", "角"].includes(char)) {
                span.classList.add('hand-tile', 'y-block'); 
            } else if (COLLECTION_KANJI.has(char)) {
                span.classList.add('hand-tile', 'g-block');
            } else {
                span.classList.add('hand-tile');
            }
            span.textContent = char;
            el.appendChild(span);
        });
    }
    rouletteState[id].strip = el;
    rouletteState[id].active = true;
    rouletteState[id].stopping = false;
    rouletteState[id].speed = 3 + Math.random() * 2;
    rouletteState[id].pos = -(data.length * 100 * 10);
}

function updateRoulette() {
    if (!state.isRouletteActive) return;

    ['upper', 'lower'].forEach(id => {
        const s = rouletteState[id];
        const dataWidth = s.data.length * 100;
        
        if (s.active) {
            s.pos += s.speed;
            if (s.pos > -500) {
                s.pos -= dataWidth;
            }
        } else if (s.stopping) {
            s.pos += s.speed;
            if (s.pos >= s.targetPos) {
                s.pos = s.targetPos;
                s.stopping = false;
            }
        }
        if (s.strip) {
            s.strip.style.transform = `translateX(${s.pos}px)`;
        }
    });

    rouletteState.animId = requestAnimationFrame(updateRoulette);
}

function handleRouletteClick() {
    if (rouletteState.step === 0) {
        stopSlot('upper');
        rouletteState.step = 1;
    } else if (rouletteState.step === 1) {
        stopSlot('lower');
        rouletteState.step = 2;
        setTimeout(finishRoulette, 500);
    }
}

function stopSlot(id) {
    const s = rouletteState[id];
    s.active = false;
    s.stopping = true;
    
    const charWidth = 100;
    const centerOffset = 120;
    
    let currentK = (centerOffset - s.pos) / charWidth;
    let targetK = Math.round(currentK); 
    
    s.targetPos = centerOffset - targetK * charWidth;
    
    if (s.targetPos < s.pos + s.speed) {
        targetK -= 1;
        s.targetPos = centerOffset - targetK * charWidth;
    }
    
    const dataLen = s.data.length;
    let dataIdx = targetK % dataLen;
    if (dataIdx < 0) dataIdx += dataLen;
    
    rouletteState[id + 'Idx'] = dataIdx;
    document.getElementById(`slot-${id}`).classList.add('stopped');
}

function finishRoulette() {
    if (rouletteState.upper.stopping || rouletteState.lower.stopping) {
        setTimeout(finishRoulette, 100);
        return;
    }
    const word = ROULETTE_DATA.upper[rouletteState.upperIdx] + ROULETTE_DATA.lower[rouletteState.lowerIdx];
    const overlay = document.getElementById('roulette-overlay');
    overlay.style.display = 'none';
    overlay.onclick = null;
    
    const validWords = ["花火", "爆発", "十字", "対角"];
    if (validWords.includes(word)) {
        displayAndSpeakWords([word], () => {
            applyPowerUp(word);
            if (word === "爆発") {
                state.lampCount = 0;
                state.isPowerUpActive = false;
            } else {
                state.lampCount = 5;
                state.isPowerUpActive = true;
            }
            state.isRouletteActive = false;
            updateStatsUI();
        });
    } else {
        const displayWord = (word === "残念" || word === "失敗") ? word : "残念";
        displayAndSpeakWords([displayWord], () => {
            state.lampCount = 0;
            state.isPowerUpActive = false;
            state.isRouletteActive = false;
            updateStatsUI();
        });
    }
}

function applyPowerUp(word) {
    if (word === "花火") {
        state.powerUps.explosionRange = 2;
    } else if (word === "爆発") {
        Object.keys(cellDOMs).forEach(key => {
            cellDOMs[key].classList.add('power-range-highlight');
        });
        
        setTimeout(() => {
            screenShake();
            if (state.isSoundOn) {
                seFirework.currentTime = 0;
                seFirework.play().catch(e => {});
            }
            
            Object.keys(cellDOMs).forEach(key => {
                const cell = cellDOMs[key];
                if (state.grid[key]) {
                    const [gx, gy] = key.split(',').map(Number);
                    createParticles(gx, gy);
                    delete state.grid[key];
                }
                if (cell) {
                    cell.textContent = '';
                    cell.className = 'cell';
                }
            });
            
            state.enemies = {};
            checkStageClear();
        }, 800);
    } else if (word === "十字") {
        state.powerUps.isCross = true;
    } else if (word === "対角") {
        state.powerUps.isDiagonal = true;
    }
}

function initGridDOM() {
    gridElement.innerHTML = '';
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            gridElement.appendChild(cell);
            cellDOMs[`${x},${y}`] = cell;
        }
    }
}

function setupEvents() {
    gameWindow.addEventListener('mousemove', handleMouseMove);
    gameWindow.addEventListener('mouseleave', () => {
        launcherElement.style.display = 'none';
        guideLineElement.style.display = 'none';
    });
    gameWindow.addEventListener('click', handleGameClick);
    
    gameWindow.addEventListener('touchstart', (e) => {
        if (state.isShooting) return;
        const touch = e.touches[0];
        updateLauncherPosition(touch.clientX, touch.clientY);
    }, {passive: true});
    
    gameWindow.addEventListener('touchmove', (e) => {
        if (state.isShooting) return;
        e.preventDefault();
        const touch = e.touches[0];
        updateLauncherPosition(touch.clientX, touch.clientY);
    }, {passive: false});
}

function handleMouseMove(e) {
    if (state.isShooting) return;
    updateLauncherPosition(e.clientX, e.clientY);
}

function updateLauncherPosition(clientX, clientY) {
    const rect = gameWindow.getBoundingClientRect();
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    
    const GAME_W = GAME_SIZE;
    const GAME_H = GAME_SIZE;
    const gx = (GAME_W - GRID_SIZE * TILE_SIZE) / 2;
    const gy = (GAME_H - GRID_SIZE * TILE_SIZE) / 2;

    const cx = GAME_W / 2;
    const cy = GAME_H / 2;
    const dx = x - cx;
    const dy = y - cy;

    let edgeX = -1, edgeY = -1, dir = null;

    if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx < 0 ? 'right' : 'left';
        edgeX = dx < 0 ? 0 : GRID_SIZE - 1;
        edgeY = Math.floor((y - gy) / TILE_SIZE);
    } else {
        dir = dy < 0 ? 'down' : 'up';
        edgeY = dy < 0 ? 0 : GRID_SIZE - 1;
        edgeX = Math.floor((x - gx) / TILE_SIZE);
    }

    if (dir && edgeX >= 0 && edgeX < GRID_SIZE && edgeY >= 0 && edgeY < GRID_SIZE) {
        const char = state.playerHand[state.selectedHandIndex] || '';
        state.launcher = { x: edgeX, y: edgeY, dir, char: char };
        
        launcherElement.style.backgroundColor = 'transparent';
        launcherElement.style.border = 'none';
        launcherElement.style.boxShadow = 'none';
        
        updateLauncherUI(gx, gy);
    } else {
        launcherElement.style.display = 'none';
        guideLineElement.style.display = 'none';
    }
}

function updateLauncherUI(gx, gy) {
    launcherElement.style.display = 'flex';
    launcherElement.textContent = state.launcher.char;
    
    const specialKanji = ["花", "火", "爆", "発", "十", "字", "対", "角"];
    if (specialKanji.includes(state.launcher.char)) {
        launcherElement.classList.add('y-block');
    } else {
        launcherElement.classList.remove('y-block');
    }
    if (COLLECTION_KANJI.has(state.launcher.char)) {
        launcherElement.classList.add('g-block');
    } else {
        launcherElement.classList.remove('g-block');
    }

    const lX = gx + state.launcher.x * TILE_SIZE;
    const lY = gy + state.launcher.y * TILE_SIZE;
    
    let offset = TILE_SIZE + 10;
    let finalX = lX, finalY = lY;
    if (state.launcher.dir === 'down') finalY -= offset;
    if (state.launcher.dir === 'up') finalY += offset;
    if (state.launcher.dir === 'right') finalX -= offset;
    if (state.launcher.dir === 'left') finalX += offset;

    launcherElement.style.left = `${finalX}px`;
    launcherElement.style.top = `${finalY}px`;
    launcherElement.style.transform = `scale(1)`;

    guideLineElement.style.display = 'block';
    guideLineElement.style.left = `${gx + state.launcher.x * TILE_SIZE + (TILE_SIZE / 2)}px`;
    guideLineElement.style.top = `${gy + state.launcher.y * TILE_SIZE + (TILE_SIZE / 2)}px`;
    
    if (state.launcher.dir === 'down' || state.launcher.dir === 'up') {
        guideLineElement.style.width = '1px';
        guideLineElement.style.height = `${GRID_SIZE * TILE_SIZE}px`;
        if (state.launcher.dir === 'up') guideLineElement.style.top = `${gy + (state.launcher.y - GRID_SIZE + 1) * TILE_SIZE + (TILE_SIZE / 2)}px`;
    } else {
        guideLineElement.style.height = '1px';
        guideLineElement.style.width = `${GRID_SIZE * TILE_SIZE}px`;
        if (state.launcher.dir === 'left') guideLineElement.style.left = `${gx + (state.launcher.x - GRID_SIZE + 1) * TILE_SIZE + (TILE_SIZE / 2)}px`;
    }
}

async function handleGameClick() {
    if (state.isShooting || launcherElement.style.display === 'none' || state.selectedHandIndex === null) return;
    
    const { x, y, dir, char } = state.launcher;
    const shotIndex = state.selectedHandIndex;
    
    state.isShooting = true;

    const tileToRemove = playerHandElement.children[shotIndex];
    if (tileToRemove) tileToRemove.classList.add('removing');

    const newChar = popNewHandChar();
    
    const newTile = document.createElement('div');
    newTile.className = 'hand-tile adding';
    newTile.textContent = newChar;
    if (["花", "火", "爆", "発", "十", "字", "対", "角"].includes(newChar)) {
        newTile.classList.add('y-block');
    }
    if (COLLECTION_KANJI.has(newChar)) {
        newTile.classList.add('g-block');
    }
    newTile.onclick = () => {
        state.selectedHandIndex = state.playerHand.indexOf(newChar);
        updateHandSelection();
        refreshHighlights();
    };
    playerHandElement.appendChild(newTile);

    void newTile.offsetWidth;
    newTile.classList.remove('adding');

    state.playerHand.splice(shotIndex, 1);
    state.playerHand.push(newChar);
    
    if (state.playerHand.length > 0) {
        state.selectedHandIndex = Math.min(state.selectedHandIndex, state.playerHand.length - 1);
    } else {
        state.selectedHandIndex = null;
    }

    updateHandSelection();
    refreshHighlights();

    setTimeout(() => {
        if (tileToRemove && tileToRemove.parentNode) tileToRemove.remove();
        renderHand();
    }, 600);

    await shoot(x, y, dir, char);
    state.isShooting = false;
}

async function shoot(startX, startY, dir, char) {
    let curX = startX, curY = startY;
    let targetX = startX, targetY = startY;
    
    const dx = { 'right': 1, 'left': -1, 'up': 0, 'down': 0 }[dir];
    const dy = { 'right': 0, 'left': 0, 'up': -1, 'down': 1 }[dir];

    if (state.grid[`${curX},${curY}`]) return;

    while (true) {
        let nextX = curX + dx, nextY = curY + dy;
        if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE || state.grid[`${nextX},${nextY}`]) {
            targetX = curX;
            targetY = curY;
            break;
        }
        curX = nextX;
        curY = nextY;
    }

    state.grid[`${targetX},${targetY}`] = 'RESERVED';

    const shooter = document.createElement('div');
    shooter.id = 'shooting-tile';
    shooter.textContent = char;
    if (["花", "火", "爆", "発", "十", "字", "対", "角"].includes(char)) {
        shooter.classList.add('y-block');
    }
    if (COLLECTION_KANJI.has(char)) {
        shooter.classList.add('g-block');
    }
    gameWindow.appendChild(shooter);

    const GAME_W = GAME_SIZE;
    const GAME_H = GAME_SIZE;
    const gx = (GAME_W - GRID_SIZE * TILE_SIZE) / 2;
    const gy = (GAME_H - GRID_SIZE * TILE_SIZE) / 2;

    const startXpx = parseFloat(launcherElement.style.left);
    const startYpx = parseFloat(launcherElement.style.top);
    
    launcherElement.style.display = 'none';
    guideLineElement.style.display = 'none';
    
    const endXpx = gx + targetX * TILE_SIZE;
    const endYpx = gy + targetY * TILE_SIZE;

    shooter.style.left = `${startXpx}px`;
    shooter.style.top = `${startYpx}px`;
    shooter.style.transform = `scale(1)`;

    const distance = Math.max(Math.abs(endXpx - startXpx), Math.abs(endYpx - startYpx));
    const speed = 1200; 
    const duration = Math.max(0.15, distance / speed); 

    await new Promise(resolve => {
        setTimeout(() => {
            shooter.style.transition = `all ${duration}s cubic-bezier(0.16, 1, 0.3, 1)`;
            shooter.style.left = `${endXpx}px`;
            shooter.style.top = `${endYpx}px`;
            setTimeout(resolve, duration * 1000);
        }, 10);
    });

    shooter.remove();
    await placeAndCheck(targetX, targetY, char);
}

async function placeAndCheck(x, y, char) {
    state.grid[`${x},${y}`] = char;
    const cell = cellDOMs[`${x},${y}`];
    cell.textContent = char;
    cell.classList.add('occupied');
    if (["花", "火", "爆", "発", "十", "字", "対", "角"].includes(char)) {
        cell.classList.add('y-block');
    } else {
        cell.classList.remove('y-block');
    }
    if (COLLECTION_KANJI.has(char)) {
        cell.classList.add('g-block');
    } else {
        cell.classList.remove('g-block');
    }

    const h = validateLine(x, y, true);
    const v = validateLine(x, y, false);
    
    if (h.isValid || v.isValid) {
        const coordsToClear = new Set();
        const foundWords = [];
        if (h.isValid) { h.coordLists.forEach(list => list.forEach(c => coordsToClear.add(c))); foundWords.push(...h.words); }
        if (v.isValid) { v.coordLists.forEach(list => list.forEach(c => coordsToClear.add(c))); foundWords.push(...v.words); }

        const allExplosionCoords = new Set();
        const coordsArray = Array.from(coordsToClear);
        coordsArray.forEach((c, idx) => {
            const [cx, cy] = c.split(',').map(Number);
            getExplosionCoords(cx, cy).forEach(ec => allExplosionCoords.add(ec));
            if (idx === 0) {
                getPowerUpLines(cx, cy).forEach(ec => allExplosionCoords.add(ec));
            }
        });

        allExplosionCoords.forEach(c => {
            if (cellDOMs[c]) {
                cellDOMs[c].classList.add('power-range-highlight');
            }
        });

        coordsToClear.forEach(c => cellDOMs[c].classList.add('success-flash'));
        await new Promise(r => setTimeout(r, 600)); 
        
        allExplosionCoords.forEach(c => {
            if (cellDOMs[c]) cellDOMs[c].classList.remove('power-range-highlight');
        });
        coordsToClear.forEach(c => cellDOMs[c].classList.remove('success-flash'));

        coordsToClear.forEach(c => cellDOMs[c].classList.add('exploding'));
        
        for (let i = 3; i > 0; i--) {
            if (i === 2) coordsToClear.forEach(c => cellDOMs[c].classList.add('fast'));
            if (i === 1) coordsToClear.forEach(c => cellDOMs[c].classList.add('faster'));
            await new Promise(r => setTimeout(r, 500));
        }

        screenShake();
        if (state.isSoundOn) {
            seFirework.currentTime = 0;
            seFirework.play().catch(e => console.log("SE再生エラー:", e));
        }
        
        coordsArray.forEach((c, idx) => {
            const [cx, cy] = c.split(',').map(Number);
            createParticles(cx, cy);
            damageNearbyEnemies(cx, cy, idx > 0);

            delete state.grid[c];
            const cell = cellDOMs[c];
            cell.textContent = '';
            cell.classList.remove('occupied', 'exploding', 'fast', 'faster', 'success-flash', 'obstacle-j2');
        });

        refreshHighlights();
        
        if (state.isPowerUpActive) {
            state.lampCount = Math.max(0, state.lampCount - foundWords.length);
            if (state.lampCount <= 0) {
                state.isPowerUpActive = false;
                state.powerUps = { explosionRange: 1, isCross: false, isDiagonal: false };
            }
        } else {
            state.lampCount = Math.min(5, state.lampCount + foundWords.length);
        }
        updateLampsUI();
        
        setTimeout(() => {
            const uniqueWords = [...new Set(foundWords)];
            
            uniqueWords.forEach(word => checkCollection(word));
            
            displayAndSpeakWords(uniqueWords, () => {
                checkStageClear();
            });
        }, 200);
    }
}

function spawnObstacle() {
    const emptyCells = [];
    const margin = 3;
    for (let y = margin; y < GRID_SIZE - margin; y++) {
        for (let x = margin; x < GRID_SIZE - margin; x++) {
            if (!state.grid[`${x},${y}`]) emptyCells.push({x, y});
        }
    }
    
    if (emptyCells.length === 0) {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (!state.grid[`${x},${y}`]) emptyCells.push({x, y});
            }
        }
    }
    
    if (emptyCells.length === 0) return;

    const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    state.grid[`${target.x},${target.y}`] = '■';
    const cell = cellDOMs[`${target.x},${target.y}`];
    cell.textContent = '■';
    cell.classList.add('occupied', 'obstacle');
    refreshHighlights();
}

function screenShake() {
    const mainArea = document.getElementById('main-area');
    mainArea.classList.remove('shake');
    void mainArea.offsetWidth;
    mainArea.classList.add('shake');
    setTimeout(() => mainArea.classList.remove('shake'), 500);
}

function createParticles(x, y) {
    const key = `${x},${y}`;
    const cell = cellDOMs[key];
    if (!cell) return;
    
    const GAME_W = GAME_SIZE;
    const GAME_H = GAME_SIZE;
    const gx = (GAME_W - GRID_SIZE * TILE_SIZE) / 2;
    const gy = (GAME_H - GRID_SIZE * TILE_SIZE) / 2;
    
    const centerX = gx + x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = gy + y * TILE_SIZE + TILE_SIZE / 2;

    const colors = ['#f28d35', '#fdcb6e', '#d63031', '#ffffff'];

    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.boxShadow = `0 0 10px ${p.style.backgroundColor}`;
        gameWindow.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        let px = centerX, py = centerY;
        let opacity = 1;
        let scaleVal = 1 + Math.random() * 0.5;
        let lastTime = performance.now();

        const animate = (currentTime) => {
            const dt = (currentTime - lastTime) / 16.666;
            lastTime = currentTime;

            px += vx * dt;
            py += vy * dt;
            opacity -= 0.02 * dt;
            scaleVal -= 0.01 * dt;
            
            p.style.left = px + 'px';
            p.style.top = py + 'px';
            p.style.opacity = opacity;
            p.style.transform = `scale(${scaleVal})`;

            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                p.remove();
            }
        };
        requestAnimationFrame(animate);
    }
}

function spawnRandomTile() {
    const emptyCells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (!state.grid[`${x},${y}`]) emptyCells.push({x, y});
        }
    }

    if (emptyCells.length === 0) return;

    const adjacentEmpty = emptyCells.filter(({x, y}) => {
        return [[0,1],[0,-1],[1,0],[-1,0]].some(([dx, dy]) => state.grid[`${x+dx},${y+dy}`]);
    });

    const target = (adjacentEmpty.length > 0 && Math.random() > 0.2) 
        ? adjacentEmpty[Math.floor(Math.random() * adjacentEmpty.length)]
        : emptyCells[Math.floor(Math.random() * emptyCells.length)];

    const char = hubKanji[Math.floor(Math.random() * hubKanji.length)];
    
    state.grid[`${target.x},${target.y}`] = char;
    const cell = cellDOMs[`${target.x},${target.y}`];
    cell.textContent = char;
    cell.classList.add('occupied');
    if (["花", "火", "爆", "発", "十", "字", "対", "角"].includes(char)) {
        cell.classList.add('y-block');
    } else {
        cell.classList.remove('y-block');
    }
    if (COLLECTION_KANJI.has(char)) {
        cell.classList.add('g-block');
    } else {
        cell.classList.remove('g-block');
    }
    refreshHighlights();
}

function spawnBossCounterObstacles(count, type) {
    for (let i = 0; i < count; i++) {
        const emptyCells = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (!state.grid[`${x},${y}`]) emptyCells.push({x, y});
            }
        }
        if (emptyCells.length === 0) break;
        
        const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const key = `${target.x},${target.y}`;
        const cell = cellDOMs[key];
        if (!cell) continue;

        state.grid[key] = (type === 'J2') ? 'OBSTACLE_J2' : 'OBSTACLE';
        cell.textContent = '■';
        cell.classList.add('occupied');
        cell.classList.add(type === 'J2' ? 'obstacle-j2' : 'obstacle');
        
        cell.style.animation = 'none';
        void cell.offsetWidth;
        cell.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
    refreshHighlights();
}

function updateHandSelection() {
    const activeTiles = Array.from(playerHandElement.children).filter(t => !t.classList.contains('removing'));
    activeTiles.forEach((tile, index) => {
        if (state.selectedHandIndex === index) {
            tile.classList.add('selected');
        } else {
            tile.classList.remove('selected');
        }
    });
}

function renderHand() {
    playerHandElement.innerHTML = '';
    state.playerHand.forEach((char, index) => {
        const tile = document.createElement('div');
        tile.className = 'hand-tile';
        if (state.selectedHandIndex === index) tile.classList.add('selected');
        if (["花", "火", "爆", "発", "十", "字", "対", "角"].includes(char)) {
            tile.classList.add('y-block');
        }
        if (COLLECTION_KANJI.has(char)) {
            tile.classList.add('g-block');
        }
        tile.textContent = char;
        tile.onclick = () => {
            state.selectedHandIndex = index;
            updateHandSelection();
            refreshHighlights();
        };
        playerHandElement.appendChild(tile);
    });
}

function refreshHighlights() {
    const shuffleBtn = document.querySelector('.shuffle-btn');
    if (shuffleBtn) shuffleBtn.classList.remove('hint-blink');

    document.querySelectorAll('.hint-highlight').forEach(c => c.classList.remove('hint-highlight'));
    document.querySelectorAll('.hint-specific').forEach(c => c.classList.remove('hint-specific'));

    const hand = state.playerHand;
    if (hand.length === 0) return;

    const directions = [
        { dir: 'down', range: Array.from({length: GRID_SIZE}, (_, i) => [i, 0]) },
        { dir: 'up', range: Array.from({length: GRID_SIZE}, (_, i) => [i, GRID_SIZE - 1]) },
        { dir: 'right', range: Array.from({length: GRID_SIZE}, (_, i) => [0, i]) },
        { dir: 'left', range: Array.from({length: GRID_SIZE}, (_, i) => [GRID_SIZE - 1, i]) }
    ];

    const uniqueValidTargets = new Set();
    const specificTargets = new Set();
    const selectedChar = hand[state.selectedHandIndex];

    hand.forEach((char, idx) => {
        directions.forEach(({dir, range}) => {
            range.forEach(([ex, ey]) => {
                if (state.grid[`${ex},${ey}`]) return;
                
                const landing = getLandingCell(ex, ey, dir);
                if (landing) {
                    const {x, y} = landing;
                    const key = `${x},${y}`;
                    
                    state.grid[key] = char;
                    const h = validateLine(x, y, true);
                    const v = validateLine(x, y, false);
                    delete state.grid[key];

                    if (h.isValid || v.isValid) {
                        uniqueValidTargets.add(key);
                        if (state.difficulty === 'easy' && char === selectedChar) {
                            specificTargets.add(key);
                        }
                    }
                }
            });
        });
    });

    // どこにも熟語が作れない場合はしゃっふるボタンを点滅させる
    if (uniqueValidTargets.size === 0 && hand.length > 0) {
        if (shuffleBtn) shuffleBtn.classList.add('hint-blink');
    }

    // むずかしいモードの場合はヒント（タイルのハイライト）を表示しない
    if (state.difficulty === 'hard') return;

    uniqueValidTargets.forEach(key => {
        if (cellDOMs[key]) cellDOMs[key].classList.add('hint-highlight');
    });
    
    specificTargets.forEach(key => {
        if (cellDOMs[key]) cellDOMs[key].classList.add('hint-specific');
    });
}

function resetView() {
    const GAME_W = GAME_SIZE;
    const GAME_H = 880; 
    const STATS_H = 60; 
    const PADDING = 20;

    const availableW = window.innerWidth - PADDING * 2;
    const availableH = window.innerHeight - STATS_H - PADDING * 2;

    const scaleByW = availableW / GAME_W;
    const scaleByH = availableH / GAME_H;
    scale = Math.min(scaleByW, scaleByH, 1.0); 

    const container = document.getElementById('main-area-container');
    container.style.width = `${GAME_W}px`;
    container.style.height = `${GAME_H}px`;
    
    // スケール後の実際の高さと画面余白を計算してY座標を調整
    const scaledH = GAME_H * scale;
    let extraY = 0;
    if (availableH > scaledH) {
        extraY = (availableH - scaledH) / 2;
    }
    
    container.style.transform = `scale(${scale}) translateY(${extraY / scale}px)`;
    container.style.transformOrigin = 'top center';
    
    const mainArea = document.getElementById('main-area');
    mainArea.style.transform = 'none'; 

    const translateX = (GAME_W - (GRID_SIZE * TILE_SIZE)) / 2;
    const translateY = (GAME_SIZE - (GRID_SIZE * TILE_SIZE)) / 2;
    gridElement.style.left = `${translateX}px`;
    gridElement.style.top = `${translateY}px`;

    const appContainer = document.getElementById('app-container');
    const soloHandArea = document.getElementById('solo-hand-area');
    if (appContainer && soloHandArea) {
        const appWidth = appContainer.getBoundingClientRect().width;
        const targetLogicalWidth = (appWidth / scale) + 2; 

        soloHandArea.style.width = `${GAME_W}px`;
        const handScale = targetLogicalWidth / GAME_W;

        soloHandArea.style.transform = `scale(${handScale})`;
        soloHandArea.style.transformOrigin = 'top center';
        
        const rectHeight = soloHandArea.offsetHeight || 180;
        const extraHeight = rectHeight * (handScale - 1);
        
        soloHandArea.style.margin = '20px 0 0 0';
        soloHandArea.style.marginBottom = `${extraHeight}px`;
        soloHandArea.style.alignSelf = 'center';
        soloHandArea.style.position = 'static';

        const tiles = soloHandArea.querySelectorAll('.hand-tile');
        const inverseScale = 1 / handScale; 
        tiles.forEach(tile => {
            tile.style.transform = `scale(${inverseScale})`;
            tile.style.transformOrigin = 'center center';
        });
    }
}

function placeTile(x, y, char) {
    state.grid[`${x},${y}`] = char;
    const cell = cellDOMs[`${x},${y}`];
    cell.textContent = char;
    cell.classList.add('occupied');
    if (["花", "火", "爆", "発", "十", "字", "対", "角"].includes(char)) {
        cell.classList.add('y-block');
    } else {
        cell.classList.remove('y-block');
    }
    if (COLLECTION_KANJI.has(char)) {
        cell.classList.add('g-block');
    } else {
        cell.classList.remove('g-block');
    }
}

function toggleHistory() {
    const overlay = document.getElementById('history-overlay');
    const isOpening = overlay.style.display !== 'flex';
    
    document.getElementById('collection-overlay').style.display = 'none'; 
    
    overlay.style.display = isOpening ? 'flex' : 'none';
    if (isOpening) updateHistoryUI();
}

function updateHistoryUI() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    
    if (state.history.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#999; margin-top:20px;">まだ熟語を作っていません</div>';
        return;
    }

    state.history.slice().reverse().forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-word">${item.word}</div>
            <div class="history-reading">${item.reading || ''}</div>
            <div class="history-meaning">${item.meaning || ''}</div>
        `;
        list.appendChild(div);
    });
}

function toggleCollection() {
    const overlay = document.getElementById('collection-overlay');
    const isOpening = overlay.style.display !== 'flex';
    
    document.getElementById('history-overlay').style.display = 'none'; 

    overlay.style.display = isOpening ? 'flex' : 'none';
    if (isOpening) {
        document.getElementById('collection-detail').style.display = 'none';
        updateCollectionUI();
        
        if (state.newlyCompletedGroups.length > 0 && state.isSoundOn) {
            seFirework.currentTime = 0;
            seFirework.play().catch(()=>{});
        }
    } else {
        state.newlyCompletedGroups = [];
        saveCollection();
    }
}

function updateCollectionUI() {
    let completedGroupsCount = 0;
    COLLECTION_DATA.forEach(group => {
        if (group.words.every(w => state.collection.includes(w))) {
            completedGroupsCount++;
        }
    });

    const titleData = COLLECTION_TITLES[completedGroupsCount] || COLLECTION_TITLES[COLLECTION_TITLES.length - 1];
    
    document.getElementById('rank-name').textContent = titleData.rank;
    document.getElementById('rank-progress').textContent = `（達成数: ${completedGroupsCount}/${COLLECTION_DATA.length}）`;
    document.getElementById('rank-desc').textContent = titleData.desc;

    const list = document.getElementById('collection-list');
    list.innerHTML = '';
    
    COLLECTION_DATA.forEach(group => {
        const groupHasAny = group.words.some(w => state.collection.includes(w));
        const groupIsCompleted = group.words.every(w => state.collection.includes(w));
        
        const groupDiv = document.createElement('div');
        groupDiv.className = 'collection-group';
        
        const isNewlyCompleted = state.newlyCompletedGroups.includes(group.name);
        if (groupIsCompleted && !isNewlyCompleted) {
            groupDiv.classList.add('completed');
        }

        const titleDiv = document.createElement('div');
        titleDiv.className = 'collection-title';
        titleDiv.textContent = groupIsCompleted ? `【${group.name}】` : '【？？？】';
        groupDiv.appendChild(titleDiv);

        const wordsDiv = document.createElement('div');
        wordsDiv.className = 'collection-words';
        
        group.words.forEach(word => {
            const wordSpan = document.createElement('span');
            const isAcquired = state.collection.includes(word);
            
            wordSpan.className = 'collection-word ' + (isAcquired ? 'acquired' : 'unacquired');
            // 修正箇所：未獲得でも文字をセットする
            wordSpan.textContent = word;
            
            if (isAcquired) {
                wordSpan.onclick = () => showCollectionDetail(word);
            }
            
            wordsDiv.appendChild(wordSpan);
        });
        
        groupDiv.appendChild(wordsDiv);
        
        if (groupIsCompleted || isNewlyCompleted) {
            const stamp = document.createElement('div');
            stamp.className = 'complete-stamp';
            stamp.textContent = '済';
            if (isNewlyCompleted) {
                stamp.classList.add('stamp-animate');
                groupDiv.classList.add('newly-completed');
            }
            groupDiv.appendChild(stamp);
        }

        list.appendChild(groupDiv);
    });
}

function showCollectionDetail(word) {
    const entry = typeof dictionaryData !== 'undefined' ? dictionaryData[word] : null;
    if (!entry) return;
    
    const detailBox = document.getElementById('collection-detail');
    detailBox.innerHTML = `
        <div class="col-detail-word">${word} <span class="col-detail-reading">(${entry.reading})</span></div>
        <div class="col-detail-meaning">${entry.meaning}</div>
    `;
    detailBox.style.display = 'block';
    
    detailBox.classList.remove('pop');
    void detailBox.offsetWidth;
    detailBox.classList.add('pop');
}

function displayAndSpeakWords(words, onComplete) {
    let overlay = document.getElementById('word-overlay-container');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'word-overlay-container';
        gameWindow.appendChild(overlay);
    }
    
    let delay = 0;
    words.forEach((word, index) => {
        setTimeout(() => {
            const wordEl = document.createElement('div');
            wordEl.className = 'huge-word';
            
            const entry = typeof dictionaryData !== 'undefined' ? dictionaryData[word] : null;
            let reading, meaning;
            if (entry && typeof entry === 'object') {
                reading = entry.reading;
                meaning = entry.meaning;
            } else {
                reading = entry;
                meaning = null;
            }

            if (!state.history.some(h => h.word === word)) {
                state.history.push({ word, reading, meaning });
            }

            if (reading) {
                wordEl.innerHTML = `<ruby>${word}<rt>${reading}</rt></ruby>`;
            } else {
                wordEl.textContent = word;
            }
            
            wordEl.style.opacity = '0';
            overlay.appendChild(wordEl);

            let meaningEl = null;
            if (meaning) {
                meaningEl = document.createElement('div');
                meaningEl.className = 'meaning-box';
                meaningEl.innerHTML = `<span class="meaning-label">【意味】</span>${meaning}`;
                overlay.appendChild(meaningEl);
            }
            
            if (state.isSoundOn !== false && window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(reading || word);
                utterance.lang = 'ja-JP';
                utterance.volume = 1.0;
                
                const voices = window.speechSynthesis.getVoices();
                const jpVoices = voices.filter(v => v.lang.includes('ja'));
                const maleVoice = jpVoices.find(v => v.name.includes('Otoya') || v.name.includes('Keita') || v.name.includes('Ichiro'));
                
                if (maleVoice) {
                    utterance.voice = maleVoice;
                    utterance.pitch = 1.0;
                    utterance.rate = 0.85;
                } else {
                    if (jpVoices.length > 0) utterance.voice = jpVoices[0];
                    utterance.pitch = 0.5;
                    utterance.rate = 0.85;
                }
                
                let animationStarted = false;
                const startAnim = () => {
                    if (animationStarted) return;
                    animationStarted = true;
                    wordEl.style.animation = 'wordReveal 1.5s ease-out forwards';
                    if (meaningEl) meaningEl.classList.add('animate');
                };
                
                utterance.onstart = startAnim;
                setTimeout(startAnim, 300);
                
                utterance.onend = () => {};
                
                window.speechSynthesis.speak(utterance);
            } else {
                wordEl.style.animation = 'wordReveal 1.5s ease-out forwards';
                if (meaningEl) meaningEl.classList.add('animate');
            }
            
            setTimeout(() => {
                wordEl.remove();
                if (meaningEl) meaningEl.remove();
            }, 2000);
        }, delay);
        delay += 1500; 
    });
    
    setTimeout(() => {
        if (onComplete) onComplete();
    }, delay);
}

function showStageClearModal() {
    const overlay = document.getElementById('stage-clear-overlay');
    const titleEl = document.getElementById('clear-title');
    const nextBtn = overlay.querySelector('.clear-btn.next');
    
    if (state.currentStage + 1 >= STAGES.length) {
        if (titleEl) titleEl.innerHTML = '<img src="assets/Stage_Clear_zen.png" alt="全ステージクリア！" style="width: 100%; max-width: 320px; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));">';
        if (nextBtn) nextBtn.style.display = 'none';
    } else {
        if (titleEl) titleEl.innerHTML = '<img src="assets/Stage_Clear.png" alt="すてーじくりあ！" style="width: 100%; max-width: 320px; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));">';
        if (nextBtn) nextBtn.style.display = 'inline-block';
    }
    
    if (overlay) overlay.style.display = 'flex';
}

function nextStage() {
    const overlay = document.getElementById('stage-clear-overlay');
    if (overlay) overlay.style.display = 'none';
    
    if (state.currentStage + 1 < STAGES.length) {
        loadStage(state.currentStage + 1);
    } else {
        backToTitle();
    }
}

function backToTitleFromClear() {
    const overlay = document.getElementById('stage-clear-overlay');
    if (overlay) overlay.style.display = 'none';
    backToTitle();
}

const TUTORIAL_STEPS = [
    {
        title: 'あそびかた 1',
        text: '下のてふだから好きな漢字をえらび、ステージの外からすべらせて置きます。'
    },
    {
        title: 'あそびかた 2',
        text: '黄色く点滅するマスは、てふだの漢字のうちどれかで熟語が作れるこうほのマスです。'
    },
    {
        title: 'あそびかた 3',
        text: 'かんたんモードのみ、選んでいる漢字で熟語が作れる場所があれば、赤いわくで知らせます。'
    },
    {
        title: 'あそびかた 4',
        text: 'どこからすべらせると置けるかを考えましょう。熟語ができると花火のように爆発し、まわりの敵やブロックをこわせます。'
    },
    {
        title: 'あそびかた 5',
        text: '制限時間内にすべての敵をたおすとステージクリアです。\n遊び方は以上です。'
    }
];

const TUTORIAL_HAND = ['森', '火', '雨', '空'];
const TUTORIAL_SPECIAL = ['花', '火', '爆', '発', '十', '字', '対', '角'];
const TUTORIAL_LOGICAL_STAGE_HEIGHT = 836;
const TUTORIAL_BOARD_BASE = [
    { x: 0, y: 1, char: '山' },
    { x: 6, y: 1, type: 'obstacle' },
    { x: 7, y: 6, type: 'enemy' },
    { x: 6, y: 7, char: '林' },
    { x: 2, y: 3, char: '花' },
    { x: 4, y: 3, type: 'enemy' },
    { x: 4, y: 4, type: 'enemy' },
    { x: 3, y: 4, type: 'obstacle' },
    { x: 2, y: 5, char: '川' }
];
const TUTORIAL_BOARD_AFTER_FIRST = [
    ...TUTORIAL_BOARD_BASE,
    { x: 1, y: 5, char: '森' }
];
const TUTORIAL_BOARD_AFTER_EXPLOSION = [
    { x: 0, y: 1, char: '山' },
    { x: 6, y: 1, type: 'obstacle' },
    { x: 7, y: 6, type: 'enemy' },
    { x: 6, y: 7, char: '林' },
    { x: 1, y: 5, char: '森' },
    { x: 2, y: 5, char: '川' }
];

let tutorialRefs = {};
let tutorialState = {
    step: 0,
    timers: [],
    cells: {},
    isInitialized: false
};

const TUTORIAL_TARGET_KEYS = ['2,3', '3,3'];
const TUTORIAL_BLAST_KEYS = ['2,3', '3,3', '4,3', '4,4', '3,4'];

function initTutorial() {
    tutorialRefs.screen = document.getElementById('tutorial-screen');
    tutorialRefs.grid = document.getElementById('tutorial-grid-container');
    tutorialRefs.hand = document.getElementById('tutorial-hand-container');
    tutorialRefs.launcher = document.getElementById('tutorial-launcher');
    tutorialRefs.guide = document.getElementById('tutorial-guide-line');
    tutorialRefs.shot = document.getElementById('tutorial-shot-tile');
    tutorialRefs.stepTitle = document.getElementById('tutorial-step-title');
    tutorialRefs.stepText = document.getElementById('tutorial-step-text');
    tutorialRefs.stepVal = document.getElementById('tutorial-step-val');
    tutorialRefs.enemyVal = document.getElementById('tutorial-enemy-val');
    tutorialRefs.prevBtn = document.getElementById('tutorial-prev-btn');
    tutorialRefs.nextBtn = document.getElementById('tutorial-next-btn');
    tutorialRefs.closeBtn = document.getElementById('tutorial-close-btn');
    tutorialRefs.stageShell = document.querySelector('.tutorial-stage-shell');
    tutorialRefs.stageScale = document.querySelector('.tutorial-stage-scale');
    tutorialRefs.textPanel = document.getElementById('tutorial-text-panel');
    tutorialRefs.controls = document.getElementById('tutorial-controls');
    tutorialRefs.stats = document.getElementById('tutorial-stats-container');

    if (!tutorialRefs.grid) return;

    tutorialRefs.grid.innerHTML = '';
    tutorialState.cells = {};
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            tutorialRefs.grid.appendChild(cell);
            tutorialState.cells[`${x},${y}`] = cell;
        }
    }

    tutorialState.isInitialized = true;
}

function openTutorial() {
    if (!tutorialState.isInitialized) initTutorial();
    if (!tutorialRefs.screen) return;

    clearTutorialTimers();
    document.getElementById('title-screen').style.display = 'none';
    tutorialRefs.screen.style.display = 'flex';
    tutorialState.step = 0;
    renderTutorialStep();
    updateTutorialLayout();
}

function closeTutorial() {
    clearTutorialTimers();
    if (tutorialRefs.screen) tutorialRefs.screen.style.display = 'none';
    document.getElementById('title-screen').style.display = 'flex';
}

function nextTutorialStep() {
    if (tutorialState.step >= TUTORIAL_STEPS.length - 1) return;
    tutorialState.step += 1;
    renderTutorialStep();
}

function prevTutorialStep() {
    if (tutorialState.step <= 0) return;
    tutorialState.step -= 1;
    renderTutorialStep();
}

function clearTutorialTimers() {
    tutorialState.timers.forEach(timer => clearTimeout(timer));
    tutorialState.timers = [];
}

function addTutorialTimer(callback, delay) {
    const timer = setTimeout(callback, delay);
    tutorialState.timers.push(timer);
}

function renderTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialState.step];
    if (!step) return;

    clearTutorialTimers();
    resetTutorialTransientUI();

    tutorialRefs.stepTitle.textContent = step.title;
    tutorialRefs.stepText.textContent = step.text;
    tutorialRefs.stepVal.textContent = `${tutorialState.step + 1}/${TUTORIAL_STEPS.length}`;
    tutorialRefs.prevBtn.disabled = tutorialState.step === 0;
    tutorialRefs.nextBtn.style.display = tutorialState.step === TUTORIAL_STEPS.length - 1 ? 'none' : 'inline-block';
    tutorialRefs.closeBtn.classList.toggle('final-step', tutorialState.step === TUTORIAL_STEPS.length - 1);
    updateTutorialLayout();

    if (tutorialState.step === 0) {
        renderTutorialBoard(TUTORIAL_BOARD_BASE);
        renderTutorialHand(0);
        setTutorialEnemyCount(3);
        playTutorialPlacementDemo();
    } else if (tutorialState.step === 1) {
        renderTutorialBoard(TUTORIAL_BOARD_AFTER_FIRST);
        renderTutorialHand(0, [0]);
        setTutorialEnemyCount(3);
        highlightTutorialCells(['3,3'], []);
    } else if (tutorialState.step === 2) {
        renderTutorialBoard(TUTORIAL_BOARD_AFTER_FIRST);
        renderTutorialHand(0, [0]);
        setTutorialEnemyCount(3);
        highlightTutorialCells(['3,3'], []);
        addTutorialTimer(() => {
            renderTutorialHand(1, [0], 1);
            highlightTutorialCells(['3,3'], ['3,3']);
        }, 700);
    } else if (tutorialState.step === 3) {
        renderTutorialBoard(TUTORIAL_BOARD_AFTER_FIRST);
        renderTutorialHand(1, [0]);
        setTutorialEnemyCount(3);
        highlightTutorialCells(['3,3'], ['3,3']);
        playTutorialExplosionDemo();
    } else {
        renderTutorialBoard(TUTORIAL_BOARD_AFTER_EXPLOSION);
        renderTutorialHand(1, [0, 1]);
        setTutorialEnemyCount(1);
    }
}

function resetTutorialTransientUI() {
    tutorialRefs.hand.classList.remove('tutorial-emphasis');
    tutorialRefs.launcher.style.display = 'none';
    tutorialRefs.guide.style.display = 'none';
    tutorialRefs.shot.style.display = 'none';
    tutorialRefs.shot.style.transition = 'none';
    tutorialRefs.shot.style.left = '-9999px';
    tutorialRefs.shot.style.top = '-9999px';
    const tutorialWindow = tutorialRefs.grid ? tutorialRefs.grid.parentElement : null;
    if (tutorialWindow) {
        tutorialWindow.classList.remove('shake');
        tutorialWindow.querySelectorAll('.particle').forEach(p => p.remove());
    }
}

function renderTutorialBoard(entries) {
    Object.values(tutorialState.cells).forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
        cell.style.filter = '';
    });

    entries.forEach(entry => {
        const cell = tutorialState.cells[`${entry.x},${entry.y}`];
        if (!cell) return;

        if (entry.type === 'enemy') {
            cell.classList.add('enemy');
        } else if (entry.type === 'obstacle') {
            cell.classList.add('occupied', 'obstacle');
            cell.textContent = '■';
        } else if (entry.char) {
            cell.textContent = entry.char;
            cell.classList.add('occupied');
            if (TUTORIAL_SPECIAL.includes(entry.char)) cell.classList.add('y-block');
            if (COLLECTION_KANJI.has(entry.char)) cell.classList.add('g-block');
        }
    });
}

function renderTutorialHand(selectedIndex, hiddenIndexes = [], popIndex = null) {
    const hiddenSet = new Set(Array.isArray(hiddenIndexes) ? hiddenIndexes : [hiddenIndexes]);
    tutorialRefs.hand.innerHTML = '';
    TUTORIAL_HAND.forEach((char, index) => {
        if (hiddenSet.has(index)) return;
        const tile = document.createElement('div');
        tile.className = 'hand-tile';
        tile.textContent = char;
        if (TUTORIAL_SPECIAL.includes(char)) tile.classList.add('y-block');
        if (COLLECTION_KANJI.has(char)) tile.classList.add('g-block');
        if (index === selectedIndex) tile.classList.add('selected');
        if (index === popIndex) tile.classList.add('tutorial-hand-pop');
        tutorialRefs.hand.appendChild(tile);
    });
}

function setTutorialEnemyCount(count) {
    tutorialRefs.enemyVal.textContent = count;
}

function highlightTutorialCells(hintKeys, specificKeys) {
    Object.values(tutorialState.cells).forEach(cell => {
        cell.classList.remove('hint-highlight', 'hint-specific', 'clearing-highlight', 'success-flash', 'exploding', 'fast', 'faster');
    });

    hintKeys.forEach(key => {
        const cell = tutorialState.cells[key];
        if (cell) cell.classList.add('hint-highlight');
    });
    specificKeys.forEach(key => {
        const cell = tutorialState.cells[key];
        if (cell) cell.classList.add('hint-specific');
    });
}

function applyTutorialTileStyle(el, char) {
    el.className = '';
    el.textContent = char;
    el.classList.add('hand-tile');
    if (TUTORIAL_SPECIAL.includes(char)) el.classList.add('y-block');
    if (COLLECTION_KANJI.has(char)) el.classList.add('g-block');
}

function showTutorialLauncher(char, row) {
    showTutorialLauncherWithDirection(char, row, 'left');
}

function hideTutorialLauncher() {
    tutorialRefs.launcher.style.display = 'none';
    tutorialRefs.guide.style.display = 'none';
}

function animateTutorialShot(char, row, targetX, targetY, onArrive, fromDir = 'left', removeHandIndex = null, hiddenBefore = []) {
    const gx = (GAME_SIZE - GRID_SIZE * TILE_SIZE) / 2;
    const gy = (GAME_SIZE - GRID_SIZE * TILE_SIZE) / 2;
    const pos = getTutorialLauncherPosition(fromDir, row, targetX);
    const endX = gx + targetX * TILE_SIZE;
    const endY = gy + targetY * TILE_SIZE;

    showTutorialLauncherWithDirection(char, row, fromDir, targetX);

    addTutorialTimer(() => {
        hideTutorialLauncher();
        if (removeHandIndex !== null) {
            renderTutorialHand(removeHandIndex, [...hiddenBefore, removeHandIndex]);
        }
        applyTutorialTileStyle(tutorialRefs.shot, char);
        tutorialRefs.shot.style.display = 'flex';
        tutorialRefs.shot.style.transition = 'none';
        tutorialRefs.shot.style.left = `${pos.startX}px`;
        tutorialRefs.shot.style.top = `${pos.startY}px`;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                tutorialRefs.shot.style.transition = 'left 0.55s linear, top 0.55s linear';
                tutorialRefs.shot.style.left = `${endX}px`;
                tutorialRefs.shot.style.top = `${endY}px`;
            });
        });
    }, 450);

    addTutorialTimer(() => {
        tutorialRefs.shot.style.display = 'none';
        hideTutorialLauncher();
        if (onArrive) onArrive();
    }, 1050);
}

function playTutorialPlacementDemo() {
    animateTutorialShot('森', 5, 1, 5, () => {
        renderTutorialBoard(TUTORIAL_BOARD_AFTER_FIRST);
        renderTutorialHand(0, [0]);
        addTutorialTimer(() => {
            if (tutorialState.step !== 0) return;
            renderTutorialBoard(TUTORIAL_BOARD_BASE);
            renderTutorialHand(0);
            playTutorialPlacementDemo();
        }, 1200);
    }, 'left', 0);
}

function playTutorialExplosionDemo() {
    showTutorialLauncherWithDirection('火', 3, 'right', 3);
    addTutorialTimer(() => showTutorialLauncherWithDirection('火', 3, 'bottom', 3), 1000);
    addTutorialTimer(() => {
        animateTutorialShot('火', 3, 3, 3, () => {
            renderTutorialBoard([
                ...TUTORIAL_BOARD_AFTER_FIRST,
                { x: 3, y: 3, char: '火' }
            ]);
            renderTutorialHand(1, [0, 1]);
            highlightTutorialCells(TUTORIAL_TARGET_KEYS, ['3,3']);

            TUTORIAL_TARGET_KEYS.forEach(key => {
                const cell = tutorialState.cells[key];
                if (cell) cell.classList.add('clearing-highlight', 'success-flash');
            });

            addTutorialTimer(() => {
                TUTORIAL_TARGET_KEYS.forEach(key => {
                    const cell = tutorialState.cells[key];
                    if (cell) cell.classList.remove('success-flash');
                });
                TUTORIAL_TARGET_KEYS.forEach(key => {
                    const cell = tutorialState.cells[key];
                    if (cell) cell.classList.add('exploding');
                });
            }, 600);

            addTutorialTimer(() => {
                TUTORIAL_TARGET_KEYS.forEach(key => {
                    const cell = tutorialState.cells[key];
                    if (cell) cell.classList.add('fast');
                });
            }, 1100);

            addTutorialTimer(() => {
                TUTORIAL_TARGET_KEYS.forEach(key => {
                    const cell = tutorialState.cells[key];
                    if (cell) cell.classList.add('faster');
                });
            }, 1600);

            addTutorialTimer(() => {
                const tutorialWindow = tutorialRefs.grid.parentElement;
                if (tutorialWindow) {
                    tutorialWindow.classList.remove('shake');
                    void tutorialWindow.offsetWidth;
                    tutorialWindow.classList.add('shake');
                }

                TUTORIAL_BLAST_KEYS.forEach(key => {
                    const [x, y] = key.split(',').map(Number);
                    createTutorialParticles(x, y);
                });
            }, 2100);

            addTutorialTimer(() => {
                const tutorialWindow = tutorialRefs.grid.parentElement;
                if (tutorialWindow) tutorialWindow.classList.remove('shake');
                renderTutorialBoard(TUTORIAL_BOARD_AFTER_EXPLOSION);
                setTutorialEnemyCount(1);
                
                addTutorialTimer(() => {
                    if (tutorialState.step !== 3) return;
                    renderTutorialBoard(TUTORIAL_BOARD_AFTER_FIRST);
                    renderTutorialHand(1, [0]);
                    setTutorialEnemyCount(3);
                    highlightTutorialCells(['3,3'], ['3,3']);
                    playTutorialExplosionDemo();
                }, 1500);
            }, 2380);
        }, 'top', 1, [0]);
    }, 2200);
}

function createTutorialParticles(x, y) {
    const tutorialWindow = tutorialRefs.grid ? tutorialRefs.grid.parentElement : null;
    const cell = tutorialState.cells[`${x},${y}`];
    if (!tutorialWindow || !cell) return;

    const gx = (GAME_SIZE - GRID_SIZE * TILE_SIZE) / 2;
    const gy = (GAME_SIZE - GRID_SIZE * TILE_SIZE) / 2;
    const centerX = gx + x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = gy + y * TILE_SIZE + TILE_SIZE / 2;
    const colors = ['#f28d35', '#fdcb6e', '#d63031', '#ffffff'];

    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.boxShadow = `0 0 10px ${p.style.backgroundColor}`;
        tutorialWindow.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        let px = centerX;
        let py = centerY;
        let opacity = 1;
        let scaleVal = 1 + Math.random() * 0.5;
        let lastTime = performance.now();

        const animate = (currentTime) => {
            const dt = (currentTime - lastTime) / 16.666;
            lastTime = currentTime;
            px += vx * dt;
            py += vy * dt;
            opacity -= 0.02 * dt;
            scaleVal -= 0.01 * dt;
            p.style.left = `${px}px`;
            p.style.top = `${py}px`;
            p.style.opacity = opacity;
            p.style.transform = `scale(${scaleVal})`;

            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                p.remove();
            }
        };

        requestAnimationFrame(animate);
    }
}

function updateTutorialLayout() {
    if (!tutorialRefs.screen || tutorialRefs.screen.style.display !== 'flex' || !tutorialRefs.stageScale) return;

    const logicalWidth = GAME_SIZE;
    const logicalHeight = TUTORIAL_LOGICAL_STAGE_HEIGHT;
    const availableWidth = tutorialRefs.screen.clientWidth - 8;
    const statsHeight = tutorialRefs.stats ? tutorialRefs.stats.offsetHeight : 0;
    const textHeight = tutorialRefs.textPanel ? tutorialRefs.textPanel.offsetHeight : 0;
    const controlsHeight = tutorialRefs.controls ? tutorialRefs.controls.offsetHeight : 0;
    const reservedHeight = statsHeight + textHeight + controlsHeight + 42;
    const availableHeight = Math.max(240, tutorialRefs.screen.clientHeight - reservedHeight);
    const tutorialScale = Math.min(availableWidth / logicalWidth, availableHeight / logicalHeight, 1.04);

    tutorialRefs.stageScale.style.transform = `scale(${tutorialScale})`;
    tutorialRefs.stageShell.style.height = `${logicalHeight * tutorialScale}px`;
}

function getTutorialLauncherPosition(fromDir, row, col = 0) {
    const gx = (GAME_SIZE - GRID_SIZE * TILE_SIZE) / 2;
    const gy = (GAME_SIZE - GRID_SIZE * TILE_SIZE) / 2;
    const startY = gy + row * TILE_SIZE;
    if (fromDir === 'right') {
        return {
            startX: gx + GRID_SIZE * TILE_SIZE + 10,
            startY,
            guideLeft: gx + (TILE_SIZE / 2),
            guideTop: startY + (TILE_SIZE / 2)
        };
    }
    if (fromDir === 'bottom') {
        return {
            startX: gx + col * TILE_SIZE,
            startY: gy + GRID_SIZE * TILE_SIZE + 10,
            guideLeft: gx + col * TILE_SIZE + (TILE_SIZE / 2),
            guideTop: gy + (TILE_SIZE / 2),
            vertical: true
        };
    }
    if (fromDir === 'top') {
        return {
            startX: gx + col * TILE_SIZE,
            startY: gy - 70,
            guideLeft: gx + col * TILE_SIZE + (TILE_SIZE / 2),
            guideTop: gy + (TILE_SIZE / 2),
            vertical: true
        };
    }
    return {
        startX: gx - 70,
        startY,
        guideLeft: gx + (TILE_SIZE / 2),
        guideTop: startY + (TILE_SIZE / 2)
    };
}

function showTutorialLauncherWithDirection(char, row, fromDir, col = 0) {
    const pos = getTutorialLauncherPosition(fromDir, row, col);

    applyTutorialTileStyle(tutorialRefs.launcher, char);
    tutorialRefs.launcher.style.display = 'flex';
    tutorialRefs.launcher.style.left = `${pos.startX}px`;
    tutorialRefs.launcher.style.top = `${pos.startY}px`;

    tutorialRefs.guide.style.display = 'block';
    tutorialRefs.guide.style.left = `${pos.guideLeft}px`;
    tutorialRefs.guide.style.top = `${pos.guideTop}px`;
    tutorialRefs.guide.style.width = pos.vertical ? '1px' : `${GRID_SIZE * TILE_SIZE}px`;
    tutorialRefs.guide.style.height = pos.vertical ? `${GRID_SIZE * TILE_SIZE}px` : '1px';
}
