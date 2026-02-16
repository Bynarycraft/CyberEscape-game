interface Player {
  x: number;
  y: number;
  size: number;
  speed: number;
  health: number;
  isInvulnerable: boolean;
}

interface Virus {
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  life: number;
  alpha: number;
  color: {
    r: number;
    g: number;
    b: number;
  };
}

interface BackgroundNode {
  x: number;
  y: number;
  radius: number;
  speed: number;
}

interface Trail {
  x: number;
  y: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
}

interface CodeStream {
  x: number;
  y: number;
  speed: number;
  spacing: number;
  length: number;
  chars: string[];
}

interface PowerUp {
  x: number;
  y: number;
  size: number;
  speed: number;
  type: "shield" | "slowMo" | "multiplier" | "health";
  spawnTime: number;
}

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score") as HTMLSpanElement;
const healthEl = document.getElementById("health") as HTMLSpanElement;
const difficultyEl = document.getElementById("difficulty") as HTMLSpanElement;
const overlay = document.getElementById("overlay") as HTMLDivElement;
const finalScoreEl = document.getElementById("finalScore") as HTMLSpanElement;
const restartBtn = document.getElementById("restartBtn") as HTMLButtonElement;
const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
const muteBtn = document.getElementById("muteBtn") as HTMLButtonElement;
const hud = document.querySelector(".hud") as HTMLDivElement;

if (!ctx) {
  throw new Error("Canvas 2D context not available");
}

const AudioContextRef =
  window.AudioContext ||
  (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

let player: Player;
let viruses: Virus[] = [];
let particles: Particle[] = [];
let trails: Trail[] = [];
let backgroundNodes: BackgroundNode[] = [];
let codeStreams: CodeStream[] = [];
let powerUps: PowerUp[] = [];
let keys: Record<string, boolean> = {};
let touchActive = false;
let touchX = 0;
let touchY = 0;
let lastTime = 0;
let spawnTimer = 0;
let spawnInterval = 900;
let score = 0;
let difficulty = 1;
let elapsed = 0;
let running = true;
let gamePaused = false;
let invulnerabilityTimer = 0;
let shakeTimer = 0;
let zoomTimer = 0;
let zoomDuration = 0.2;
let zoomStrength = 0.03;
let audioCtx: AudioContext | null = null;
let isMuted = false;
let shimmerIntensity = 0;
let glowPulse = 0;
let scorePulseTimer = 0;
let nextScoreMilestone = 100;
let waveViruses = 0;
let wavesPassed = 0;
let pauseTimer = 0;
let isPaused = false;
let shieldActive = false;
let slowMotionTimer = 0;
let scoreMultiplier = 1;
let multiplierTimer = 0;

const maxHealth = 3;
const baseSpawnInterval = 900;
const minSpawnInterval = 220;
const baseVirusSpeed = 90;
const adaptiveSmoothing = 0.08;
const invulnerabilityDuration = 0.8;
const shakeDuration = 0.3;
const maxShake = 10;
const gridSpacing = 80;
const gridSpeed = 20;
const codeChars = "0123456789ABCDEF<>/{}[]#$";
const waveSize = 10;
const pauseDuration = 2;
const touchSpeedMultiplier = 1.2;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  backgroundNodes = createBackgroundNodes();
  codeStreams = createCodeStreams();
};

const createBackgroundNodes = (): BackgroundNode[] =>
  Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.6 + 0.4,
    speed: Math.random() * 20 + 10,
  }));

const createCodeStreams = (): CodeStream[] =>
  Array.from({ length: 18 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: Math.random() * 40 + 30,
    spacing: Math.random() * 12 + 14,
    length: Math.floor(Math.random() * 8 + 8),
    chars: Array.from({ length: 28 }, () =>
      codeChars[Math.floor(Math.random() * codeChars.length)]
    ),
  }));

const resetGame = () => {
  player = {
    x: canvas.width / 2 - 18,
    y: canvas.height - 120,
    size: 36,
    speed: 320,
    health: maxHealth,
    isInvulnerable: false,
  };
  viruses = [];
  particles = [];
  trails = [];
  powerUps = [];
  keys = {};
  lastTime = 0;
  spawnTimer = 0;
  spawnInterval = baseSpawnInterval;
  score = 0;
  difficulty = 1;
  elapsed = 0;
  running = true;
  gamePaused = false;
  invulnerabilityTimer = 0;
  shakeTimer = 0;
  zoomTimer = 0;
  shimmerIntensity = 0;
  glowPulse = 0;
  scorePulseTimer = 0;
  nextScoreMilestone = 100;
  waveViruses = 0;
  wavesPassed = 0;
  pauseTimer = 0;
  isPaused = false;
  shieldActive = false;
  slowMotionTimer = 0;
  scoreMultiplier = 1;
  multiplierTimer = 0;
  overlay.classList.add("hidden");
  updateHud();
  updateMuteUi();
};

const updateHud = () => {
  scoreEl.textContent = Math.floor(score).toString();
  const filled = "&#9829;".repeat(player.health);
  const empty = "&#9825;".repeat(Math.max(0, maxHealth - player.health));
  healthEl.innerHTML = filled + empty;
  difficultyEl.textContent = difficulty.toString();
};

const updateMuteUi = () => {
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";
};

const toggleGamePause = () => {
  gamePaused = !gamePaused;
  pauseBtn.textContent = gamePaused ? "Resume" : "Pause";
};

const toggleMute = () => {
  isMuted = !isMuted;
  updateMuteUi();
};

const getHighScores = (): number[] => {
  const stored = localStorage.getItem("cyberEscapeScores");
  return stored ? JSON.parse(stored) : [];
};

const saveHighScore = (newScore: number) => {
  let scores = getHighScores();
  scores.push(newScore);
  scores = scores.sort((a, b) => b - a).slice(0, 5);
  localStorage.setItem("cyberEscapeScores", JSON.stringify(scores));
  return scores;
};

const isHighScore = (newScore: number): boolean => {
  const scores = getHighScores();
  return scores.length < 5 || newScore > scores[scores.length - 1];
};

const displayHighScores = () => {
  const scores = getHighScores();
  const leaderboardEl = document.getElementById("leaderboard") as HTMLDivElement;
  if (leaderboardEl) {
    leaderboardEl.innerHTML = "<h3>Top 5 Scores</h3>" + 
      scores.map((s, i) => `<div>#${i + 1}: ${s}</div>`).join("");
  }
};

const ensureAudioContext = () => {
  if (isMuted || !AudioContextRef) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextRef();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number
) => {
  const context = ensureAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    context.currentTime + duration
  );
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
};

const playImpactSound = (intensity: number) => {
  playTone(200 + intensity * 90, 0.08, "square", 0.04 * intensity);
};

const playExplosionSound = (intensity: number) => {
  playTone(130 + intensity * 120, 0.16, "sawtooth", 0.035 * intensity);
};

const playGameOverSound = () => {
  playTone(90, 0.4, "triangle", 0.06);
};

const spawnVirus = () => {
  if (isPaused || pauseTimer > 0) return;
  const size = Math.random() * 18 + 20;
  const x = Math.random() * (canvas.width - size);
  const scalar = getAdaptiveScalar();
  const speed = baseVirusSpeed * scalar + difficulty * 18 + Math.random() * 40;
  viruses.push({ x, y: -size, size, speed });
  waveViruses += 1;
  
  if (waveViruses >= waveSize) {
    isPaused = true;
    pauseTimer = pauseDuration;
    waveViruses = 0;
    wavesPassed += 1;
  }
};

const updatePlayer = (delta: number) => {
  let dx = 0;
  let dy = 0;

  // Keyboard controls
  if (keys.arrowleft || keys.a) dx -= 1;
  if (keys.arrowright || keys.d) dx += 1;
  if (keys.arrowup || keys.w) dy -= 1;
  if (keys.arrowdown || keys.s) dy += 1;

  // Touch controls - move towards touch point
  if (touchActive) {
    const playerCenterX = player.x + player.size / 2;
    const playerCenterY = player.y + player.size / 2;
    const distX = touchX - playerCenterX;
    const distY = touchY - playerCenterY;
    const distance = Math.hypot(distX, distY);
    
    if (distance > 5) {
      dx = distX / distance;
      dy = distY / distance;
    }
  }

  const magnitude = Math.hypot(dx, dy) || 1;
  const speed = player.speed * (touchActive ? touchSpeedMultiplier : 1);
  player.x += (dx / magnitude) * speed * delta;
  player.y += (dy / magnitude) * speed * delta;

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  addTrail(player.x, player.y, player.size, "rgba(76, 201, 255, 0.35)", 1.8);
};

const updateViruses = (delta: number) => {
  const speedMultiplier = slowMotionTimer > 0 ? 0.5 : 1;
  viruses.forEach((virus) => {
    virus.y += virus.speed * delta * speedMultiplier;
    if (Math.random() > 0.4) {
      addTrail(
        virus.x,
        virus.y,
        virus.size,
        "rgba(255, 59, 59, 0.35)",
        1.6
      );
    }
  });
  viruses = viruses.filter((virus) => virus.y < canvas.height + virus.size);
};

const updateParticles = (delta: number) => {
  particles.forEach((particle) => {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.life -= delta;
    particle.alpha = Math.max(0, particle.life / 0.6);
  });
  particles = particles.filter((particle) => particle.life > 0);
};

const addTrail = (
  x: number,
  y: number,
  size: number,
  color: string,
  decay: number
) => {
  if (trails.length > 480) {
    trails.shift();
  }
  trails.push({
    x,
    y,
    size,
    alpha: 0.45,
    decay,
    color,
  });
};

const updateTrails = (delta: number) => {
  trails.forEach((trail) => {
    trail.alpha -= trail.decay * delta;
  });
  trails = trails.filter((trail) => trail.alpha > 0.02);
};

const getExplosionIntensity = (virus: Virus) => {
  const sizeBoost = (virus.size - 20) / 20;
  return clamp(0.7 + sizeBoost * 0.5, 0.7, 1.2);
};

const triggerExplosion = (x: number, y: number, intensity: number) => {
  spawnParticles(x, y, intensity);
  playExplosionSound(intensity);
  triggerShimmer(0.5 * intensity);
  triggerGlowPulse(0.5 * intensity);
  if (Math.random() < 0.5) {
    spawnPowerUp();
  }
};

const detectCollisions = () => {
  viruses = viruses.filter((virus) => {
    const hit =
      player.x < virus.x + virus.size &&
      player.x + player.size > virus.x &&
      player.y < virus.y + virus.size &&
      player.y + player.size > virus.y;

    if (hit && !player.isInvulnerable) {
      const intensity = getExplosionIntensity(virus);
      if (shieldActive) {
        shieldActive = false;
        triggerExplosion(virus.x + virus.size / 2, virus.y + virus.size / 2, intensity * 0.8);
        playImpactSound(intensity * 0.8);
      } else {
        player.health -= 1;
        triggerExplosion(virus.x + virus.size / 2, virus.y + virus.size / 2, intensity);
        triggerInvulnerability();
        triggerShake();
        triggerZoom(0.035, 0.2);
        playImpactSound(intensity);
        updateHud();
        if (player.health <= 0) {
          endGame();
        }
      }
      return false;
    }
    return true;
  });
  
  powerUps = powerUps.filter((powerUp) => {
    const hit =
      player.x < powerUp.x + powerUp.size &&
      player.x + player.size > powerUp.x &&
      player.y < powerUp.y + powerUp.size &&
      player.y + player.size > powerUp.y;
    
    if (hit) {
      activatePowerUp(powerUp.type);
      return false;
    }
    return true;
  });
};

const spawnParticles = (x: number, y: number, intensity: number) => {
  const count = Math.min(26, Math.floor(14 + intensity * 10));
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 160 + 60) * intensity;
    const tint = clamp(intensity * 0.7, 0.6, 1.1);
    const color = {
      r: Math.floor(210 + 45 * tint),
      g: Math.floor(40 + 25 * tint),
      b: Math.floor(40 + 30 * tint),
    };
    particles.push({
      x,
      y,
      radius: (Math.random() * 2.6 + 0.8) * intensity,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6,
      alpha: 1,
      color,
    });
  }
};

const spawnPowerUp = () => {
  const types: ("shield" | "slowMo" | "multiplier" | "health")[] = [
    "shield",
    "slowMo",
    "multiplier",
    "health",
  ];
  const type = types[Math.floor(Math.random() * types.length)];
  const size = 36;
  const x = Math.random() * (canvas.width - size);
  const speed = baseVirusSpeed * 0.6 + difficulty * 10 + Math.random() * 20;
  powerUps.push({
    x,
    y: -size,
    size,
    speed,
    type,
    spawnTime: elapsed,
  });
};

const activatePowerUp = (type: "shield" | "slowMo" | "multiplier" | "health") => {
  switch (type) {
    case "shield":
      shieldActive = true;
      playTone(800, 0.2, "square", 0.06);
      break;
    case "slowMo":
      slowMotionTimer = 5;
      playTone(600, 0.15, "triangle", 0.05);
      break;
    case "multiplier":
      scoreMultiplier = 2;
      multiplierTimer = 8;
      playTone(1000, 0.2, "square", 0.06);
      triggerGlowPulse(0.6);
      break;
    case "health":
      player.health += 1;
      updateHud();
      playTone(720, 0.18, "triangle", 0.06);
      triggerGlowPulse(0.5);
      break;
  }
};

const triggerInvulnerability = () => {
  player.isInvulnerable = true;
  invulnerabilityTimer = invulnerabilityDuration;
};

const updateInvulnerability = (delta: number) => {
  if (!player.isInvulnerable) return;
  invulnerabilityTimer -= delta;
  if (invulnerabilityTimer <= 0) {
    player.isInvulnerable = false;
    invulnerabilityTimer = 0;
  }
};

const triggerShake = () => {
  shakeTimer = shakeDuration;
};

const updateShake = (delta: number) => {
  if (shakeTimer > 0) {
    shakeTimer = Math.max(0, shakeTimer - delta);
  }
};

const getShakeOffset = () => {
  if (shakeTimer <= 0) return { x: 0, y: 0 };
  const intensity = (shakeTimer / shakeDuration) ** 2;
  const magnitude = maxShake * intensity;
  return {
    x: (Math.random() * 2 - 1) * magnitude,
    y: (Math.random() * 2 - 1) * magnitude,
  };
};

const triggerZoom = (strength: number, duration: number) => {
  zoomStrength = strength;
  zoomDuration = duration;
  zoomTimer = duration;
};

const updateZoom = (delta: number) => {
  if (zoomTimer > 0) {
    zoomTimer = Math.max(0, zoomTimer - delta);
  }
};

const getZoomScale = () => {
  if (zoomTimer <= 0) return 1;
  const t = zoomTimer / zoomDuration;
  return 1 + zoomStrength * t;
};

const triggerShimmer = (strength: number) => {
  shimmerIntensity = clamp(shimmerIntensity + strength, 0, 1);
};

const updateShimmer = (delta: number) => {
  shimmerIntensity = Math.max(0, shimmerIntensity - delta * 2.4);
};

const triggerGlowPulse = (strength: number) => {
  glowPulse = clamp(glowPulse + strength, 0, 1.5);
};

const updateGlowPulse = (delta: number) => {
  glowPulse += (0 - glowPulse) * 3 * delta;
};

const updateScorePulse = (delta: number) => {
  if (score >= nextScoreMilestone) {
    while (score >= nextScoreMilestone) {
      nextScoreMilestone += 100;
    }
    scorePulseTimer = 0.4;
    triggerGlowPulse(0.4);
  }
  if (scorePulseTimer > 0) {
    scorePulseTimer = Math.max(0, scorePulseTimer - delta);
    hud.classList.add("pulse");
  } else {
    hud.classList.remove("pulse");
  }
};

const updatePowerUps = (delta: number) => {
  if (slowMotionTimer > 0) {
    slowMotionTimer -= delta;
  }
  if (multiplierTimer > 0) {
    multiplierTimer -= delta;
  } else if (scoreMultiplier === 2) {
    scoreMultiplier = 1;
  }

  const speedMultiplier = slowMotionTimer > 0 ? 0.5 : 1;
  powerUps.forEach((powerUp) => {
    powerUp.y += powerUp.speed * delta * speedMultiplier;
    if (Math.random() > 0.6) {
      addTrail(
        powerUp.x,
        powerUp.y,
        powerUp.size,
        "rgba(255, 215, 120, 0.35)",
        1.4
      );
    }
  });
  powerUps = powerUps.filter((powerUp) => powerUp.y < canvas.height + 50);
};

const updateWavePause = (delta: number) => {
  if (pauseTimer > 0) {
    pauseTimer -= delta;
  } else if (isPaused) {
    isPaused = false;
  }
};

const getAdaptiveScalar = () => {
  const scoreFactor = 1 + Math.min(1.5, score / 700);
  const timeFactor = 1 + Math.min(0.8, elapsed / 100);
  return scoreFactor * timeFactor;
};

const updateDifficulty = () => {
  const combined = elapsed + score / 40;
  const nextLevel = Math.floor(combined / 10) + 1;
  if (nextLevel !== difficulty) {
    difficulty = nextLevel;
    updateHud();
  }
  const targetInterval = Math.max(
    minSpawnInterval,
    baseSpawnInterval / getAdaptiveScalar() - difficulty * 18
  );
  spawnInterval += (targetInterval - spawnInterval) * adaptiveSmoothing;
};

const updateCodeStreams = (delta: number) => {
  codeStreams.forEach((stream) => {
    stream.y += stream.speed * delta;
    if (stream.y - stream.length * stream.spacing > canvas.height + 40) {
      stream.y = -Math.random() * canvas.height * 0.3;
      stream.x = Math.random() * canvas.width;
    }
  });
};

const renderGrid = () => {
  const offset = (elapsed * gridSpeed) % gridSpacing;
  ctx.strokeStyle = "rgba(76, 201, 255, 0.08)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = -gridSpacing + offset; y <= canvas.height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
};

const renderBackground = (delta: number) => {
  const flicker = shimmerIntensity * (0.5 + 0.5 * Math.sin(elapsed * 40));
  const baseAlpha = 0.32 + flicker * 0.08;
  ctx.fillStyle = `rgba(5, 6, 13, ${baseAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  renderGrid();
  updateCodeStreams(delta);

  ctx.font = "12px 'Rajdhani', monospace";
  codeStreams.forEach((stream) => {
    for (let i = 0; i < stream.length; i += 1) {
      const char = stream.chars[(i + Math.floor(elapsed * 12)) % stream.chars.length];
      const alpha = (1 - i / stream.length) * 0.35;
      ctx.fillStyle = `rgba(76, 201, 255, ${alpha})`;
      ctx.fillText(char, stream.x, stream.y - i * stream.spacing);
    }
  });

  backgroundNodes.forEach((node) => {
    node.y += node.speed * delta;
    if (node.y > canvas.height + 20) {
      node.y = -20;
      node.x = Math.random() * canvas.width;
    }
    ctx.beginPath();
    ctx.fillStyle = "rgba(76, 201, 255, 0.55)";
    ctx.shadowBlur = 12 + glowPulse * 2;
    ctx.shadowColor = "rgba(76, 201, 255, 0.6)";
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
};

const getPlayerProximity = () => {
  if (viruses.length === 0) return 0;
  const playerCenterX = player.x + player.size / 2;
  const playerCenterY = player.y + player.size / 2;
  let minDistance = Infinity;

  viruses.forEach((virus) => {
    const dx = virus.x + virus.size / 2 - playerCenterX;
    const dy = virus.y + virus.size / 2 - playerCenterY;
    const distance = Math.hypot(dx, dy);
    if (distance < minDistance) {
      minDistance = distance;
    }
  });

  const normalized = 1 - Math.min(minDistance, 240) / 240;
  return clamp(normalized, 0, 1);
};

const renderPlayer = () => {
  const flash = player.isInvulnerable && Math.sin(elapsed * 20) > 0;
  const proximity = getPlayerProximity();
  const glow = 18 + proximity * 10 + glowPulse * 8;
  ctx.globalAlpha = flash ? 0.4 : 1;
  ctx.fillStyle = "#4cc9ff";
  ctx.shadowBlur = glow;
  ctx.shadowColor = "rgba(76, 201, 255, 0.9)";
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
};

const renderViruses = () => {
  ctx.fillStyle = "#ff3b3b";
  viruses.forEach((virus) => {
    const dx = virus.x + virus.size / 2 - (player.x + player.size / 2);
    const dy = virus.y + virus.size / 2 - (player.y + player.size / 2);
    const distance = Math.hypot(dx, dy);
    const proximity = 1 - Math.min(distance, 260) / 260;
    ctx.shadowBlur = 12 + clamp(proximity, 0, 1) * 8 + glowPulse * 6;
    ctx.shadowColor = "rgba(255, 59, 59, 0.9)";
    ctx.fillRect(virus.x, virus.y, virus.size, virus.size);
  });
  ctx.shadowBlur = 0;
};

const renderTrails = () => {
  trails.forEach((trail) => {
    ctx.globalAlpha = trail.alpha;
    ctx.fillStyle = trail.color;
    ctx.fillRect(trail.x, trail.y, trail.size, trail.size);
  });
  ctx.globalAlpha = 1;
};

const renderParticles = () => {
  particles.forEach((particle) => {
    ctx.beginPath();
    const { r, g, b } = particle.color;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.alpha})`;
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
};

const renderPowerUps = () => {
  powerUps.forEach((powerUp) => {
    const age = elapsed - powerUp.spawnTime;
    const pulse = 1 + Math.sin(age * 8) * 0.15;
    const displaySize = powerUp.size * pulse;
    const offset = displaySize - powerUp.size;
    
    let color = "";
    let glowColor = "";
    let icon = "";
    
    if (powerUp.type === "shield") {
      color = "rgba(100, 200, 255, 0.9)";
      glowColor = "rgba(100, 200, 255, 0.8)";
      icon = "⊗";
    } else if (powerUp.type === "slowMo") {
      color = "rgba(200, 100, 255, 0.9)";
      glowColor = "rgba(200, 100, 255, 0.8)";
      icon = "◆";
    } else if (powerUp.type === "multiplier") {
      color = "rgba(255, 200, 50, 0.9)";
      glowColor = "rgba(255, 200, 50, 0.8)";
      icon = "★";
    } else if (powerUp.type === "health") {
      color = "rgba(80, 220, 140, 0.9)";
      glowColor = "rgba(80, 220, 140, 0.8)";
      icon = "+";
    }
    
    ctx.fillStyle = color;
    ctx.shadowBlur = 28 * pulse;
    ctx.shadowColor = glowColor;
    ctx.fillRect(powerUp.x - offset / 2, powerUp.y - offset / 2, displaySize, displaySize);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = "#000";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, powerUp.x + powerUp.size / 2, powerUp.y + powerUp.size / 2);
  });
};

const renderGame = (delta: number) => {
  const shake = getShakeOffset();
  const scale = getZoomScale();
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(scale, scale);
  ctx.translate(-canvas.width / 2 + shake.x, -canvas.height / 2 + shake.y);
  renderBackground(delta);
  renderTrails();
  renderParticles();
  renderPowerUps();
  renderPlayer();
  renderViruses();
  ctx.restore();
};

const endGame = () => {
  running = false;
  triggerZoom(0.05, 0.4);
  playGameOverSound();
  const finalScore = Math.floor(score);
  saveHighScore(finalScore);
  overlay.classList.remove("hidden");
  finalScoreEl.textContent = finalScore.toString();
  displayHighScores();
};

const gameLoop = (timestamp: number) => {
  if (!running) return;
  const delta = Math.min(0.033, (timestamp - lastTime) / 1000) || 0;
  lastTime = timestamp;
  
  if (!gamePaused) {
    elapsed += delta;
    score += delta * 10 * scoreMultiplier;
    spawnTimer += delta * 1000;

    while (spawnTimer >= spawnInterval && !isPaused && pauseTimer <= 0) {
      spawnVirus();
      spawnTimer -= spawnInterval;
    }

    updateWavePause(delta);
    updateDifficulty();
    updatePlayer(delta);
    updateViruses(delta);
    updateParticles(delta);
    updateTrails(delta);
    updateInvulnerability(delta);
    updateShake(delta);
    updateZoom(delta);
    updateShimmer(delta);
    updateGlowPulse(delta);
    updateScorePulse(delta);
    updatePowerUps(delta);
    detectCollisions();
  }
  
  renderGame(delta);
  updateHud();

  requestAnimationFrame(gameLoop);
};

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;
  if (key === "m") {
    toggleMute();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// Touch controls for mobile
canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  const touch = event.touches[0];
  const rect = canvas.getBoundingClientRect();
  touchX = touch.clientX - rect.left;
  touchY = touch.clientY - rect.top;
  touchActive = true;
});

canvas.addEventListener("touchmove", (event) => {
  event.preventDefault();
  if (touchActive) {
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchX = touch.clientX - rect.left;
    touchY = touch.clientY - rect.top;
  }
});

canvas.addEventListener("touchend", (event) => {
  event.preventDefault();
  touchActive = false;
});

canvas.addEventListener("touchcancel", (event) => {
  event.preventDefault();
  touchActive = false;
});

window.addEventListener("resize", () => {
  resizeCanvas();
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
});

restartBtn.addEventListener("click", () => {
  resetGame();
  requestAnimationFrame(gameLoop);
});

pauseBtn.addEventListener("click", () => {
  toggleGamePause();
});

muteBtn.addEventListener("click", () => {
  toggleMute();
});

resizeCanvas();
resetGame();
requestAnimationFrame(gameLoop);
