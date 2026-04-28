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

function updateStatsUI() {
    const stageEl = document.getElementById('stage-val');
    const enemyEl = document.getElementById('enemy-val');
    if (stageEl) stageEl.textContent = state.currentStage + 1;
    if (enemyEl) enemyEl.textContent = Object.keys(state.enemies).length;
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
        setTimeout(startRoulette, 2500); // 熟語をしっかり見せるために時間を延ばす
    }

    // パワーアップラベルの更新
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
            span.textContent = char;
            el.appendChild(span);
        });
    }
    rouletteState[id].strip = el;
    rouletteState[id].active = true;
    rouletteState[id].stopping = false;
    rouletteState[id].speed = 3 + Math.random() * 2;
    // 帯の中央付近から開始し、左右に十分な余裕を持たせる
    rouletteState[id].pos = -(data.length * 100 * 10);
}

function updateRoulette() {
    if (!state.isRouletteActive) return;

    ['upper', 'lower'].forEach(id => {
        const s = rouletteState[id];
        const dataWidth = s.data.length * 100;
        
        if (s.active) {
            s.pos += s.speed;
            // 右に行き過ぎたら左にワープさせる
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
    const centerOffset = 120; // 170 - 50
    
    // 現在のposから、次にcenterOffsetに一致するposを計算
    // k = (centerOffset - pos) / charWidth
    // Math.roundを使用することで、最も近い文字（手前の文字を含む）にスナップさせます
    let currentK = (centerOffset - s.pos) / charWidth;
    let targetK = Math.round(currentK); 
    
    s.targetPos = centerOffset - targetK * charWidth;
    
    // ターゲットが現在の位置より後ろ（左）になってしまった場合は、
    // 最低限現在の速度分は進ませて次の文字にする
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
    // 完全に止まるまで待つ
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
            // 「爆発」は即時発動なのでランプを消費しない
            if (word === "爆発") {
                state.lampCount = 0;
                state.isPowerUpActive = false;
            } else {
                state.lampCount = 5; // 赤ランプ5個からスタート
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
        // 全マスを赤くハイライト（予告演出）
        Object.keys(cellDOMs).forEach(key => {
            cellDOMs[key].classList.add('power-range-highlight');
        });
        
        // 少し遅らせて一斉爆発
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
                    cell.className = 'cell'; // 全ての装飾クラスをリセット
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
    
    // GAME_SIZEを使用
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
        updateLauncherUI(gx, gy);
    } else {
        launcherElement.style.display = 'none';
        guideLineElement.style.display = 'none';
    }
}

function updateLauncherUI(gx, gy) {
    launcherElement.style.display = 'flex';
    launcherElement.textContent = state.launcher.char;
    
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
    gameWindow.appendChild(shooter);

    // GAME_SIZEを使用
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

    const h = validateLine(x, y, true);
    const v = validateLine(x, y, false);
    
    if (h.isValid || v.isValid) {
        const coordsToClear = new Set();
        const foundWords = [];
        if (h.isValid) { h.coordLists.forEach(list => list.forEach(c => coordsToClear.add(c))); foundWords.push(...h.words); }
        if (v.isValid) { v.coordLists.forEach(list => list.forEach(c => coordsToClear.add(c))); foundWords.push(...v.words); }

        // 爆発予告（パワーアップ適用時などの全範囲を赤く光らせる）
        const allExplosionCoords = new Set();
        const coordsArray = Array.from(coordsToClear);
        coordsArray.forEach((c, idx) => {
            const [cx, cy] = c.split(',').map(Number);
            // 範囲爆発は全員分追加
            getExplosionCoords(cx, cy).forEach(ec => allExplosionCoords.add(ec));
            // ライン爆発（十字・対角）は最初の1文字分だけ追加して重複を防ぐ
            if (idx === 0) {
                getPowerUpLines(cx, cy).forEach(ec => allExplosionCoords.add(ec));
            }
        });

        allExplosionCoords.forEach(c => {
            if (cellDOMs[c]) cellDOMs[c].classList.add('power-range-highlight');
        });

        coordsToClear.forEach(c => cellDOMs[c].classList.add('success-flash'));
        await new Promise(r => setTimeout(r, 600)); // 少し長めに予告を見せる
        
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
            // ダメージ処理も同様に、ライン爆発は1回だけにする
            damageNearbyEnemies(cx, cy, idx > 0);

            delete state.grid[c];
            const cell = cellDOMs[c];
            cell.textContent = '';
            cell.classList.remove('occupied', 'exploding', 'fast', 'faster', 'success-flash');
        });

        refreshHighlights();
        
        // 熟語完成時のランプ処理
        if (state.isPowerUpActive) {
            // パワーアップ中はランプを減らす（カウントダウン）
            state.lampCount = Math.max(0, state.lampCount - foundWords.length);
            if (state.lampCount <= 0) {
                state.isPowerUpActive = false;
                state.powerUps = { explosionRange: 1, isCross: false, isDiagonal: false };
            }
        } else {
            // 通常時はランプを増やす（チャージ）
            state.lampCount = Math.min(5, state.lampCount + foundWords.length);
        }
        updateLampsUI();
        
        setTimeout(() => {
            const uniqueWords = [...new Set(foundWords)];
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
    void mainArea.offsetWidth; // 強制リフロー
    mainArea.classList.add('shake');
    setTimeout(() => mainArea.classList.remove('shake'), 500);
}

function createParticles(x, y) {
    // GAME_SIZEを使用
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
            const dt = (currentTime - lastTime) / 16.666; // 60fpsを基準(1.0)とした経過時間
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
    document.querySelectorAll('.hint-highlight').forEach(c => c.classList.remove('hint-highlight'));
    document.querySelectorAll('.hint-specific').forEach(c => c.classList.remove('hint-specific'));

    if (state.difficulty === 'hard') return;

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

    uniqueValidTargets.forEach(key => {
        if (cellDOMs[key]) cellDOMs[key].classList.add('hint-highlight');
    });
    
    specificTargets.forEach(key => {
        if (cellDOMs[key]) cellDOMs[key].classList.add('hint-specific');
    });
}

function resetView() {
    // GAME_SIZEを使用
    const GAME_W = GAME_SIZE;
    const GAME_H = 880; // 手札エリアを含めた全体の高さ目安
    const STATS_H = 60; 
    const PADDING = 20;

    const availableW = window.innerWidth - PADDING * 2;
    const availableH = window.innerHeight - STATS_H - PADDING * 2;

    const scaleByW = availableW / GAME_W;
    const scaleByH = availableH / GAME_H;
    scale = Math.min(scaleByW, scaleByH, 1.0); 

    // containerでサイズを固定する
    const container = document.getElementById('main-area-container');
    container.style.width = `${GAME_W}px`;
    container.style.height = `${GAME_H}px`;
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = 'top center';
    
    // アニメーション中のスケール上書きを防ぐため、ここでのtransform設定を整理
    const mainArea = document.getElementById('main-area');
    mainArea.style.transform = 'none'; 

    const translateX = (GAME_W - (GRID_SIZE * TILE_SIZE)) / 2;
    const translateY = (GAME_SIZE - (GRID_SIZE * TILE_SIZE)) / 2; // GAME_SIZEに変更
    gridElement.style.left = `${translateX}px`;
    gridElement.style.top = `${translateY}px`;
}

function placeTile(x, y, char) {
    state.grid[`${x},${y}`] = char;
    const cell = cellDOMs[`${x},${y}`];
    cell.textContent = char;
    cell.classList.add('occupied');
}

function toggleHistory() {
    const overlay = document.getElementById('history-overlay');
    const isOpening = overlay.style.display !== 'flex';
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

            // 履歴に追加
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

            // 意味ボックスの作成
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
                
                utterance.onend = () => {
                    // ダッキング終了処理を削除
                };
                
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
    if (overlay) overlay.style.display = 'flex';
}

function nextStage() {
    const overlay = document.getElementById('stage-clear-overlay');
    if (overlay) overlay.style.display = 'none';
    loadStage(state.currentStage + 1);
}

function backToTitleFromClear() {
    const overlay = document.getElementById('stage-clear-overlay');
    if (overlay) overlay.style.display = 'none';
    backToTitle();
}