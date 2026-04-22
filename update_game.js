const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Replace stats container
html = html.replace(/<div id="stats-container">[\s\S]*?<\/div>/, `<div id="stats-container">
        <div style="color:#0984e3">👤 YOU陣地: <span id="stat-player">0</span>マス</div>
        <div style="color:#d63031">🤖 CPU陣地: <span id="stat-cpu">0</span>マス</div>
    </div>`);

// Replace game layout
html = html.replace(/<div id="game-layout">[\s\S]*?<script>/, `<div id="game-layout">
        <div id="cpu-sidebar" class="sidebar">
            <h3 class="cpu-title">🤖 CPU</h3>
            <div id="cpu-hand-container" class="hand-container"></div>
        </div>

        <div id="main-area">
            <div id="controls">
                <button onclick="zoom(0.2)">➕ 拡大</button>
                <button onclick="zoom(-0.2)">➖ 縮小</button>
                <button onclick="resetView()">🎯 リセット</button>
                <button class="shuffle-btn" onclick="shuffleHand()">🔄 シャッフル (自分)</button>
                <button class="hint-btn" onclick="showHint()">💡 ヒント</button>
                <button id="bgm-btn" class="bgm-btn" onclick="toggleBGM()">🔇 BGM</button>
            </div>

            <div id="game-window">
                <div id="grid-container"></div>
            </div>
        </div>

        <div id="player-sidebar" class="sidebar">
            <h3 class="player-title">👤 YOU</h3>
            <div id="player-hand-container" class="hand-container"></div>
        </div>
    </div>

<script>`);

fs.writeFileSync('index.html', html);
