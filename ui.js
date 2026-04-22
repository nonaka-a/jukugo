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
    
    const GAME_W = 750;
    const GAME_H = 750;
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

    const GAME_W = 750;
    const GAME_H = 750;
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
        if (h.isValid) h.coordLists.forEach(list => list.forEach(c => coordsToClear.add(c)));
        if (v.isValid) v.coordLists.forEach(list => list.forEach(c => coordsToClear.add(c)));

        coordsToClear.forEach(c => cellDOMs[c].classList.add('success-flash'));
        await new Promise(r => setTimeout(r, 400));
        coordsToClear.forEach(c => cellDOMs[c].classList.remove('success-flash'));

        coordsToClear.forEach(c => cellDOMs[c].classList.add('exploding'));
        
        for (let i = 3; i > 0; i--) {
            if (i === 2) coordsToClear.forEach(c => cellDOMs[c].classList.add('fast'));
            if (i === 1) coordsToClear.forEach(c => cellDOMs[c].classList.add('faster'));
            await new Promise(r => setTimeout(r, 1000));
        }

        screenShake();
        
        coordsToClear.forEach(c => {
            const [cx, cy] = c.split(',').map(Number);
            createParticles(cx, cy);
            damageNearbyEnemies(cx, cy);

            delete state.grid[c];
            const cell = cellDOMs[c];
            cell.textContent = '';
            cell.classList.remove('occupied', 'exploding', 'fast', 'faster', 'success-flash');
        });

        refreshHighlights();
        checkStageClear();
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
    gameWindow.classList.remove('shake');
    void gameWindow.offsetWidth; 
    gameWindow.classList.add('shake');
    setTimeout(() => gameWindow.classList.remove('shake'), 500);
}

function createParticles(x, y) {
    const GAME_W = 750;
    const GAME_H = 750;
    const gx = (GAME_W - GRID_SIZE * TILE_SIZE) / 2;
    const gy = (GAME_H - GRID_SIZE * TILE_SIZE) / 2;
    
    const centerX = gx + x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = gy + y * TILE_SIZE + TILE_SIZE / 2;

    for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        gameWindow.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        let px = centerX, py = centerY;
        let opacity = 1;

        const animate = () => {
            px += vx;
            py += vy;
            opacity -= 0.02;
            p.style.left = px + 'px';
            p.style.top = py + 'px';
            p.style.opacity = opacity;

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
    // ゲームウィンドウ（750px） + 手札エリア（約200px）の合計
    const GAME_W = 750;
    const GAME_H = 950; // 手札エリアを含めた仮想の高さ
    const STATS_H = 60; 
    const PADDING = 20;

    const availableW = window.innerWidth - PADDING * 2;
    const availableH = window.innerHeight - STATS_H - PADDING * 2;

    const scaleByW = availableW / GAME_W;
    const scaleByH = availableH / GAME_H;
    scale = Math.min(scaleByW, scaleByH, 1.0); 

    // main-area全体をスケールさせる
    const mainArea = document.getElementById('main-area');
    mainArea.style.transform = `scale(${scale})`;
    mainArea.style.transformOrigin = 'top center';
    
    // game-windowの個別設定を解除（親がスケールするため）
    gameWindow.style.transform = 'none';
    gameWindow.style.marginBottom = '0';
    gameWindow.style.setProperty('--current-scale', scale);

    const translateX = (GAME_W - (GRID_SIZE * TILE_SIZE)) / 2;
    const translateY = (GAME_H - 200 - (GRID_SIZE * TILE_SIZE)) / 2; // 少し上に調整
    gridElement.style.left = `${translateX}px`;
    gridElement.style.top = `${translateY}px`;
    gridElement.style.transform = `scale(1)`;
}

function placeTile(x, y, char) {
    state.grid[`${x},${y}`] = char;
    const cell = cellDOMs[`${x},${y}`];
    cell.textContent = char;
    cell.classList.add('occupied');
}