// ==== 8-bit Resume Quest ====
const gridSize = 32; // grid step size

// -- DOM Nodes --
const avatar         = document.getElementById('avatar');
const infoBox        = document.getElementById('infoBox');
const gameArea       = document.getElementById('gameArea');
const progress       = document.getElementById('progress');
const creditScreen   = document.getElementById('creditScreen');
const finalResume    = document.getElementById('finalResume');
const sndCollect     = document.getElementById('sndCollect');
const sndJump        = document.getElementById('sndJump');
const bgMusic        = document.getElementById('bgMusic');
const musicToggle    = document.getElementById('musicToggle');
const musicIcon      = document.getElementById('musicIcon');
const fullscreenToggle = document.getElementById('fullscreenToggle');
const fullscreenIcon   = document.getElementById('fullscreenIcon');
const timerEl        = document.getElementById('timer');
const scoreEl        = document.getElementById('score');

// -- Game State --
let currentLevel  = 0;
let collectibles  = [];
let collected     = [];
let avX = 32, avY = 32, jumps = 0;
let musicPlaying  = false;
let startTime, timerInterval, score = 0;

// -- Resume Data --
const resumeData = `
  <strong>Name:</strong> Rashi<br>
  <strong>Email:</strong> raashisindhav@gmail.com<br>
  <strong>Contact:</strong> 95******00<br>
  <strong>Address:</strong> *****,110059<br>
  <strong>Education:</strong> Class X (96%), Class XII (94%), B.Sc Electronics<br>
  <strong>Tech Skills:</strong> Database, C/Java, SQL, CCC Certificate<br>
  <strong>Interests:</strong> Civil Services, Tech in Governance, Agile, Scrum<br>
  <strong>Extracurricular:</strong> Guitar/Singing<br>
  <strong>Qualities:</strong> Leadership, Communication, Decision & more
`;

const LEVELS = [
  {
    name: "Education & Skills",
    bg: "#84b9f7 url('https://i.imgur.com/60k0T0I.png') repeat",
    collectibles: [
      { icon:"📘", text:"Class X: 96%" },
      { icon:"📗", text:"Class XII: 94%" },
      { icon:"🗂️", text:"Database System" },
      { icon:"💻", text:"C & Java" },
      { icon:"🧠", text:"SQL, CCC Certificate" },
      { icon:"🎸", text:"Guitar & Singing" }
    ],
    obstacles: [
      {x: 160, y: 64},
      {x: 96,  y: 160},
      {x: 256, y: 220}
    ],
    enemy: { x: 256, y: 128, speed: 900 }
  },
  {
    name: "Achievements & Personality",
    bg: "#e9cd3c url('https://i.imgur.com/vigkYyD.png') repeat",
    collectibles: [
      { icon:"⭐", text:"Leadership" },
      { icon:"💬", text:"Communication" },
      { icon:"🧩", text:"Problem Solving" },
      { icon:"⏰", text:"Time Management" },
      { icon:"🤝", text:"Teamwork" },
      { icon:"🏅", text:"Consistent Performer" }
    ],
    obstacles: [
      {x: 190, y: 90},
      {x: 350, y: 120},
      {x: 80,  y: 200}
    ],
    enemy: { x: 320, y: 90, speed: 550 } // Faster in next level
  }
];

// -- Utility for Current Game Area Size --
function getGameSize() {
  return { w: gameArea.offsetWidth, h: gameArea.offsetHeight };
}

// -- Position Collectibles Randomly --
function setupCollectibles() {
  const { w, h } = getGameSize();
  const baseCollect = LEVELS[currentLevel].collectibles;
  collectibles = baseCollect.map(item => {
    let x = Math.floor(Math.random() * (w - gridSize));
    let y = Math.floor(Math.random() * (h - gridSize));
    return {...item, x, y};
  });
  collected = [];
}

// -- Place Collectibles in DOM --
function shuffleCollectibles() {
  document.querySelectorAll('.collectible').forEach(e => e.remove());
  collectibles.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'collectible';
    el.style.left = c.x + "px";
    el.style.bottom = c.y + "px";
    el.innerHTML = c.icon;
    el.dataset.index = i;
    gameArea.appendChild(el);
  });
}

function drawObstacles() {
  document.querySelectorAll('.obstacle').forEach(e => e.remove());
  LEVELS[currentLevel].obstacles.forEach((ob,i)=>{
    const el = document.createElement('div');
    el.className = 'obstacle';
    el.style.left   = ob.x + 'px';
    el.style.bottom = ob.y + 'px';
    gameArea.appendChild(el);
  });
}

function drawEnemy() {
  document.querySelectorAll('.enemy').forEach(e => e.remove());
  const enemyData = LEVELS[currentLevel].enemy;
  const el = document.createElement('div');
  el.className = 'enemy';
  el.style.left   = enemyData.x + 'px';
  el.style.bottom = enemyData.y + 'px';
  gameArea.appendChild(el);
}

// -- Show Level Name Popup --
function showLevelPopup(text) {
  const popup = document.getElementById('levelPopup');
  const txt   = document.getElementById('levelText');
  if (popup && txt) {
    txt.textContent = text;
    popup.style.display = 'flex';
    setTimeout(()=>popup.style.display='none', 1800);
  }
}

// -- Handle Level Progression --
function nextLevel() {
  gameArea.style.background = LEVELS[currentLevel].bg;
  showLevelPopup(`Level ${currentLevel+1}: ${LEVELS[currentLevel].name}`);
  setupCollectibles();
  shuffleCollectibles();
  drawObstacles();
  drawEnemy();
  startEnemyMovement();
  avX = gridSize; avY = gridSize;
  avatar.style.left   = avX + 'px';
  avatar.style.bottom = avY + 'px';
}

// -- Timer & Score --
function updateTimer() {
  let now = Date.now();
  let elapsed = Math.floor((now - startTime)/1000);
  let min = Math.floor(elapsed/60).toString().padStart(2,'0');
  let sec = (elapsed%60).toString().padStart(2,'0');
  timerEl.textContent = 'Time: ' + min + ':' + sec;
}
function updateScore() {
  scoreEl.textContent = 'Score: ' + score;
}
function updateProgress() {
  let pct = Math.round(collected.length / collectibles.length * 100);
  progress.style.width = pct + "%";
}
function showCredit() {
  clearInterval(timerInterval);
  stopEnemyMovement();
  creditScreen.style.display = 'flex';
  finalResume.innerHTML = resumeData +
    `<br><br><strong>Final Time:</strong> ${timerEl.textContent.split(' ')[1]}` +
    `<br><strong>Final Score:</strong> ${score}`;
}

// -- Fullscreen & Music --
fullscreenToggle.onclick = function () {
  if (!document.fullscreenElement) {
    gameArea.requestFullscreen();
    fullscreenIcon.textContent = "🡺";
  } else {
    document.exitFullscreen();
    fullscreenIcon.textContent = "⛶";
  }
};
document.addEventListener("fullscreenchange", () => {
  fullscreenIcon.textContent = document.fullscreenElement ? "🡺" : "⛶";
  setupCollectibles(); shuffleCollectibles(); drawObstacles(); drawEnemy();
  startEnemyMovement();
});

musicToggle.onclick = function () {
  if (!musicPlaying) {
    bgMusic.play();
    musicPlaying = true;
    musicIcon.textContent = '⏸️';
  } else {
    bgMusic.pause();
    musicPlaying = false;
    musicIcon.textContent = '▶️';
  }
};


// -- Window Resize: Rescale Game & Collectibles --
window.addEventListener('resize', () => {
  setupCollectibles(); shuffleCollectibles(); drawObstacles();
});

function isBlocked(nx, ny) {
  // Checks if target position is blocked by any obstacle
  return LEVELS[currentLevel].obstacles.some(ob => ob.x === nx && ob.y === ny);
}

// -- Keyboard Controls & Avatar Movement --
document.addEventListener('keydown', (e) => {
  let { w: gameW, h: gameH } = getGameSize();
  let nx = avX, ny = avY, moved = false;
  if (e.key === 'ArrowUp')    { if (avY < (gameH - gridSize)) ny += gridSize; }
  if (e.key === 'ArrowDown')  { if (avY > 0) ny -= gridSize; }
  if (e.key === 'ArrowLeft')  { if (avX > 0) nx -= gridSize; }
  if (e.key === 'ArrowRight') { if (avX < (gameW - gridSize)) nx += gridSize; }
  // Prevent moving onto obstacles
  if ((nx !== avX || ny !== avY) && !isBlocked(nx, ny)) {
    avX = nx; avY = ny; moved = true;
  }
  
  // Jump
  if (e.key === ' ' || e.key === 'Spacebar') {
    jumps++;
    sndJump.currentTime = 0; sndJump.play();
    avatar.style.transform = 'translateY(-10px)';
    setTimeout(() => avatar.style.transform = 'translateY(0)', 130);
  }
  avatar.style.left = avX + "px";
  avatar.style.bottom = avY + "px";
  if (moved) checkCollision();
});

// -- Animate Collectibles Randomly --
setInterval(() => {
  let { w: gameW, h: gameH } = getGameSize();
  document.querySelectorAll('.collectible').forEach(el => {
    if (collected.includes(el.dataset.index)) return;
    let nx = Math.max(0, Math.min(parseInt(el.style.left)+(Math.random()*64-32), gameW-gridSize));
    let ny = Math.max(0, Math.min(parseInt(el.style.bottom)+(Math.random()*64-32), gameH-gridSize));
    el.style.left  = (Math.round(nx/gridSize)*gridSize) + "px";
    el.style.bottom= (Math.round(ny/gridSize)*gridSize) + "px";
  });
}, 900);

let enemyX = 0, enemyY = 0, enemyInterval;

function moveEnemy() {
  const { x: targetX, y: targetY } = { x: avX, y: avY };
  let dx = targetX - enemyX;
  let dy = targetY - enemyY;
  // Snap movement on grid
  if (Math.abs(dx) > Math.abs(dy)) {
    enemyX += Math.sign(dx) * gridSize;
  } else if (dy !== 0) {
    enemyY += Math.sign(dy) * gridSize;
  }
  // Boundaries check
  let { w: gameW, h: gameH } = getGameSize();
  enemyX = Math.max(0, Math.min(enemyX, gameW-gridSize));
  enemyY = Math.max(0, Math.min(enemyY, gameH-gridSize));
  // Move element
  const enemy = document.querySelector('.enemy');
  if (enemy) {
    enemy.style.left   = enemyX + 'px';
    enemy.style.bottom = enemyY + 'px';
  }
  // Collision check with player
  if (enemyX === avX && enemyY === avY) {
    handleEnemyCollision();
  }
}
function startEnemyMovement() {
  clearInterval(enemyInterval);
  const levelEnemy = LEVELS[currentLevel].enemy;
  enemyX = levelEnemy.x; enemyY = levelEnemy.y;
  enemyInterval = setInterval(moveEnemy, levelEnemy.speed); // Speed gets faster on next levels
}
function stopEnemyMovement() {
  clearInterval(enemyInterval);
}
function handleEnemyCollision() {
  score = Math.max(0, score - 30); // Deduct more points (strong enemy)
  updateScore();
  showLevelPopup("Ouch! Enemy Caught You!");
  // Optionally end the game here with showCredit(), or just penalize:
  // showCredit();
}


// -- Collision Detection --
function checkCollision() {
  let { w: gameW, h: gameH } = getGameSize();
  document.querySelectorAll('.collectible').forEach(el => {
    if (collected.includes(el.dataset.index)) return;
    // strict overlap
    let cx = parseInt(el.style.left), cy = parseInt(el.style.bottom);
    if (avX === cx && avY === cy) {
      sndCollect.currentTime = 0; sndCollect.play();
      infoBox.innerHTML = collectibles[el.dataset.index].text;
      const infoBoxWidth = 140, infoBoxHeight = 48;
      let left = avX + 10, top = gameH - avY - 40;
      // Prevent edges cutting
      if (left + infoBoxWidth > gameW) left = gameW - infoBoxWidth - 10;
      if (left < 0) left = 10;
      if (top + infoBoxHeight > gameH) top = gameH - infoBoxHeight - 10;
      if (top < 0) top = 10;
      infoBox.style.left = left + "px"; infoBox.style.top = top + "px";
      infoBox.style.display = 'block';
      setTimeout(() => { infoBox.style.display = 'none'; }, 1000);

      el.style.opacity = .3;
      collected.push(el.dataset.index);
      updateProgress();

      score += 10;
      updateScore();

      if(collected.length===collectibles.length) {
        if(currentLevel < LEVELS.length-1) {
          currentLevel++;
          nextLevel();
        } else {
          showCredit();
        }
      }
    }
  });
}

// -- Startup --
window.addEventListener('load', () => {
  currentLevel = 0;
  gameArea.style.background = LEVELS[currentLevel].bg;
  showLevelPopup(`Level 1: ${LEVELS[currentLevel].name}`);
  setupCollectibles();
  shuffleCollectibles();
  drawEnemy();
  startEnemyMovement();
  avatar.style.left = avX + 'px';
  avatar.style.bottom = avY + 'px';
  startTime = Date.now(); score = 0;
  updateTimer(); updateScore(); drawObstacles();
  timerInterval = setInterval(updateTimer, 1000);
  bgMusic.volume = 0.22; bgMusic.play();
});

// -- Avatar: ensure keyboard focus (for mobile/browser quirks) --
avatar.focus();
gameArea.onclick = () => avatar.focus();









// // 8-bit resume quest JS
// const gridSize = 32; // snap movements to grid
// const gameW = 480, gameH = 320;


// const LEVELS = [
//   {
//     name: "Education & Skills",
//     bg: "#84b9f7 url('https://i.imgur.com/60k0T0I.png') repeat",
//     collectibles: [
//       { icon:"📘", text:"Class X: 96%" },
//       { icon:"📗", text:"Class XII: 94%" },
//       { icon:"🗂️", text:"Database System" },
//       { icon:"💻", text:"C & Java" },
//       { icon:"🧠", text:"SQL, CCC Certificate" },
//       { icon:"🎸", text:"Guitar & Singing" }
//     ]
//   },
//   {
//     name: "Achievements & Personality",
//     bg: "#e9cd3c url('https://i.imgur.com/vigkYyD.png') repeat",
//     collectibles: [
//       { icon:"⭐", text:"Leadership" },
//       { icon:"💬", text:"Communication" },
//       { icon:"🧩", text:"Problem Solving" },
//       { icon:"⏰", text:"Time Management" },
//       { icon:"🤝", text:"Teamwork" },
//       { icon:"🏅", text:"Consistent Performer" }
//     ]
//   }
// ];



// // const baseCollectibles = [
// //   // Education & Skills
// //   { icon: "📘", text: "Class X: 96%" },
// //   { icon: "📗", text: "Class XII: 94%" },
// //   { icon: "🗂️", text: "Database System" },
// //   { icon: "💻", text: "C & Java" },
// //   { icon: "🧠", text: "SQL, CCC Certificate" },
// //   { icon: "🎸", text: "Guitar & Singing" },
// //   // Interests
// //   { icon: "🎯", text: "Civil Services Prep" },
// //   { icon: "🔧", text: "Tech in Governance" },
// //   { icon: "📈", text: "Agile, Scrum" },
// //   // Personality Traits/Soft Skills
// //   { icon: "⭐", text: "Leadership" },
// //   { icon: "💬", text: "Communication" },
// //   { icon: "🧩", text: "Problem Solving" },
// //   { icon: "⏰", text: "Time Management" },
// //   { icon: "🛡️", text: "Integrity" },
// //   { icon: "🤝", text: "Teamwork" },
// //   // Achievements/Other Fun
// //   { icon: "🥇", text: "Departmental Leadership" },
// //   { icon: "🏅", text: "Consistent Performer" },
// //   { icon: "🏆", text: "Achievements" },
// //   { icon: "🚀", text: "Personal Growth" },
// //   // Resume Details/Fun Facts
// //   { icon: "🌍", text: "Delhi University" },
// //   { icon: "📍", text: "Rajdhani College" },
// //   { icon: "🗃️", text: "Organized Events" },

// // ];

// let collectibles = [];
// function randomPosition(gameW, gameH, gridSize = 48) {
//   let x = Math.floor(Math.random() * (gameW - gridSize));
//   let y = Math.floor(Math.random() * (gameH - gridSize));
//   return {x: x, y: y};
// }
// function setupCollectibles() {
//   let gameW = gameArea.offsetWidth;
//   let gameH = gameArea.offsetHeight;
//   const baseCollectibles = LEVELS[currentLevel].collectibles;
//   collectibles = baseCollectibles.map(item => {
//     let x = Math.floor(Math.random() * (gameW - 48));
//     let y = Math.floor(Math.random() * (gameH - 48));
//     return {...item, x, y};
//   });
//   collected = [];
// }

// function shuffleCollectibles() {
//   document.querySelectorAll('.collectible').forEach(e=>gameArea.removeChild(e));
//   collectibles.forEach((c,i)=>{
//     const el = document.createElement('div');
//     el.className = 'collectible';
//     el.style.left = c.x+"px";
//     el.style.bottom = c.y+"px";
//     el.innerHTML = c.icon;
//     el.dataset.index = i;
//     gameArea.appendChild(el);
//   });
// }
// function showLevelPopup(text) {
//   const popup = document.getElementById('levelPopup');
//   const txt   = document.getElementById('levelText');
//   txt.textContent = text;
//   popup.style.display = 'flex';
//   setTimeout(()=>popup.style.display='none', 1800);
// }
// window.addEventListener('load', () => {
//   currentLevel = 0;
//   gameArea.style.background = LEVELS[currentLevel].bg;
//   showLevelPopup("Level 1:\n" + LEVELS[currentLevel].name);
//   setupCollectibles();
//   shuffleCollectibles();
//   // ...rest of setup...
//   startTime = Date.now();
//   score = 0;
//   updateTimer();
//   updateScore();
//   timerInterval = setInterval(updateTimer, 1000);
//   bgMusic.volume = 0.22; // lower volume
//   bgMusic.play();
// });

// window.addEventListener('resize', () => {
//   setupCollectibles();
//   shuffleCollectibles();
// });
// document.addEventListener('fullscreenchange', () => {
//   setupCollectibles();
//   shuffleCollectibles();
// });





// const resumeData = `
//   <strong>Name:</strong> Rashi<br>
//   <strong>Email:</strong> raashisindhav@gmail.com<br>
//   <strong>Contact:</strong> 95******00<br>
//   <strong>Address:</strong> *****,110059<br>
//   <strong>Education:</strong> Class X (96%), Class XII (94%), B.Sc Electronics<br>
//   <strong>Tech Skills:</strong> Database, C/Java, SQL, CCC Certificate<br>
//   <strong>Interests:</strong> Civil Services, Tech in Governance, Agile, Scrum<br>
//   <strong>Extracurricular:</strong> Guitar/Singing<br>
//   <strong>Qualities:</strong> Leadership, Communication, Decision & more
// `;

// const avatar = document.getElementById('avatar');
// const infoBox = document.getElementById('infoBox');
// const gameArea = document.getElementById('gameArea');
// const progress = document.getElementById('progress');
// const creditScreen = document.getElementById('creditScreen');
// const finalResume = document.getElementById('finalResume');
// const sndCollect = document.getElementById('sndCollect');
// const sndJump = document.getElementById('sndJump');
// const bgMusic = document.getElementById('bgMusic');
// const musicToggle = document.getElementById('musicToggle');
// const musicIcon = document.getElementById('musicIcon');
// let musicPlaying = false;

// const timerEl = document.getElementById('timer');
// const scoreEl = document.getElementById('score');

// let startTime, timerInterval;
// let score = 0;

// const fullscreenToggle = document.getElementById('fullscreenToggle');
// const fullscreenIcon = document.getElementById('fullscreenIcon');

// fullscreenToggle.onclick = function () {
//   if (!document.fullscreenElement) {
//     gameArea.requestFullscreen();
//     fullscreenIcon.textContent = "🡺"; // Change icon for exit/fullscreen
//   } else {
//     document.exitFullscreen();
//     fullscreenIcon.textContent = "⛶"; // Restore icon for fullscreen
//   }
// };

// document.addEventListener("fullscreenchange", () => {
//   if (!document.fullscreenElement) {
//     fullscreenIcon.textContent = "⛶";
//   }
// });


// musicToggle.onclick = function () {
//   if (!musicPlaying) {
//     bgMusic.play();
//     musicPlaying = true;
//     musicIcon.textContent = '⏸️'; // Pause icon
//   } else {
//     bgMusic.pause();
//     musicPlaying = false;
//     musicIcon.textContent = '▶️'; // Play icon
//   }
// };

// function updateTimer() {
//   let now = Date.now();
//   let elapsed = Math.floor((now - startTime) / 1000);
//   let min = Math.floor(elapsed / 60).toString().padStart(2, '0');
//   let sec = (elapsed % 60).toString().padStart(2, '0');
//   timerEl.textContent = 'Time: ' + min + ':' + sec;
// }

// function updateScore() {
//   scoreEl.textContent = 'Score: ' + score;
// }


// // create collectibles and random movement (challenge!)
// function shuffleCollectibles() {
//   document.querySelectorAll('.collectible').forEach(e => gameArea.removeChild(e));
//   collectibles.forEach((c, i) => {
//     const el = document.createElement('div');
//     el.className = 'collectible';
//     el.style.left = c.x + "px";
//     el.style.bottom = c.y + "px";
//     el.innerHTML = c.icon;
//     el.dataset.index = i;
//     gameArea.appendChild(el);
//   });
// }

// let avX = 32, avY = 32, collected = [], jumps = 0;

// // move avatar on grid
// document.addEventListener('keydown', (e) => {
//   let moved = false;
//   if (e.key === 'ArrowUp') { if (avY < (gameH - gridSize)) avY += gridSize; moved = true; }
//   if (e.key === 'ArrowDown') { if (avY > 0) avY -= gridSize; moved = true; }
//   if (e.key === 'ArrowLeft') { if (avX > 0) avX -= gridSize; moved = true; }
//   if (e.key === 'ArrowRight') { if (avX < (gameW - gridSize)) avX += gridSize; moved = true; }
//   // jump animation
//   if (e.key === ' ' || e.key === 'Spacebar') {
//     jumps++;
//     sndJump.currentTime = 0; sndJump.play();
//     avatar.style.transform = 'translateY(-10px)';
//     setTimeout(() => avatar.style.transform = 'translateY(0)', 130);
//   }
//   avatar.style.left = avX + "px"; avatar.style.bottom = avY + "px";
//   if (moved) checkCollision();
// });

// // game loop - random collectibles movement (challenge)
// setInterval(() => {
//   document.querySelectorAll('.collectible').forEach(el => {
//     if (collected.includes(el.dataset.index)) return;
//     // randomly move a little (challenge), stay within game area & grid
//     let nx = Math.max(0, Math.min(parseInt(el.style.left) + (Math.random() * 64 - 32), gameW - gridSize));
//     let ny = Math.max(0, Math.min(parseInt(el.style.bottom) + (Math.random() * 64 - 32), gameH - gridSize));
//     el.style.left = (Math.round(nx / gridSize) * gridSize) + "px";
//     el.style.bottom = (Math.round(ny / gridSize) * gridSize) + "px";
//   });
// }, 900);



// function checkCollision() {
//   document.querySelectorAll('.collectible').forEach(el => {
//     if (collected.includes(el.dataset.index)) return;
//     let cx = parseInt(el.style.left), cy = parseInt(el.style.bottom);
//     // strict overlap for 8-bit challenge (must be on same tile!)
//     if (avX === cx && avY === cy) {
//       sndCollect.currentTime = 0; sndCollect.play();

//       infoBox.innerHTML = collectibles[el.dataset.index].text;
//       const infoBoxWidth = 140, infoBoxHeight = 48;
//       let left = avX + 10;
//       let top = gameH - avY - 40;
//       // Prevent right edge cut-off
//       if (left + infoBoxWidth > gameW) left = gameW - infoBoxWidth - 10;
//       // Prevent left edge cut-off
//       if (left < 0) left = 10;
//       // Prevent bottom edge cut-off  
//       if (top + infoBoxHeight > gameH) top = gameH - infoBoxHeight - 10;
//       // Prevent top edge cut-off
//       if (top < 0) top = 10;
//       infoBox.style.left = left + "px";
//       infoBox.style.top = top + "px";
//       infoBox.style.display = 'block';
//       setTimeout(() => { infoBox.style.display = 'none'; }, 1000);
//       el.style.opacity = .3;
//       collected.push(el.dataset.index);
//       updateProgress();
//       if(collected.length===collectibles.length) {
//         if(currentLevel < LEVELS.length-1) {
//           currentLevel++;
//           nextLevel();
//         } else {
//           showCredit();
//         }
//       }
      
//       score += 10; // or any value per collectible
//       updateScore();

//     }
//   });
// }

// function nextLevel() {
//   // Change background
//   gameArea.style.background = LEVELS[currentLevel].bg;
//   // Show level intro popup
//   showLevelPopup("Level " + (currentLevel+1) + ":\n" + LEVELS[currentLevel].name);
//   // Reset collectibles
//   setupCollectibles();
//   shuffleCollectibles();
//   // Reset avatar position (optional)
//   avX = 32; avY = 32;
//   avatar.style.left = avX + 'px';
//   avatar.style.bottom = avY + 'px';
// }

// function updateProgress() {
//   let pct = Math.round(collected.length / collectibles.length * 100);
//   progress.style.width = pct + "%";
// }
// function showCredit() {
//   clearInterval(timerInterval);
//   creditScreen.style.display = 'flex';
//   finalResume.innerHTML =
//     resumeData +
//     `<br><br><strong>Final Time:</strong> ${timerEl.textContent.split(' ')[1]}` +
//     `<br><strong>Final Score:</strong> ${score}`;
// }


// // focus for keys
// avatar.focus();
// gameArea.onclick = () => avatar.focus();
