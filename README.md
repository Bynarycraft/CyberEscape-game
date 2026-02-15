CYBER ESCAPE

So you've got a glowing blue square and falling red viruses trying to ruin your day. That's Cyber Escape. It's a fast browser game where you collide with stuff, destroy viruses, grab power-ups, and try not to die. Built with TypeScript, Canvas, and Web Audio—no fancy frameworks, just pure code.

WHAT'S IN THE BOX

The core idea is simple: move around, hit viruses, survive as long as you can. But there's more going on than it looks:

Gameplay stuff: You get 3 hearts. Every virus you hit costs you one unless you have a shield. Score goes up constantly, and the game gets harder every 10 seconds. Difficulty scaling means more viruses spawn faster and they fall quicker.

Visual stuff: Glowing blue player with a neon aura, red viruses with dynamic shadows, particle explosions everywhere, screen shake on impact, subtle camera zoom, animated grid background, and ASCII code streams falling down. The shimmer effect pulses with the action.

Audio stuff: Everything's synthesized with Web Audio oscillators. No pre-recorded sounds—the game generates impact sounds that change pitch based on virus size, explosion bursts, and a game-over tone. You can mute it with the M key or the button.

HUD stuff: Shows your score, health as hearts, difficulty level, pause/resume button, and mute toggle. Plus when you hit 100-point milestones, the HUD pulses to celebrate.

New stuff: Wave system means viruses come in groups of 10, then you get a 2-second breather. Power-ups drop when you destroy viruses (50% chance)—grab a shield, slow down time, or double your score. High scores save to your browser so you can compete with yourself forever.

PROJECT STRUCTURE

cyber-escape/
├── index.html        (loads the game)
├── style.css         (makes it look good)
├── main.ts           (where the magic happens)
├── main.js           (what the browser actually runs)
├── tsconfig.json     (config for TypeScript)
├── package.json      (npm stuff)
└── README.md         (this file)

GETTING STARTED

You need Node.js installed. That's it. The game runs in any modern browser.

Installation is two steps:

cd cyber-escape

Optional if you want to tinker with TypeScript:

npm install -g typescript

Running the game is even easier. You can either just double-click index.html and it opens in your browser. Or if you want a proper server:

npm start

This spins up http://localhost:8080 and opens it for you. If npm start doesn't work, try:

http-server -p 8080

Then open http://localhost:8080 in your browser.

PLAYING THE GAME

Arrow keys or WASD to move around. That's it. Viruses fall down. You're a square. Run into them to destroy them. Lose a heart when you get hit, unless the shield is active. Stay alive longer to rack up points. Every time you destroy a virus, there's a 50% chance a power-up drops. Grab them:

Blue square with symbol: Shield. Takes one hit for free.
Purple square with symbol: Slow-Mo. Viruses move half speed for 5 seconds.
Gold square with symbol: 2x multiplier. Your score counts double for 8 seconds.

The game gets noticeably harder every 10 seconds. More viruses spawn, they move faster. At some point you can't dodge anymore, so you have to be tactical about collisions.

HOW IT WORKS UNDER THE HOOD

The collision detection is dead simple AABB stuff—just checking if two squares overlap. When they do, particles explode, sounds play, the screen shakes a bit, and a power-up might drop. You get 0.8 seconds of invulnerability after a hit so you can plan your next move.

Viruses spawn exponentially faster as your score and playtime increase. The formula is smooth though, not jarring. Bigger particles are generated on bigger explosions. The glow effect gets more intense the closer viruses are to you.

The audio stuff is wild if you think about it. There's no audio file. The game synthesizes tones on the fly using oscillators that vary by virus size and explosion intensity.

Screen shake is pretty straightforward—random offset for 0.3 seconds that eases out. Camera zoom happens on hit, adding a tiny bit of tension.

CUSTOMIZING STUFF

Want to tweak difficulty? Open main.ts and change these constants:

const baseSpawnInterval = 900;   (milliseconds between spawns)
const minSpawnInterval = 220;    (fastest possible spawn rate)

Want different colors? Open style.css and change the CSS variables:

--glow: #4cc9ff;    (cyan player glow)
--danger: #ff3b3b;  (red virus color)
--bg: #05060d;      (background dark blue)

Want more or fewer particles on explosions? Edit the spawnParticles function in main.ts.

After you change anything in main.ts, rebuild with:

npm run build

Or watch for changes and rebuild automatically:

npm run watch

TROUBLESHOOTING

Game won't start: Check the browser console with F12 to see error messages. Make sure main.js exists in the same folder as index.html. Try a different browser.

Game is laggy: Too many visual effects happening at once. You could reduce background particle count or disable shimmer by editing the constants. Check if hardware acceleration is on in your browser.

Audio doesn't work: Click on the game first to let the browser start audio. Some browsers don't allow audio without user interaction. Toggle mute off. Check browser sound settings.

Score stuck: Probably a bug, but try refreshing. If it happens consistently, there's something wrong with the game loop.

WHAT'S MISSING

The original checklist had some things we didn't build:

Multiplayer (would need a server)
Leaderboards beyond what browsers can store
Different game modes like endless or time attack
Mobile touch controls
Boss battles

None of this impacts the core game. They're nice-to-haves if you want to extend it.

WHAT'S ACTUALLY BUILT

All the core stuff works. Movement, collision, particles, sound synthesis, visual effects, HUD, difficulty scaling, pause/resume, scoring system, high score saving, power-ups, wave system. The game runs smooth at 60fps on any modern device. No dependencies, no frameworks, just Canvas and Web Audio.

BROWSER SUPPORT

Chrome, Firefox, Safari, Edge all work fine from the last few versions. Internet Explorer doesn't work because Web Audio isn't supported. But nobody uses IE anymore anyway.

CREDITS

Made with TypeScript for type safety, Canvas 2D for rendering, Web Audio API for synth sounds. No external libraries. Pure JavaScript running in the browser.

MIT license, so do whatever you want with it.

ENJOY CYBER ESCAPE

Go play. Destroy some viruses. Try to beat your high score. See how long you can survive. Have fun.
