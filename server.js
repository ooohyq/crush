const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

// Настройки игры
const ROUND_WAIT = 5; // сек ожидания между раундами
const GROWTH_PER_SEC = 0.5; // сколько растёт коэффициент за секунду
const RTP = 0.7;

// Сервер
const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let state = {
  phase: 'waiting', // waiting | running | crashed
  coefficient: 1.00,
  history: [],
  time_left: ROUND_WAIT,
  crash_at: 0,
  round_start: Date.now(),
  round_id: 0,
};

function rngCrash(rtp = RTP) {
  // Честный random
  let rnd = Math.random();
  // crash in 1.00.. (не бесконечно)
  let crash = Math.floor((1 / (1 - rnd * rtp)) * 100) / 100;
  return Math.max(1, crash);
}

function startRound() {
  state.phase = 'waiting';
  state.coefficient = 1.00;
  state.time_left = ROUND_WAIT;
  state.crash_at = rngCrash();
  state.round_start = Date.now();
  state.round_id += 1;
  broadcast();
}

function tick() {
  const now = Date.now();
  if (state.phase === 'waiting') {
    state.time_left = ROUND_WAIT - ((now - state.round_start) / 1000);
    if (state.time_left <= 0) {
      // Начинаем рост
      state.phase = 'running';
      state.round_start = Date.now();
      state.coefficient = 1.00;
      broadcast();
    }
  } else if (state.phase === 'running') {
    let elapsed = (now - state.round_start) / 1000;
    state.coefficient = Math.floor((1 + GROWTH_PER_SEC * elapsed) * 100) / 100;
    if (state.coefficient >= state.crash_at) {
      state.coefficient = state.crash_at;
      state.phase = 'crashed';
      state.round_start = Date.now();
      // Сохраняем в историю
      state.history.unshift(state.crash_at);
      if (state.history.length > 5) state.history.length = 5;
      broadcast();
    } else {
      broadcast(false); // не спамим историю, только коэффициент
    }
  } else if (state.phase === 'crashed') {
    state.time_left = ROUND_WAIT - ((now - state.round_start) / 1000);
    if (state.time_left <= 0) {
      startRound();
    }
  }
}

function broadcast(includeHistory = true) {
  const payload = {
    ...state,
    history: includeHistory ? state.history : undefined // чтобы не спамить историю
  };
  const msg = JSON.stringify(payload);
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

// WebSocket для клиентов
wss.on('connection', ws => {
  ws.send(JSON.stringify(state));
});

setInterval(tick, 33); // плавная анимация
startRound();

const PORT = 3001;
server.listen(PORT, () => console.log('Crash server started on port', PORT));