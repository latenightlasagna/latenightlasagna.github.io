/*WINDOWS 98 DESKTOP SIMULATION 

    D R E A M - OS 
    Simon Hahn 
    Creative Coding - SoSe 2026
___________________________________________________________________________

    WebGL powered fake OS.

    2-pass rendering system:
      1. Everything is drawn into the 2D offscreen buffer (`pg`).
      2. The buffer is then passed into a custom GLSL CRT Shader to apply 
      curvature, scanlines, and chromatic aberration, which is then rendered 
      back to the main WebGL canvas.

___________________________________________________________________________

    Credits:

      Jessica's corner of cyberspace (mini taskbar Icons): https://www.raebear.net/computers/windows-98-icons/?utm_source=Pinterest&utm_medium=organic

      (Windows 98 Ui Kit): https://www.figma.com/design/UbN0DJZWXYIR6Q9dAwa3M7/Windows-95-UI-Kit--Community-?node-id=0-1&p=f&t=MbMRaX8naMKabSBW-0

      (Windows 98 Icons): https://win98icons.alexmeub.com/

      (Wallpapers): https://wallpapercave.com/windows-98-background

      (AOL Sounds): https://archive.org/details/AmericaOnlineVersion30ForWindows1996

      (Windows Sounds): https://archive.org/details/win95sounds

___________________________________________________________________________

    Inspiration:

      https://emupedia.net/beta/emuos/
        
___________________________________________________________________________

    Tools I used:

      Photoshop (Heightmaps)
      Illustrator (Sticker designs)
      Blender (PC frame + Stickers & Dithering Pipeline)
      Ditherinator (Custom windows Dithering for wallpapers)
      Ableton (Song creation)
    
*/


const CANVAS_W = 800;
const CANVAS_H = 600;
const ICON_SIZE = 42; //Iconparticle size
const INTERACTION_RADIUS = 100; //Mouse force for particles


/////////////////////////AUDIO MIXER (OS)
const MUSIC_VOLUME = 0.6;
const STARTUP_VOLUME = 0.5;
const CRASH_VOLUME = 0.7;
const RECYCLE_VOLUME = 1;
const TREE_VOLUME = 0.4;
const IE_VOLUME = 1;
const SCAN_VOLUME = 0.2;
const SEARCH_VOLUME = 0.2;
const AOE2_VOLUME = 0.6;
const BIOS_VOLUME = 0.5;


/////////////////////////AUDIO MIXER (EGG GAME)
const EGG_MUSIC_VOLUME = 0.6;
const EGG_POP_VOLUME = 0.8;
const EGG_DEATH_VOLUME = 0.6;
const EGG_SIREN_VOLUME = 0.4;
const EGG_GAME_OVER_VOLUME = 0.6;


/////////////////////////EGG GAME DIFFICULTY CONFIG
const EGG_BASE_SPEED = 4.0;
const EGG_MAX_SPEED = 14.0;
const EGG_SPEED_RAMP = 0.15;

const EGG_BASE_SPAWN_RATE = 80;
const EGG_MIN_SPAWN_RATE = 20; 
const EGG_SPAWN_RAMP = 2;


/////////////////////////CRT SHADER CONFIG
const CRT_CURVATURE = 8.8;
const CRT_FIT = true;
const CRT_SCANLINE_DENSITY = 4;
const CRT_SCANLINE_OPACITY = 0.05;
const CRT_CHROMATIC_ABERRATION = 0.0017;
const CRT_VIGNETTE_AMOUNT = 1.2;


/////////////////////////UI BLEED COMPENSATION
const TASKBAR_PAD_X = 0;
const TASKBAR_PAD_BOTTOM = 0;
const TASKBAR_HEIGHT = 38;


//Global Audio variables
let bgMusic;
let sndStartup, sndRecycle, sndCrash;
let sndInternetExplorer, sndTree, sndScan, sndSearch, sndAOE2;
let sndBiosBeep;
let bootReverb;


/////////////////////////SHADER & RENDER GLOBALS
let crtShader;
let pg; //2D buffer


/////////////////////////EGG GAME GLOBALS
let video;
let handPose;
let hands = [];
let activeEggs = []; 
let framesSinceLastSpawn = 0; 

let points = 0;
let eggLifes = 3;
let eggTimer = 5; //Countdown till Game starts
let eggHighscore = 0;

let imgEi;
let imgEggStartBg;
let fontEggBold;

let bgMusicEgg;
let sndPopEgg;
let sndEggDeath = [];
let sndDubSiren;
let sndGameOver;


/////////////////////////NOTEPAD SYSTEM
let notepad = {
  x: 100,
  y: 80,
  w: 350,
  h: 280,
  text: "",
  lines: [],
  cursorPos: 0,
  selStart: 0,
  selEnd: 0,
  isActive: false,
  isDragging: false,
  isResizing: false,
  isSelecting: false,
  isDraggingVScroll: false,
  vScrollDragOffset: 0,
  isMinimized: true,
  showHelp: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  scrollY: 0,
  maxChars: 2000,
  backspaceTimer: 0,
};


/////////////////////////Global State
let state = "POWER_OFF";
let bootStartTime = 0;
let desktopStartTime = 0;
let errorStartTime = 0;

let eggBootStartTime = 0;
let eggInputMode = "MOUSE";
let eggMenuState = "MAIN";
let eggDifficulty = "REGULAR";

let hasPlayedStartupSound = false;
let hasPlayedBiosBeep = false;
let hasStartedMusicFade = false;

//Desktop Sim globals
let particles = [];
let gameIconPos;
let targetHiddenPos;

let lastRelocationTime = 0;
const RELOCATION_INTERVAL = 1000;
let lastEggClickTime = 0;

//window Stamping Globals 
let popups = [];
let stampCount = 13;
let lastWindowActivity = 0;

//Visual assets
let imgBg,
  imgGameIcon,
  imgWhiteboardCutout,
  imgError,
  imgStartupScreen,
  imgArrow;
let imgStartBtn, imgNotepadTab, imgVoteTab;
let particleIcons = [];
let desktopApps = [];
let windowFrameImages = [];

let fontReg, fontBold;
let cursorImages = [];
let currentCursorIndex = 0;
let hasUnlockedCustomCursor = false;


/////////////////////////PRELOAD
function preload() {
  crtShader = loadShader("GLSL/default.vert", "GLSL/crt.frag");

  imgBg = loadImage("assets/wallpaper/grasslands.jpg");
  imgError = loadImage("assets/wallpaper/error screen.jpg");
  imgStartupScreen = loadImage("assets/wallpaper/Win98_startup.jpg");

  imgGameIcon = loadImage("assets/static_icons/game_icon.png");
  imgWhiteboardCutout = loadImage("assets/Whiteboard_cutout.png");
  imgArrow = loadImage("assets/arrow.png");

  imgStartBtn = loadImage("assets/taskbar/Start.png");
  imgNotepadTab = loadImage("assets/taskbar/notepad_tb.png");
  imgVoteTab = loadImage("assets/taskbar/vote.png");

  fontReg = loadFont("assets/fonts/MSW98UI-Regular.otf");
  fontBold = loadFont("assets/fonts/MSW98UI-Bold.otf");

  bgMusic = loadSound("assets/audio/music/I need to charge soon_loop_01.mp3");
  sndStartup = loadSound("assets/audio/oneshots/windows95_startup.mp3");
  sndBiosBeep = loadSound("assets/audio/oneshots/BiosBeeps.mp3");
  sndRecycle = loadSound("assets/audio/oneshots/Recycle.mp3");
  sndCrash = loadSound("assets/audio/oneshots/Windows XP Critical Stop.mp3");
  sndInternetExplorer = loadSound(
    "assets/audio/oneshots/Windows XP Ringout.mp3"
  );
  sndTree = loadSound("assets/audio/oneshots/Welcome.wav");
  sndScan = loadSound("assets/audio/oneshots/Asterisk.mp3");
  sndSearch = loadSound("assets/audio/oneshots/IM.wav");
  sndAOE2 = loadSound("assets/audio/oneshots/roggan.mp3");

  //Load Window Frames
  for (let i = 1; i <= 5; i++) {
    windowFrameImages.push(
      loadImage(`assets/windowframes/Window_frame_${i}.png`)
    );
  }

  const cursorNames = [
    "Blinky.gif",
    "BowandArrow.gif",
    "Chinchilla.gif",
    "Dog.gif",
    "FireDartHelp.gif",
    "GlimerViolet.gif",
    "Horse-1.gif",
    "Keyblade.gif",
    "PacMan.gif",
    "PhoneBusyLooped.gif",
    "Rainbowbanana.gif",
    "Smellytaco.gif",
    "newhelpselect.gif",
    "plasma.gif",
  ];
  for (let name of cursorNames) {
    cursorImages.push(loadImage(`assets/cursor/${name}`));
  }

  const pIconNames = [
    "icon_1.png",
    "icon_2.png",
    "icon_3.png",
    "icon_4.png",
    "icon_5.png",
    "icon_6.png",
    "icon_7.png",
    "icon_8.png",
  ];
  for (let name of pIconNames) {
    particleIcons.push(loadImage(`assets/particle_instances/${name}`));
  }

  const appNames = [
    "Internet Explorer.png",
    "Recycle Bin Full.png",
    "Scan CD.png",
    "Search in PC.png",
    "AOE2.png",
    "Tree.png",
  ];
  for (let name of appNames) {
    desktopApps.push({
      img: loadImage(`assets/static_icons/${name}`),
      label: name.replace(".png", ""),
    });
  }

  imgEggStartBg = loadImage(
    "assets/eggmania/images/eggMania2000_splashscreen_bg.jpg"
  );
  fontEggBold = loadFont("assets/eggmania/fonts/ASTherma-BlackCondensed.otf");
  imgEi = loadImage("assets/eggmania/images/Ei-removebg-preview.png");

  bgMusicEgg = loadSound("assets/eggmania/audio/music/OneMoreThreat.mp3");
  sndPopEgg = loadSound("assets/eggmania/audio/oneshots/SFX_PopDatEgg.mp3");
  sndDubSiren = loadSound("assets/eggmania/audio/oneshots/DubSiren.mp3");
  sndGameOver = loadSound("assets/eggmania/audio/oneshots/Game Over.mp3");

  for (let i = 1; i <= 4; i++) {
    sndEggDeath.push(
      loadSound(`assets/eggmania/audio/oneshots/EggDeath_${i}.mp3`)
    );
  }

  //Load ML5
  handPose = ml5.handPose();
}


/////////////////////////SETUP
function setup() {
  let canvas = createCanvas(CANVAS_W, CANVAS_H, WEBGL);
  canvas.parent("canvas-container");

  //Linear filtering to nearest-neighbor pixel rendering
  drawingContext.imageSmoothingEnabled = false;

  frameRate(60);
  noCursor(); //Hide OG cursor

  //2D buffer
  pg = createGraphics(CANVAS_W, CANVAS_H);
  pg.drawingContext.imageSmoothingEnabled = false;

  bootReverb = new p5.Reverb();
  bootReverb.process(sndStartup, 4, 1);

  //Desktop grid for apps
  let startX = 80;
  let startY = 80;
  let spacingY = 90;
  let gridIndex = 0;

  for (let i = 0; i < desktopApps.length; i++) {
    if (desktopApps[i].label === "AOE2") {
      desktopApps[i].pos = createVector(width - 180, height / 2 + 40);
    } else {
      desktopApps[i].pos = createVector(startX, startY + gridIndex * spacingY);
      gridIndex++;
    }
  }

  gameIconPos = createVector(width / 2, height / 2);
  relocateHiddenIcon();
  initParticleGrid();


  //Load saved note from the browsers local storage API
  let savedNote = localStorage.getItem("os98_notepad");
  if (savedNote !== null) {
    notepad.text = savedNote;
  }
  updateNotepadLayout();
}

//ML5 callback: Update hands array if ml5 detects a hand
function handsFound(results) {
  hands = results;
}

/////////////////////////INIT PARTICLES
function initParticleGrid() {
  particles = [];
  let cols = Math.ceil(width / ICON_SIZE);
  let rows = Math.ceil(height / ICON_SIZE);

  let startX = gameIconPos.x;
  let startY = gameIconPos.y;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let targetX = i * ICON_SIZE + ICON_SIZE / 2;
      let targetY = j * ICON_SIZE + ICON_SIZE / 2;
      let randomIcon =
        particleIcons[Math.floor(Math.random() * particleIcons.length)];
      particles.push(
        new Particle(startX, startY, targetX, targetY, randomIcon)
      );
    }
  }
}

//Eggmania icon to random location
function relocateHiddenIcon() {
  targetHiddenPos = createVector(
    random(150, width - 150),
    random(120, height - 150)
  );
}


/////////////////////////SYSTEM REBOOT FUNCTION
//Complete reset: states, flags, audio & visual arrays

function resetSystem() {
  state = "BOOTING";
  bootStartTime = millis();
  desktopStartTime = 0;

  hasPlayedStartupSound = false;
  hasPlayedBiosBeep = false;
  hasStartedMusicFade = false;
  hasUnlockedCustomCursor = false;
  currentCursorIndex = 0;
  notepad.isActive = false;
  notepad.showHelp = false;

  particles = [];
  popups = [];
  gameIconPos = createVector(width / 2, height / 2);
  relocateHiddenIcon();
  initParticleGrid();
  lastWindowActivity = millis();

  if (bgMusic && bgMusic.isPlaying()) bgMusic.stop();
  if (bgMusicEgg && bgMusicEgg.isPlaying()) bgMusicEgg.stop();
  if (sndStartup && sndStartup.isPlaying()) sndStartup.stop();
  if (sndBiosBeep && sndBiosBeep.isPlaying()) sndBiosBeep.stop();
  if (sndRecycle && sndRecycle.isPlaying()) sndRecycle.stop();
  if (sndInternetExplorer && sndInternetExplorer.isPlaying())
    sndInternetExplorer.stop();
  if (sndTree && sndTree.isPlaying()) sndTree.stop();
  if (sndScan && sndScan.isPlaying()) sndScan.stop();
  if (sndSearch && sndSearch.isPlaying()) sndSearch.stop();
  if (sndAOE2 && sndAOE2.isPlaying()) sndAOE2.stop();
  if (sndDubSiren && sndDubSiren.isPlaying()) sndDubSiren.stop();
  if (sndGameOver && sndGameOver.isPlaying()) sndGameOver.stop();

  //Shut down the webcam
  if (video) {
    video.remove();
    video = null;
  }
}

function getMappedMouse() {
  return {
    x: map(mouseX, 0, width, 0, CANVAS_W),
    y: map(mouseY, 0, height, 0, CANVAS_H),
  };
}

/////////////////////////DRAW FUNCTION
function draw() {
  pg.clear();
  pg.push();

  if (
    (state === "DESKTOP" || state === "SIMULATION") &&
    notepad.isActive &&
    !notepad.showHelp
  ) {
    if (keyIsDown(8) || keyIsDown(46)) {
      if (notepad.backspaceTimer === 0 || notepad.backspaceTimer > 25) {
        if (notepad.backspaceTimer === 0 || notepad.backspaceTimer % 2 === 0) {
          if (notepad.selStart !== notepad.selEnd) {
            deleteNotepadSelection();
            updateNotepadLayout();
            localStorage.setItem("os98_notepad", notepad.text);
          } else if (notepad.cursorPos > 0) {
            notepad.text =
              notepad.text.substring(0, notepad.cursorPos - 1) +
              notepad.text.substring(notepad.cursorPos);
            notepad.cursorPos--;
            notepad.selStart = notepad.cursorPos;
            notepad.selEnd = notepad.cursorPos;
            updateNotepadLayout();
            localStorage.setItem("os98_notepad", notepad.text);
          }
        }
      }
      notepad.backspaceTimer++;
    } else {
      notepad.backspaceTimer = 0;
    }
  }

  if (state === "POWER_OFF") {
    pg.background("#000");
    pg.fill(255);
    pg.textFont(fontBold);
    pg.textSize(24);
    pg.textAlign(CENTER, CENTER);
    pg.text("> CLICK ANYWHERE TO POWER ON <", width / 2, height / 2);
  } else if (state === "BOOTING") {
    drawBootSequence();
  } else if (state === "ERROR") {
    drawErrorScreen();
    if (millis() - errorStartTime > 10000) resetSystem();
  } else {
    if (state === "DESKTOP" || state === "SIMULATION") {
      if (imgBg) {
        pg.imageMode(CENTER);
        pg.image(imgBg, width / 2, height / 2, width, height);
      } else {
        pg.background("#008080");
      }

      drawStaticApps();

      if (state === "DESKTOP") {
        let eggDelay = desktopApps.length * 120;
        if (millis() - desktopStartTime > eggDelay) {
          drawGameIcon(gameIconPos);
        }
      } else if (state === "SIMULATION") {
        if (millis() - lastRelocationTime >= RELOCATION_INTERVAL) {
          relocateHiddenIcon();
          lastRelocationTime = millis();
        }
        drawGameIcon(targetHiddenPos);
        for (let p of particles) {
          p.behaviors();
          p.update();
          p.show();
        }
      }
    } else if (state === "EGG_BOOT") {
      drawEggBoot();
    } else if (state === "EGG_START") {
      drawEggStart();
    } else if (state === "EGG_GAME") {
      drawEggGame();
    } else if (state === "EGG_GAMEOVER") {
      drawEggGameOver();
    }

    if (state === "DESKTOP" || state === "SIMULATION") {
      drawPopups();
      drawNotepad();
      drawWindowsMenuBar();
    }
  }

  drawCustomCursor();
  pg.pop();

  shader(crtShader);
  crtShader.setUniform("tex0", pg);
  crtShader.setUniform("u_resolution", [width, height]);
  crtShader.setUniform("u_time", millis() / 1000.0);
  crtShader.setUniform("u_curvature", CRT_CURVATURE);
  crtShader.setUniform("u_fit", CRT_FIT);
  crtShader.setUniform("u_scanline_density", CRT_SCANLINE_DENSITY);
  crtShader.setUniform("u_scanline_opacity", CRT_SCANLINE_OPACITY);
  crtShader.setUniform("u_chromatic_aberration", CRT_CHROMATIC_ABERRATION);
  crtShader.setUniform("u_vignette_amount", CRT_VIGNETTE_AMOUNT);

  rect(-width / 2, -height / 2, width, height);

  resetShader();
  if (
    hasUnlockedCustomCursor &&
    cursorImages.length > 0 &&
    cursorImages[currentCursorIndex]
  ) {
    push();
    translate(width * 2, height * 2);
    image(cursorImages[currentCursorIndex], 0, 0, 1, 1);
    pop();
  }
}

/////////////////////////KEYBOARD INPUT FOR NOTEPAD
function updateNotepadLayout() {
  pg.textFont(fontReg);
  pg.textSize(14);
  notepad.lines = [];
  let maxW = notepad.w - 32;

  let rawIndex = 0;
  let paras = notepad.text.split("\n");

  for (let p of paras) {
    let words = p.split(" ");
    let currentLine = "";
    let lineStart = rawIndex;

    for (let i = 0; i < words.length; i++) {
      let word = words[i] + (i < words.length - 1 ? " " : "");
      if (currentLine !== "" && pg.textWidth(currentLine + word) > maxW) {
        notepad.lines.push({
          text: currentLine,
          start: lineStart,
          end: lineStart + currentLine.length,
        });
        lineStart += currentLine.length;
        currentLine = word;
      } else {
        currentLine += word;
      }
    }
    notepad.lines.push({
      text: currentLine,
      start: lineStart,
      end: lineStart + currentLine.length,
    });
    rawIndex += p.length + 1;
  }

  let contentH = notepad.lines.length * 18;
  let viewH = notepad.h - 66;
  if (contentH <= viewH) notepad.scrollY = 0;
  else notepad.scrollY = constrain(notepad.scrollY, 0, contentH - viewH);
}

function getNotepadIndexFromMouse(mx, my) {
  let txtY = notepad.y + 46;
  let relY = my - txtY + notepad.scrollY;
  let lineIdx = floor(relY / 18);
  lineIdx = constrain(lineIdx, 0, notepad.lines.length - 1);
  if (!notepad.lines[lineIdx]) return 0;

  let l = notepad.lines[lineIdx];
  let relX = mx - (notepad.x + 4);

  let bestIdx = l.start;
  let minDiff = 9999;

  pg.textFont(fontReg);
  pg.textSize(14);
  for (let i = 0; i <= l.text.length; i++) {
    let w = pg.textWidth(l.text.substring(0, i));
    let diff = abs(w - relX);
    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = l.start + i;
    }
  }
  return constrain(bestIdx, 0, notepad.text.length);
}

function deleteNotepadSelection() {
  if (notepad.selStart !== notepad.selEnd) {
    let start = min(notepad.selStart, notepad.selEnd);
    let end = max(notepad.selStart, notepad.selEnd);
    notepad.text =
      notepad.text.substring(0, start) + notepad.text.substring(end);
    notepad.cursorPos = start;
    notepad.selStart = notepad.cursorPos;
    notepad.selEnd = notepad.cursorPos;
    return true;
  }
  return false;
}

function keyPressed() {
  if (
    (state === "DESKTOP" || state === "SIMULATION") &&
    notepad.isActive &&
    !notepad.showHelp
  ) {
    if (keyCode === ENTER || keyCode === RETURN) {
      if (notepad.text.length < notepad.maxChars) {
        deleteNotepadSelection();
        notepad.text =
          notepad.text.substring(0, notepad.cursorPos) +
          "\n" +
          notepad.text.substring(notepad.cursorPos);
        notepad.cursorPos++;
        notepad.selStart = notepad.cursorPos;
        notepad.selEnd = notepad.cursorPos;
        updateNotepadLayout();
        localStorage.setItem("os98_notepad", notepad.text);
      }
      return false;
    } else if (keyCode === LEFT_ARROW) {
      notepad.cursorPos = max(0, notepad.cursorPos - 1);
      if (!keyIsDown(SHIFT)) notepad.selStart = notepad.cursorPos;
      notepad.selEnd = notepad.cursorPos;
      return false;
    } else if (keyCode === RIGHT_ARROW) {
      notepad.cursorPos = min(notepad.text.length, notepad.cursorPos + 1);
      if (!keyIsDown(SHIFT)) notepad.selStart = notepad.cursorPos;
      notepad.selEnd = notepad.cursorPos;
      return false;
    }
  }
}

function keyTyped() {
  if (
    (state === "DESKTOP" || state === "SIMULATION") &&
    notepad.isActive &&
    !notepad.showHelp
  ) {
    if (key !== "Enter" && key !== "Return" && key.length === 1) {
      if (
        notepad.text.length < notepad.maxChars ||
        notepad.selStart !== notepad.selEnd
      ) {
        deleteNotepadSelection();
        notepad.text =
          notepad.text.substring(0, notepad.cursorPos) +
          key +
          notepad.text.substring(notepad.cursorPos);
        notepad.cursorPos++;
        notepad.selStart = notepad.cursorPos;
        notepad.selEnd = notepad.cursorPos;
        updateNotepadLayout();
        localStorage.setItem("os98_notepad", notepad.text);
      }
    }
    return false;
  }
}

function mouseWheel(event) {
  if ((state === "DESKTOP" || state === "SIMULATION") && !notepad.isMinimized) {
    let m = getMappedMouse();
    if (
      m.x > notepad.x &&
      m.x < notepad.x + notepad.w &&
      m.y > notepad.y &&
      m.y < notepad.y + notepad.h &&
      !notepad.showHelp
    ) {
      notepad.scrollY += event.delta;
      let contentH = notepad.lines.length * 18;
      let viewH = notepad.h - 66;
      notepad.scrollY = constrain(notepad.scrollY, 0, max(0, contentH - viewH));
      return false;
    }
  }
}

/////////////////////////INTERACTION FUNCTIONS
function mousePressed() {
  if (getAudioContext().state !== "running") userStartAudio();
  if (state === "POWER_OFF") {
    resetSystem();
    return;
  }
  if (state === "ERROR") {
    if (sndCrash) {
      sndCrash.setVolume(CRASH_VOLUME);
      sndCrash.play();
    }
    return;
  }
  if (state === "BOOTING") return;

  let m = getMappedMouse();
  let clickedOnElement = false;

  let barY = CANVAS_H - TASKBAR_HEIGHT - TASKBAR_PAD_BOTTOM;
  let btnX = TASKBAR_PAD_X + 4;
  let btnY = barY + 4;
  let btnW = 70;
  let btnH = TASKBAR_HEIGHT - 8;

  if (
    state === "DESKTOP" ||
    state === "SIMULATION" ||
    state === "EGG_BOOT" ||
    state === "EGG_START" ||
    state === "EGG_GAME" ||
    state === "EGG_GAMEOVER"
  ) {
    if (m.x > btnX && m.x < btnX + btnW && m.y > btnY && m.y < btnY + btnH) {
      state = "ERROR";
      errorStartTime = millis();
      if (bgMusic && bgMusic.isPlaying()) bgMusic.stop();
      if (bgMusicEgg && bgMusicEgg.isPlaying()) bgMusicEgg.stop();
      if (video) {
        video.remove();
        video = null;
      }
      if (sndCrash) {
        sndCrash.setVolume(CRASH_VOLUME);
        sndCrash.play();
      }
      return;
    }
  }

  if (
    state === "EGG_BOOT" ||
    state === "EGG_START" ||
    state === "EGG_GAME" ||
    state === "EGG_GAMEOVER"
  )
    return;

  if (state === "DESKTOP" || state === "SIMULATION") {
    // TASKBAR CLICKS
    if (m.y > barY && m.y < barY + TASKBAR_HEIGHT && m.x > btnX + btnW) {
      let tabX = TASKBAR_PAD_X + 80;

      //Notepad Taskbar tab hitbox
      if (m.x > tabX && m.x < tabX + 110) {
        notepad.isMinimized = !notepad.isMinimized;
        if (!notepad.isMinimized) notepad.isActive = true;
        return;
      }
      tabX += 115;

      //Vote Taskbar Hitbox
      if (m.x > tabX && m.x < tabX + 110) {
        let px = random(200, width - 350);
        let py = random(150, height - 300);
        popups.push(new WindowFrame(px, py, windowFrameImages[4])); // Spawns Window_frame_5
        lastWindowActivity = millis();
        return;
      }
      tabX += 115;

      for (let i = 0; i < popups.length; i++) {
        if (m.x > tabX && m.x < tabX + 100) {
          let selectedWindow = popups.splice(i, 1)[0];
          popups.push(selectedWindow);
          notepad.isActive = false;
          return;
        }
        tabX += 105;
      }
      return;
    }

    if (!notepad.isMinimized) {
      if (notepad.showHelp) {
        let hW = 280;
        let hH = 140;
        let hX = notepad.x + notepad.w / 2 - hW / 2;
        let hY = notepad.y + notepad.h / 2 - hH / 2;

        if (m.x > hX && m.x < hX + hW && m.y > hY && m.y < hY + hH) {
          if (
            m.x > hX + hW / 2 - 40 &&
            m.x < hX + hW / 2 + 40 &&
            m.y > hY + hH - 35 &&
            m.y < hY + hH - 10
          ) {
            notepad.showHelp = false;
            notepad.isActive = true;
          }
          return;
        }
      }

      if (
        m.x > notepad.x &&
        m.x < notepad.x + notepad.w &&
        m.y > notepad.y &&
        m.y < notepad.y + notepad.h
      ) {
        clickedOnElement = true;
        notepad.isActive = true;
        lastWindowActivity = millis();

        if (
          m.x > notepad.x + notepad.w - 20 &&
          m.x < notepad.x + notepad.w - 4 &&
          m.y > notepad.y + 4 &&
          m.y < notepad.y + 18
        ) {
          if (sndCrash) {
            sndCrash.setVolume(CRASH_VOLUME);
            sndCrash.play();
          }
          return;
        }
        if (
          m.x > notepad.x + notepad.w - 52 &&
          m.x < notepad.x + notepad.w - 36 &&
          m.y > notepad.y + 4 &&
          m.y < notepad.y + 18
        ) {
          notepad.isMinimized = true;
          notepad.isActive = false;
          return;
        }
        if (
          m.y > notepad.y + 24 &&
          m.y < notepad.y + 40 &&
          m.x > notepad.x + 130 &&
          m.x < notepad.x + 160
        ) {
          notepad.showHelp = true;
          notepad.isActive = false;
          return;
        }
        if (
          m.x > notepad.x + notepad.w - 15 &&
          m.y > notepad.y + notepad.h - 15
        ) {
          notepad.isResizing = true;
          return;
        }
        if (m.y < notepad.y + 22) {
          notepad.isDragging = true;
          notepad.dragOffsetX = m.x - notepad.x;
          notepad.dragOffsetY = m.y - notepad.y;
          return;
        }

        let txtH = notepad.h - 66;
        let txtW = notepad.w - 24;
        let contentH = notepad.lines.length * 18;
        if (contentH > txtH && m.x > notepad.x + 4 + txtW) {
          let th = max(20, txtH * (txtH / contentH));
          let ty =
            notepad.y +
            46 +
            (notepad.scrollY / (contentH - txtH)) * (txtH - th);
          if (m.y > ty && m.y < ty + th) {
            notepad.isDraggingVScroll = true;
            notepad.vScrollDragOffset = m.y - ty;
            return;
          }
        }

        let txtY = notepad.y + 46;
        if (
          m.x > notepad.x + 4 &&
          m.x < notepad.x + 4 + txtW &&
          m.y > txtY &&
          m.y < txtY + txtH
        ) {
          notepad.isSelecting = true;
          let idx = getNotepadIndexFromMouse(m.x, m.y);
          notepad.cursorPos = idx;
          notepad.selStart = idx;
          notepad.selEnd = idx;
        }
        return;
      } else {
        notepad.isActive = false;
      }
    }

    if (!clickedOnElement) {
      for (let i = popups.length - 1; i >= 0; i--) {
        let p = popups[i];
        if (m.x > p.x && m.x < p.x + p.w && m.y > p.y && m.y < p.y + p.h) {
          clickedOnElement = true;
          lastWindowActivity = millis();
          notepad.isActive = false;

          if (m.x > p.x + p.w - 30 && m.y < p.y + 30) {
            popups.push(new WindowFrame(p.x + 25, p.y + 25, p.img));
            return;
          } else {
            p.isDragging = true;
            p.dragOffsetX = m.x - p.x;
            p.dragOffsetY = m.y - p.y;
            popups.push(popups.splice(i, 1)[0]);
            return;
          }
        }
      }
    }

    if (!clickedOnElement) {
      let elapsedDesktop = millis() - desktopStartTime;
      for (let i = 0; i < desktopApps.length; i++) {
        let app = desktopApps[i];
        let delay = i * 120;

        if (state === "SIMULATION" || elapsedDesktop > delay) {
          if (dist(m.x, m.y, app.pos.x, app.pos.y) < ICON_SIZE) {
            if (app.label === "Recycle Bin Full" && sndRecycle) {
              sndRecycle.setVolume(RECYCLE_VOLUME);
              sndRecycle.play();
            } else if (
              app.label === "Internet Explorer" &&
              sndInternetExplorer
            ) {
              sndInternetExplorer.setVolume(IE_VOLUME);
              sndInternetExplorer.play();
            } else if (app.label === "Tree" && sndTree) {
              sndTree.setVolume(TREE_VOLUME);
              sndTree.play();
            } else if (app.label === "Scan CD" && sndScan) {
              sndScan.setVolume(SCAN_VOLUME);
              sndScan.play();
            } else if (app.label === "Search in PC" && sndSearch) {
              sndSearch.setVolume(SEARCH_VOLUME);
              sndSearch.play();
            } else if (app.label === "AOE2" && sndAOE2) {
              sndAOE2.setVolume(AOE2_VOLUME);
              sndAOE2.play();
            }

            spawnRandomPopup();
            clickedOnElement = true;
            break;
          }
        }
      }
    }

    if (!clickedOnElement) {
      let iconToCheck = state === "DESKTOP" ? gameIconPos : targetHiddenPos;
      let eggDelay = desktopApps.length * 120;

      if (state === "SIMULATION" || millis() - desktopStartTime > eggDelay) {
        if (dist(m.x, m.y, iconToCheck.x, iconToCheck.y) < ICON_SIZE) {
          clickedOnElement = true;
          let now = millis();

          if (now - lastEggClickTime < 400) {
            if (state === "DESKTOP") {
              state = "SIMULATION";
              lastRelocationTime = now;
              initParticleGrid();
            } else if (state === "SIMULATION") {
              state = "EGG_BOOT";
              eggBootStartTime = millis();
              particles = [];
              popups = [];
              if (bgMusic && bgMusic.isPlaying()) bgMusic.stop();
            }
          }
          lastEggClickTime = now;
        }
      }
    }

    if (!clickedOnElement) {
      if (!hasUnlockedCustomCursor) {
        hasUnlockedCustomCursor = true;
      } else {
        if (cursorImages.length > 0) {
          currentCursorIndex = (currentCursorIndex + 1) % cursorImages.length;
        }
      }
    }
  }
}

function mouseDragged() {
  if (state === "DESKTOP" || state === "SIMULATION") {
    let m = getMappedMouse();

    if (notepad.isDragging) {
      notepad.x = m.x - notepad.dragOffsetX;
      notepad.y = m.y - notepad.dragOffsetY;
      return;
    }
    if (notepad.isResizing) {
      notepad.w = max(250, m.x - notepad.x);
      notepad.h = max(200, m.y - notepad.y);
      updateNotepadLayout();
      return;
    }
    if (notepad.isSelecting) {
      notepad.selEnd = getNotepadIndexFromMouse(m.x, m.y);
      notepad.cursorPos = notepad.selEnd;
      return;
    }
    if (notepad.isDraggingVScroll) {
      let txtH = notepad.h - 66;
      let contentH = notepad.lines.length * 18;
      let th = max(20, txtH * (txtH / contentH));
      let newTy = m.y - notepad.vScrollDragOffset - (notepad.y + 46);
      notepad.scrollY = (newTy / (txtH - th)) * (contentH - txtH);
      notepad.scrollY = constrain(notepad.scrollY, 0, contentH - txtH);
      return;
    }

    for (let p of popups) {
      if (p.isDragging) {
        p.updateDrag(m.x, m.y);
      }
    }
  }
}

function mouseReleased() {
  notepad.isDragging = false;
  notepad.isResizing = false;
  notepad.isSelecting = false;
  notepad.isDraggingVScroll = false;

  for (let p of popups) {
    if (p.isDragging) {
      p.isDragging = false;
      p.lastStampX = p.x;
      p.lastStampY = p.y;
    }
  }

  let m = getMappedMouse();

  if (state === "EGG_BOOT") {
    let elapsed = millis() - eggBootStartTime;
    if (elapsed > 3000) {
      let mouseBtnHover =
        m.x > CANVAS_W / 3 - 100 &&
        m.x < CANVAS_W / 3 + 100 &&
        m.y > CANVAS_H / 2 + 60 &&
        m.y < CANVAS_H / 2 + 120;
      let webBtnHover =
        m.x > (2 * CANVAS_W) / 3 - 120 &&
        m.x < (2 * CANVAS_W) / 3 + 120 &&
        m.y > CANVAS_H / 2 + 60 &&
        m.y < CANVAS_H / 2 + 120;

      if (mouseBtnHover || webBtnHover) {
        eggInputMode = mouseBtnHover ? "MOUSE" : "WEBCAM";
        state = "EGG_START";
        eggMenuState = "MAIN";
        if (bgMusicEgg && !bgMusicEgg.isPlaying()) {
          bgMusicEgg.setVolume(EGG_MUSIC_VOLUME);
          bgMusicEgg.loop();
        }
      }
    }
  } else if (state === "EGG_START") {
    if (eggMenuState === "MAIN") {
      let startHover =
        m.x > width / 2 - 150 &&
        m.x < width / 2 + 150 &&
        m.y > height / 2 - 10 &&
        m.y < height / 2 + 50;
      let diffHover =
        m.x > width / 2 - 150 &&
        m.x < width / 2 + 150 &&
        m.y > height / 2 + 60 &&
        m.y < height / 2 + 120;
      let exitHover =
        m.x > width / 2 - 100 &&
        m.x < width / 2 + 100 &&
        m.y > height / 2 + 130 &&
        m.y < height / 2 + 190;

      if (startHover) {
        state = "EGG_GAME";
        if (bgMusicEgg && bgMusicEgg.isPlaying()) bgMusicEgg.stop();

        if (sndDubSiren) {
          sndDubSiren.setVolume(EGG_SIREN_VOLUME);
          sndDubSiren.play();
        }

        eggLifes = 3;
        eggTimer = 5;
        points = 0;
        activeEggs = [];
        framesSinceLastSpawn = 0;

        if (eggInputMode === "WEBCAM" && !video) {
          video = createCapture(VIDEO);
          video.size(CANVAS_W, CANVAS_H);
          video.hide();
          handPose.detectStart(video, handsFound);
        }
      } else if (diffHover) {
        eggMenuState = "DIFFICULTY";
      } else if (exitHover) {
        state = "DESKTOP";
        if (bgMusicEgg && bgMusicEgg.isPlaying()) bgMusicEgg.stop();
        if (bgMusic && !bgMusic.isPlaying()) bgMusic.loop();
        if (video) {
          video.remove();
          video = null;
        }
      }
    } else if (eggMenuState === "DIFFICULTY") {
      let regHover =
        m.x > CANVAS_W / 3 - 100 &&
        m.x < CANVAS_W / 3 + 100 &&
        m.y > CANVAS_H / 2 - 30 &&
        m.y < CANVAS_H / 2 + 70;
      let cwazyHover =
        m.x > (2 * CANVAS_W) / 3 - 100 &&
        m.x < (2 * CANVAS_W) / 3 + 100 &&
        m.y > CANVAS_H / 2 - 30 &&
        m.y < CANVAS_H / 2 + 70;

      if (regHover) {
        eggDifficulty = "REGULAR";
        eggMenuState = "MAIN";
      } else if (cwazyHover) {
        eggDifficulty = "CWAZY";
        eggMenuState = "MAIN";
      }
    }
  } else if (state === "EGG_GAME") {
    if (m.x > 650 && m.x < 750 && m.y > 370 && m.y < 430) {
      state = "EGG_START";
      eggMenuState = "MAIN";
      if (bgMusicEgg && !bgMusicEgg.isPlaying()) bgMusicEgg.loop();
      if (video) {
        video.remove();
        video = null;
      }
    }
  } else if (state === "EGG_GAMEOVER") {
    let menuHover =
      m.x > width / 2 - 150 &&
      m.x < width / 2 + 150 &&
      m.y > height / 2 + 20 &&
      m.y < height / 2 + 80;
    let exitHover =
      m.x > width / 2 - 100 &&
      m.x < width / 2 + 100 &&
      m.y > height / 2 + 110 &&
      m.y < height / 2 + 170;

    if (menuHover) {
      if (sndGameOver && sndGameOver.isPlaying()) sndGameOver.stop();
      state = "EGG_START";
      eggMenuState = "MAIN";
      if (bgMusicEgg && !bgMusicEgg.isPlaying()) bgMusicEgg.loop();
    } else if (exitHover) {
      if (sndGameOver && sndGameOver.isPlaying()) sndGameOver.stop();
      state = "DESKTOP";
      if (bgMusic && !bgMusic.isPlaying()) bgMusic.loop();
      // Ensure video shuts down if navigating straight back to desktop
      if (video) {
        video.remove();
        video = null;
      }
    }
  }
}

/////////////////////////WINDOWS NAV BAR ENGINE
function drawWindowsMenuBar() {
  pg.rectMode(CORNER);

  let barX = TASKBAR_PAD_X;
  let barY = CANVAS_H - TASKBAR_HEIGHT - TASKBAR_PAD_BOTTOM;
  let barW = CANVAS_W - TASKBAR_PAD_X * 2;

  pg.fill(192);
  pg.noStroke();
  pg.rect(barX, barY, barW, TASKBAR_HEIGHT);

  pg.stroke(255);
  pg.strokeWeight(1);
  pg.line(barX, barY, barX + barW, barY);

  let btnX = barX + 10;
  let btnY = barY + 6;
  let btnW = 70;
  let btnH = TASKBAR_HEIGHT - 12;

  if (imgStartBtn) {
    pg.imageMode(CORNER);
    pg.image(imgStartBtn, btnX, btnY, btnW, btnH);
  } else {
    pg.fill(192);
    pg.rect(btnX, btnY, btnW, btnH);
    pg.stroke(255);
    pg.line(btnX, btnY, btnX + btnW, btnY);
    pg.line(btnX, btnY, btnX, btnY + btnH);
    pg.stroke(128);
    pg.line(btnX + btnW, btnY + 1, btnX + btnW, btnY + btnH);
    pg.line(btnX + 1, btnY + btnH, btnX + btnW, btnY + btnH);
    pg.stroke(0);
    pg.line(btnX + btnW + 1, btnY, btnX + btnW + 1, btnY + btnH + 1);
    pg.line(btnX, btnY + btnH + 1, btnX + btnW + 1, btnY + btnH + 1);
    pg.noStroke();
    pg.fill(0);
    pg.textFont(fontBold);
    pg.textSize(12);
    pg.textAlign(CENTER, CENTER);
    pg.text("Start", btnX + btnW / 2, btnY + btnH / 2);
  }

  let tabX = barX + 80;

  let noteActive = !notepad.isMinimized;
  pg.fill(noteActive ? 220 : 192);
  pg.rect(tabX, btnY, 110, btnH);
  if (noteActive) {
    pg.stroke(128);
    pg.line(tabX, btnY, tabX + 110, btnY);
    pg.line(tabX, btnY, tabX, btnY + btnH);
    pg.stroke(0);
    pg.line(tabX, btnY - 1, tabX + 111, btnY - 1);
  } else {
    pg.stroke(255);
    pg.line(tabX, btnY, tabX + 110, btnY);
    pg.line(tabX, btnY, tabX, btnY + btnH);
    pg.stroke(128);
    pg.line(tabX + 110, btnY, tabX + 110, btnY + btnH);
    pg.line(tabX, btnY + btnH, tabX + 110, btnY + btnH);
  }
  if (imgNotepadTab) {
    pg.imageMode(CENTER);
    pg.image(imgNotepadTab, tabX + 16, btnY + btnH / 2, 16, 16);
  }
  pg.noStroke();
  pg.fill(0);
  pg.textFont(fontReg);
  pg.textSize(10);
  pg.textAlign(LEFT, CENTER);
  pg.text("CuteMessage...", tabX + 28, btnY + btnH / 2);
  tabX += 115;

  pg.fill(192);
  pg.rect(tabX, btnY, 110, btnH);
  pg.stroke(255);
  pg.line(tabX, btnY, tabX + 110, btnY);
  pg.line(tabX, btnY, tabX, btnY + btnH);
  pg.stroke(128);
  pg.line(tabX + 110, btnY, tabX + 110, btnY + btnH);
  pg.line(tabX, btnY + btnH, tabX + 110, btnY + btnH);

  if (imgVoteTab) {
    pg.imageMode(CENTER);
    pg.image(imgVoteTab, tabX + 16, btnY + btnH / 2, 16, 16);
  }
  pg.noStroke();
  pg.fill(0);
  pg.textFont(fontReg);
  pg.textSize(10);
  pg.textAlign(LEFT, CENTER);
  pg.text("PLS VOTE", tabX + 28, btnY + btnH / 2);
  tabX += 115;

  let tabTexts = ["Did u", "catch", "the egg yet", "buddy"];

  for (let i = 0; i < popups.length; i++) {
    let isFocused = i === popups.length - 1 && notepad.isMinimized;
    pg.fill(isFocused ? 220 : 192);
    pg.rect(tabX, btnY, 100, btnH);

    if (isFocused) {
      pg.stroke(128);
      pg.line(tabX, btnY, tabX + 100, btnY);
      pg.line(tabX, btnY, tabX, btnY + btnH);
      pg.stroke(0);
      pg.line(tabX, btnY - 1, tabX + 101, btnY - 1);
    } else {
      pg.stroke(255);
      pg.line(tabX, btnY, tabX + 100, btnY);
      pg.line(tabX, btnY, tabX, btnY + btnH);
      pg.stroke(128);
      pg.line(tabX + 100, btnY, tabX + 100, btnY + btnH);
      pg.line(tabX, btnY + btnH, tabX + 100, btnY + btnH);
    }

    if (imgNotepadTab) {
      pg.imageMode(CENTER);
      pg.image(imgNotepadTab, tabX + 14, btnY + btnH / 2, 16, 16);
    }

    pg.noStroke();
    pg.fill(0);
    pg.textFont(fontReg);
    pg.textSize(10);
    pg.textAlign(LEFT, CENTER);
    pg.text(tabTexts[i] || "Window", tabX + 26, btnY + btnH / 2);
    tabX += 105;
  }

  let trayW = 74;
  let trayH = TASKBAR_HEIGHT - 8;
  let trayX = barX + barW - trayW - 6;
  let trayY = barY + 4;

  pg.fill(192);
  pg.rect(trayX, trayY, trayW, trayH);

  pg.stroke(128);
  pg.line(trayX, trayY, trayX + trayW, trayY);
  pg.line(trayX, trayY, trayX, trayY + trayH);
  pg.stroke(255);
  pg.line(trayX + trayW, trayY + 1, trayX + trayW, trayY + trayH);
  pg.line(trayX + 1, trayY + trayH, trayX + trayW, trayY + trayH);

  let hStr = nfs(hour(), 2).trim();
  let mStr = nfs(minute(), 2).trim();
  let timeText = hStr + ":" + mStr;

  pg.noStroke();
  pg.fill(0);
  pg.textFont(fontReg);
  pg.textSize(12);
  pg.textAlign(CENTER, CENTER);
  pg.text(timeText, trayX + trayW / 2, trayY + trayH / 2);
}


/////////////////////////NOTEPAD WIDGET ENGINE
function drawNotepad() {
  if (notepad.isMinimized) return;

  pg.push();
  pg.translate(notepad.x, notepad.y);
  pg.rectMode(CORNER);

  pg.fill(192);
  pg.stroke(255);
  pg.strokeWeight(1);
  pg.rect(0, 0, notepad.w, notepad.h);

  pg.stroke(128);
  pg.line(notepad.w, 0, notepad.w, notepad.h);
  pg.line(0, notepad.h, notepad.w, notepad.h);
  pg.stroke(0);
  pg.line(notepad.w + 1, 0, notepad.w + 1, notepad.h + 1);
  pg.line(0, notepad.h + 1, notepad.w + 1, notepad.h + 1);

  pg.fill(0, 0, 128);
  pg.noStroke();
  pg.rect(3, 3, notepad.w - 6, 18);
  pg.fill(255);
  pg.textFont(fontBold);
  pg.textSize(12);
  pg.textAlign(LEFT, CENTER);
  pg.text("CuteMessageBox - Notepad", 6, 12);

  pg.fill(192);
  pg.rect(notepad.w - 52, 4, 16, 14);
  pg.stroke(255);
  pg.line(notepad.w - 52, 4, notepad.w - 36, 4);
  pg.line(notepad.w - 52, 4, notepad.w - 52, 18);
  pg.stroke(0);
  pg.line(notepad.w - 36, 4, notepad.w - 36, 18);
  pg.line(notepad.w - 52, 18, notepad.w - 36, 18);
  pg.fill(0);
  pg.rect(notepad.w - 48, 14, 6, 2);

  pg.fill(192);
  pg.noStroke();
  pg.rect(notepad.w - 36, 4, 16, 14);
  pg.stroke(255);
  pg.line(notepad.w - 36, 4, notepad.w - 20, 4);
  pg.line(notepad.w - 36, 4, notepad.w - 36, 18);
  pg.stroke(0);
  pg.line(notepad.w - 20, 4, notepad.w - 20, 18);
  pg.line(notepad.w - 36, 18, notepad.w - 20, 18);
  pg.noFill();
  pg.stroke(128);
  pg.rect(notepad.w - 33, 7, 10, 8);
  pg.line(notepad.w - 33, 8, notepad.w - 23, 8);

  pg.fill(192);
  pg.noStroke();
  pg.rect(notepad.w - 20, 4, 16, 14);
  pg.stroke(255);
  pg.line(notepad.w - 20, 4, notepad.w - 4, 4);
  pg.line(notepad.w - 20, 4, notepad.w - 20, 18);
  pg.stroke(0);
  pg.line(notepad.w - 4, 4, notepad.w - 4, 18);
  pg.line(notepad.w - 20, 18, notepad.w - 4, 18);
  pg.fill(0);
  pg.noStroke();
  pg.textAlign(CENTER, CENTER);
  pg.text("X", notepad.w - 11, 11);

  pg.fill(0);
  pg.noStroke();
  pg.textFont(fontReg);
  pg.textSize(12);
  pg.textAlign(LEFT, TOP);
  pg.text("File", 8, 26);
  pg.text("Edit", 40, 26);
  pg.text("Search", 72, 26);
  pg.text("Help", 130, 26);

  let txtX = 4;
  let txtY = 46;
  let txtW = notepad.w - 24;
  let txtH = notepad.h - 66;

  pg.stroke(128);
  pg.line(txtX - 1, txtY - 1, txtX + txtW + 1, txtY - 1);
  pg.line(txtX - 1, txtY - 1, txtX - 1, txtY + txtH + 1);
  pg.stroke(255);
  pg.line(txtX + txtW + 1, txtY - 1, txtX + txtW + 1, txtY + txtH + 1);
  pg.line(txtX - 1, txtY + txtH + 1, txtX + txtW + 1, txtY + txtH + 1);

  pg.fill(255);
  pg.noStroke();
  pg.rect(txtX, txtY, txtW, txtH);

  pg.fill(220);
  pg.rect(txtX + txtW, txtY, 16, txtH);
  pg.rect(txtX, txtY + txtH, txtW, 16);
  pg.fill(192);
  pg.rect(txtX + txtW, txtY + txtH, 16, 16);

  let contentH = notepad.lines.length * 18;
  if (contentH > txtH) {
    let th = max(20, txtH * (txtH / contentH));
    let ty = txtY + (notepad.scrollY / (contentH - txtH)) * (txtH - th);

    pg.fill(192);
    pg.rect(txtX + txtW, ty, 16, th);
    pg.stroke(255);
    pg.line(txtX + txtW, ty, txtX + txtW + 16, ty);
    pg.line(txtX + txtW, ty, txtX + txtW, ty + th);
    pg.stroke(0);
    pg.line(txtX + txtW + 16, ty, txtX + txtW + 16, ty + th);
    pg.line(txtX + txtW, ty + th, txtX + txtW + 16, ty + th);
  }

  pg.drawingContext.save();
  pg.drawingContext.beginPath();
  pg.drawingContext.rect(txtX, txtY, txtW, txtH);
  pg.drawingContext.clip();

  pg.textFont(fontReg);
  pg.textSize(14);
  pg.textLeading(18);

  let start = min(notepad.selStart, notepad.selEnd);
  let end = max(notepad.selStart, notepad.selEnd);

  if (start !== end) {
    pg.fill(160, 200, 255);
    pg.noStroke();
    for (let i = 0; i < notepad.lines.length; i++) {
      let l = notepad.lines[i];
      if (end > l.start && start < l.end) {
        let selLineStart = max(start, l.start) - l.start;
        let selLineEnd = min(end, l.end) - l.start;
        let xOffset = pg.textWidth(l.text.substring(0, selLineStart));
        let w = pg.textWidth(l.text.substring(selLineStart, selLineEnd));
        pg.rect(txtX + 4 + xOffset, txtY + 4 + i * 18 - notepad.scrollY, w, 18);
      }
    }
  }

  pg.fill(0);
  pg.textAlign(LEFT, TOP);
  let currentY = txtY + 4 - notepad.scrollY;

  for (let i = 0; i < notepad.lines.length; i++) {
    pg.text(notepad.lines[i].text, txtX + 4, currentY);
    currentY += 18;
  }

  if (
    notepad.isActive &&
    !notepad.showHelp &&
    notepad.selStart === notepad.selEnd &&
    frameCount % 60 < 30
  ) {
    for (let i = 0; i < notepad.lines.length; i++) {
      let l = notepad.lines[i];
      if (notepad.cursorPos >= l.start && notepad.cursorPos <= l.end) {
        let xOffset = pg.textWidth(
          l.text.substring(0, notepad.cursorPos - l.start)
        );
        pg.text(
          "|",
          txtX + 4 + xOffset - 3,
          txtY + 4 + i * 18 - notepad.scrollY
        );
        break;
      }
    }
  }

  pg.drawingContext.restore();

  pg.stroke(128);
  pg.strokeWeight(1);
  pg.line(notepad.w - 14, notepad.h - 4, notepad.w - 4, notepad.h - 14);
  pg.line(notepad.w - 10, notepad.h - 4, notepad.w - 4, notepad.h - 10);
  pg.line(notepad.w - 6, notepad.h - 4, notepad.w - 4, notepad.h - 6);

  pg.fill(120);
  pg.noStroke();
  pg.textAlign(LEFT, BOTTOM);
  pg.textSize(10);
  pg.text(
    `Chars: ${notepad.text.length}/${notepad.maxChars}`,
    6,
    notepad.h - 2
  );

  if (notepad.showHelp) {
    let hW = 280;
    let hH = 140;
    let hX = notepad.w / 2 - hW / 2;
    let hY = notepad.h / 2 - hH / 2;

    pg.fill(192);
    pg.stroke(255);
    pg.strokeWeight(1);
    pg.rect(hX, hY, hW, hH);
    pg.stroke(128);
    pg.line(hX + hW, hY, hX + hW, hY + hH);
    pg.line(hX, hY + hH, hX + hW, hY + hH);
    pg.stroke(0);
    pg.line(hX + hW + 1, hY, hX + hW + 1, hY + hH + 1);
    pg.line(hX, hY + hH + 1, hX + hW + 1, hY + hH + 1);

    pg.fill(0, 0, 128);
    pg.noStroke();
    pg.rect(hX + 3, hY + 3, hW - 6, 18);
    pg.fill(255);
    pg.textFont(fontBold);
    pg.textSize(12);
    pg.textAlign(LEFT, CENTER);
    pg.text("Notepad Help", hX + 6, hY + 12);

    pg.fill(0);
    pg.textFont(fontReg);
    pg.textSize(12);
    pg.textAlign(CENTER, TOP);
    pg.textLeading(16);
    pg.text(
      "Cute messages only! Please be nice together and respect the community guidelines. The world has enough hate! Instead, we need more solidarity, activism and above all cute messages!! Luv u bye <3",
      hX + 10,
      hY + 30,
      hW - 20,
      hH - 60
    );

    let okX = hX + hW / 2 - 40;
    let okY = hY + hH - 35;
    pg.fill(192);
    pg.rect(okX, okY, 80, 24);
    pg.stroke(255);
    pg.line(okX, okY, okX + 80, okY);
    pg.line(okX, okY, okX, okY + 24);
    pg.stroke(0);
    pg.line(okX + 80, okY, okX + 80, okY + 24);
    pg.line(okX, okY + 24, okX + 80, okY + 24);
    pg.fill(0);
    pg.noStroke();
    pg.textAlign(CENTER, CENTER);
    pg.text("OK", okX + 40, okY + 12);
  }

  pg.pop();
}

/////////////////////////EGG GAME FUNCTIONS
function drawEggBoot() {
  pg.push();
  pg.background(0);
  let elapsed = millis() - eggBootStartTime;

  if (elapsed < 3000) {
    let t = constrain(elapsed / 1500, 0, 1);
    let c1 = 1.70158;
    let c3 = c1 + 1;
    let scaleVal = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    let alphaVal = map(elapsed, 0, 500, 0, 255);

    pg.translate(CANVAS_W / 2, CANVAS_H / 2);
    pg.scale(max(0, scaleVal));
    pg.textAlign(CENTER, CENTER);
    pg.fill(255, 10, 40, constrain(alphaVal, 0, 255));
    if (fontEggBold) pg.textFont(fontEggBold);
    pg.textSize(96);
    pg.text("EGGMANIA 2000", 0, 0);
  } else {
    pg.textAlign(CENTER, CENTER);
    pg.fill(255);
    pg.textFont(fontReg);
    pg.textSize(18);
    pg.text(
      "Do you want to use your lame, regular, oldfashioned input device: a Mouse ?",
      CANVAS_W / 2,
      CANVAS_H / 2 - 80
    );
    pg.text(
      "or would you like to try out the newest tech on the market: the indexfingertracker2000 mk4 ?",
      CANVAS_W / 2,
      CANVAS_H / 2 - 40
    );

    let m = getMappedMouse();

    let mouseHover =
      m.x > CANVAS_W / 3 - 100 &&
      m.x < CANVAS_W / 3 + 100 &&
      m.y > CANVAS_H / 2 + 60 &&
      m.y < CANVAS_H / 2 + 120;
    pg.push();
    pg.translate(CANVAS_W / 3, CANVAS_H / 2 + 90);
    if (mouseHover && mouseIsPressed) pg.scale(0.9);
    else if (mouseHover) pg.scale(1.05);
    pg.fill(mouseHover ? color(255, 50, 50) : color(200));
    pg.noStroke();
    pg.textSize(42);
    if (fontEggBold) pg.textFont(fontEggBold);
    pg.text("MOUSE", 0, 0);
    pg.pop();

    let webHover =
      m.x > (2 * CANVAS_W) / 3 - 120 &&
      m.x < (2 * CANVAS_W) / 3 + 120 &&
      m.y > CANVAS_H / 2 + 60 &&
      m.y < CANVAS_H / 2 + 120;
    pg.push();
    pg.translate((2 * CANVAS_W) / 3, CANVAS_H / 2 + 90);
    if (webHover && mouseIsPressed) pg.scale(0.9);
    else if (webHover) pg.scale(1.05);
    pg.fill(webHover ? color(255, 50, 50) : color(200));
    pg.noStroke();
    pg.textSize(42);
    if (fontEggBold) pg.textFont(fontEggBold);
    pg.text("WEBCAM", 0, 0);
    pg.pop();
  }
  pg.pop();
}

function drawEggStart() {
  pg.push();
  if (imgEggStartBg) {
    pg.imageMode(CENTER);
    pg.image(imgEggStartBg, width / 2, height / 2, width, height);
  } else pg.background(255, 240, 230);

  pg.rectMode(CENTER);
  pg.textAlign(CENTER, CENTER);

  pg.fill(255);
  pg.textSize(96);
  if (fontEggBold) pg.textFont(fontEggBold);
  pg.text("EGGMANIA 2000", width / 2, height / 2 - 160);

  pg.fill(255);
  pg.textSize(16);
  pg.textFont(fontReg);
  pg.textAlign(RIGHT, BOTTOM);
  pg.text("by: latenight.lasagna", width - 20, height - 20);

  pg.textAlign(RIGHT, TOP);
  pg.fill(255, 50, 0);
  pg.textSize(36);
  if (fontEggBold) pg.textFont(fontEggBold);
  pg.text("HIGHSCORE: " + eggHighscore, width - 20, 20);

  pg.textAlign(CENTER, CENTER);

  let m = getMappedMouse();

  if (eggMenuState === "MAIN") {
    let startHover =
      m.x > width / 2 - 150 &&
      m.x < width / 2 + 150 &&
      m.y > height / 2 - 10 &&
      m.y < height / 2 + 50;
    pg.push();
    pg.translate(width / 2, height / 2 + 20);
    if (startHover && mouseIsPressed) pg.scale(0.9);
    else if (startHover) pg.scale(1.05);
    pg.fill(startHover ? color(255) : color(200));
    pg.noStroke();
    pg.textSize(64);
    if (fontEggBold) pg.textFont(fontEggBold);
    pg.text("START GAME", 0, 0);
    pg.pop();

    let diffHover =
      m.x > width / 2 - 150 &&
      m.x < width / 2 + 150 &&
      m.y > height / 2 + 60 &&
      m.y < height / 2 + 120;
    pg.push();
    pg.translate(width / 2, height / 2 + 90);
    if (diffHover && mouseIsPressed) pg.scale(0.9);
    else if (diffHover) pg.scale(1.05);
    pg.fill(diffHover ? color(255) : color(200));
    pg.noStroke();
    pg.textSize(48);
    if (fontEggBold) pg.textFont(fontEggBold);
    pg.text("DIFFICULTY", 0, 0);
    pg.pop();

    let exitHover =
      m.x > width / 2 - 100 &&
      m.x < width / 2 + 100 &&
      m.y > height / 2 + 130 &&
      m.y < height / 2 + 190;
    pg.push();
    pg.translate(width / 2, height / 2 + 160);
    if (exitHover && mouseIsPressed) pg.scale(0.9);
    else if (exitHover) pg.scale(1.05);
    pg.fill(exitHover ? color(255) : color(200));
    pg.noStroke();
    pg.textSize(42);
    if (fontEggBold) pg.textFont(fontEggBold);
    pg.text("EXIT", 0, 0);
    pg.pop();
  } else if (eggMenuState === "DIFFICULTY") {
    pg.fill(255);
    pg.textSize(24);
    pg.textFont(fontReg);
    pg.text("CURRENT: " + eggDifficulty, width / 2, height / 2 - 60);

    let regHover =
      m.x > CANVAS_W / 3 - 100 &&
      m.x < CANVAS_W / 3 + 100 &&
      m.y > CANVAS_H / 2 - 30 &&
      m.y < CANVAS_H / 2 + 70;
    pg.push();
    pg.translate(CANVAS_W / 3, CANVAS_H / 2 + 20);
    if (regHover && mouseIsPressed) pg.scale(0.9);
    else if (regHover) pg.scale(1.05);
    pg.fill(regHover || eggDifficulty === "REGULAR" ? color(255) : color(200));
    pg.noStroke();
    pg.textSize(56);
    if (fontEggBold) pg.textFont(fontEggBold);
    pg.text("REGULAR", 0, 0);
    pg.pop();

    let cwazyHover =
      m.x > (2 * CANVAS_W) / 3 - 100 &&
      m.x < (2 * CANVAS_W) / 3 + 100 &&
      m.y > CANVAS_H / 2 - 30 &&
      m.y < CANVAS_H / 2 + 70;
    pg.push();
    pg.translate((2 * CANVAS_W) / 3, CANVAS_H / 2 + 20);
    if (cwazyHover && mouseIsPressed) pg.scale(0.9);
    else if (cwazyHover) pg.scale(1.05);
    pg.fill(cwazyHover || eggDifficulty === "CWAZY" ? color(255) : color(200));
    pg.noStroke();
    pg.textSize(56);
    if (fontEggBold) pg.textFont(fontEggBold);
    pg.text("CWAZY", 0, 0);
    pg.pop();
  }

  pg.pop();
}

function drawEggGame() {
  pg.push();
  pg.background(0);
  pg.rectMode(CENTER);

  if (eggInputMode === "WEBCAM") {
    pg.push();
    pg.translate(CANVAS_W, 0);
    pg.scale(-1, 1);
    pg.imageMode(CORNER);
    if (video && video.loadedmetadata) {
      pg.image(video, 0, 0, CANVAS_W, CANVAS_H);
    }
    pg.pop();
  }

  if (frameCount % 60 === 0 && eggTimer > 0) eggTimer--;

  pg.push();
  pg.translate(CANVAS_W / 2, CANVAS_H / 2);
  pg.fill(255, 10, 40);
  pg.textSize(96);
  if (fontEggBold) pg.textFont(fontEggBold);
  pg.textAlign(CENTER, CENTER);
  if (eggTimer > 0) pg.text(eggTimer, 0, 0);
  pg.pop();

  let deathLinePosY = height - 80;
  pg.stroke(255);
  pg.strokeWeight(10);
  pg.line(0, deathLinePosY, width, deathLinePosY);

  let diffMult = eggDifficulty === "CWAZY" ? 1.5 : 1.0;

  if (eggTimer === 0) {
    let currentSpeed = min(
      (EGG_BASE_SPEED + points * EGG_SPEED_RAMP) * diffMult,
      EGG_MAX_SPEED * diffMult
    );
    let currentSpawnRate = max(
      (EGG_BASE_SPAWN_RATE - points * EGG_SPAWN_RAMP) / diffMult,
      EGG_MIN_SPAWN_RATE / diffMult
    );

    framesSinceLastSpawn++;
    if (framesSinceLastSpawn >= currentSpawnRate) {
      activeEggs.push({
        x: random(100, CANVAS_W - 100),
        y: -50,
        speed: currentSpeed * random(0.8, 1.2),
        scale: random(0.7, 1.3),
        angle: random(360),
        rotSpeed: random(-6, 6),
      });
      framesSinceLastSpawn = 0;
    }

    let hitX, hitY;
    let isTracking = false;

    if (eggInputMode === "WEBCAM" && hands.length > 0) {
      let indexFinger = hands[0].index_finger_tip;
      hitX = CANVAS_W - indexFinger.x;
      hitY = indexFinger.y;
      isTracking = true;
    } else if (eggInputMode === "MOUSE") {
      let m = getMappedMouse();
      hitX = m.x;
      hitY = m.y;
      isTracking = true;
    }

    for (let i = activeEggs.length - 1; i >= 0; i--) {
      let e = activeEggs[i];

      e.y += e.speed;
      e.angle += e.rotSpeed;

      pg.push();
      pg.angleMode(DEGREES);
      pg.translate(e.x, e.y);
      pg.rotate(e.angle);
      pg.scale(e.scale);
      pg.imageMode(CENTER);
      if (imgEi) pg.image(imgEi, 0, 0, 70, 70);
      pg.pop();

      if (e.y > deathLinePosY) {
        eggLifes--;
        activeEggs.splice(i, 1);

        if (sndEggDeath.length > 0) {
          let randomDeathSnd = random(sndEggDeath);
          if (randomDeathSnd) {
            randomDeathSnd.setVolume(EGG_DEATH_VOLUME);
            randomDeathSnd.play();
          }
        }

        continue;
      }

      if (isTracking) {
        let hitRadius = 40 * e.scale;
        if (dist(hitX, hitY, e.x, e.y) < hitRadius) {
          points++;
          activeEggs.splice(i, 1);
          if (sndPopEgg) {
            sndPopEgg.setVolume(EGG_POP_VOLUME);
            sndPopEgg.play();
          }
        }
      }
    }

    if (isTracking) {
      pg.noFill();
      pg.stroke(255, 255, 0);
      pg.strokeWeight(4);
      pg.circle(hitX, hitY, 50);
    }
  }

  pg.fill(255);
  pg.noStroke();
  pg.textSize(48);
  pg.textAlign(LEFT, TOP);
  pg.textFont(fontReg);
  pg.text("Eggs destroyed: " + points, 60, 60);
  pg.textAlign(RIGHT, TOP);
  pg.text("Lifes: " + eggLifes, width - 60, 60);

  pg.textSize(64);
  pg.fill(255, 0, 0);
  pg.textAlign(CENTER, CENTER);
  if (fontEggBold) pg.textFont(fontEggBold);

  let isDanger = false;
  for (let e of activeEggs) {
    if (deathLinePosY - e.y <= 60) isDanger = true;
  }
  if (isDanger && eggTimer === 0) pg.text("dayuum", width / 2, height / 2);

  pg.push();
  pg.translate(700, 400);
  pg.fill(255, 10, 40);
  pg.textSize(42);
  pg.textAlign(CENTER, CENTER);
  pg.text("MENU", 0, 0);
  pg.pop();

  if (eggLifes <= 0) {
    if (points > eggHighscore) eggHighscore = points;
    state = "EGG_GAMEOVER";
    
    // RESTORED: Play the game over sound!
    if (sndGameOver && !sndGameOver.isPlaying()) {
      sndGameOver.setVolume(EGG_GAME_OVER_VOLUME);
      sndGameOver.play();
    }
  }

  pg.pop();
}

function drawEggGameOver() {
  pg.push();
  pg.background(255, 10, 40);
  pg.rectMode(CENTER);
  pg.textAlign(CENTER, CENTER);

  pg.fill(250);
  pg.textSize(96);
  if (fontEggBold) pg.textFont(fontEggBold);
  pg.text("GAME OVER", width / 2, height / 2 - 140);

  pg.fill(255);
  pg.textSize(48);
  pg.text("SCORE: " + points, width / 2, height / 2 - 60);

  let m = getMappedMouse();

  let menuHover =
    m.x > width / 2 - 150 &&
    m.x < width / 2 + 150 &&
    m.y > height / 2 + 20 &&
    m.y < height / 2 + 80;
  pg.push();
  pg.translate(width / 2, height / 2 + 50);
  if (menuHover && mouseIsPressed) pg.scale(0.9);
  else if (menuHover) pg.scale(1.05);
  pg.fill(menuHover ? color(255, 50, 50) : color(200));
  pg.noStroke();
  pg.textSize(42);
  pg.text("BACK TO MENU", 0, 0);
  pg.pop();

  let exitHover =
    m.x > width / 2 - 100 &&
    m.x < width / 2 + 100 &&
    m.y > height / 2 + 110 &&
    m.y < height / 2 + 170;
  pg.push();
  pg.translate(width / 2, height / 2 + 140);
  if (exitHover && mouseIsPressed) pg.scale(0.9);
  else if (exitHover) pg.scale(1.05);
  pg.fill(exitHover ? color(255, 50, 50) : color(200));
  pg.noStroke();
  pg.textSize(42);
  pg.text("EXIT", 0, 0);
  pg.pop();

  pg.pop();
}

/////////////////////////Windows OS (UI & SYSTEM FUNCTIONS)
function drawBootSequence() {
  pg.background(0);
  let elapsed = millis() - bootStartTime;

  if (elapsed > 200 && !hasPlayedBiosBeep) {
    if (sndBiosBeep) {
      sndBiosBeep.setVolume(BIOS_VOLUME);
      sndBiosBeep.play();
    }
    hasPlayedBiosBeep = true;
  }

  let biosLength = 5500;
  if (sndBiosBeep && sndBiosBeep.isLoaded()) {
    biosLength = sndBiosBeep.duration() * 1000 + 400;
  }

  if (elapsed < biosLength) {
    pg.fill(200);
    pg.textAlign(LEFT, TOP);
    pg.textFont("monospace");
    pg.textSize(14);

    let x = 48;
    let y = 28;

    if (elapsed > 100) {
      pg.fill(50, 50, 255);
      pg.noStroke();
      pg.rect(20, 22, 14, 14);
      pg.triangle(15, 30, 20, 25, 20, 35);
      pg.triangle(15, 46, 28, 38, 28, 46);

      pg.fill(200);
      pg.text("Award Modular BIOS v4.20PG, A Random Energy Ally", 45, y);
      y += 16;
      pg.text(
        "Copyright (C) 1984-2026, Burg Giebichenstein Software, Inc.",
        45,
        y
      );
      y += 32;
      pg.text("#401A0-0204", x, y);
      y += 32;
    }

    if (elapsed > 800) {
      pg.text("PENTIUM-MMX CPU at 200MHz", x, y);
      y += 16;
    }
    if (elapsed > 1600) {
      pg.text("Memory Test :  16384K OK", x, y);
      y += 32;
    }
    if (elapsed > 2000) {
      pg.text("Award Plug and Pray BIOS Extension v1.0A", x, y);
      y += 16;
      pg.text("Copyright (C) 1995, Burg Giebichenstein Software, Inc.", x, y);
      y += 32;
    }
    if (elapsed > 2600) {
      pg.text("Initialize Plug and Pray Cards...", x, y);
      y += 16;
      pg.text("PNP Init Completed", x, y);
      y += 32;
    }
    if (elapsed > 3600) {
      pg.text("Detecting HDD Primary Master   ... PCemHD", x, y);
      y += 16;
      pg.text("Detecting HDD Primary Slave    ... CDA46802I", x, y);
      y += 16;
      pg.text("Detecting HDD Secondary Master ... [Press F4 to skip]", x, y);
      y += 32;
    }
    if (elapsed > 4500) {
      pg.text("Starting MS-DOS...", x, y);
    }

    //Burg ASCII Logo
    if (elapsed > 100) {
      pg.textAlign(LEFT, TOP);
      let asciiX = CANVAS_W - 220;
      let asciiY = 80;

      pg.fill(255, 255, 0);
      pg.text("      /\\", asciiX, asciiY);
      asciiY += 14;
      pg.text("     /  \\", asciiX, asciiY);
      asciiY += 14;
      pg.text("    |    |", asciiX, asciiY);
      asciiY += 14;
      pg.text("    | [] |", asciiX, asciiY);
      asciiY += 14;
      pg.text("    |    |", asciiX, asciiY);
      asciiY += 14;
      pg.text("    |____|", asciiX, asciiY);
      asciiY += 24;

      pg.text("  ----------", asciiX, asciiY);
      asciiY += 24;

      pg.text("   .------.", asciiX, asciiY);
      asciiY += 14;
      pg.text("  /        \\", asciiX, asciiY);
      asciiY += 24;

      pg.fill(0, 255, 0);
      pg.text("BURG GIEBICHENSTEIN", asciiX - 25, asciiY);
      pg.text(" SOFTWARE ALLIANCE", asciiX - 25, asciiY + 14);
    }

    if (elapsed > 800) {
      pg.textAlign(LEFT, BOTTOM);
      pg.fill(200);
      pg.text("I need to charge soon", 48, CANVAS_H - 40);
      pg.text("13/12/97-82437VX-l8N1GHt-LASa6Na-42", 48, CANVAS_H - 20);
    }
  } else if (elapsed < biosLength + 4000) {
    pg.textFont(fontReg);

    if (!hasPlayedStartupSound && sndStartup) {
      sndStartup.setVolume(STARTUP_VOLUME);
      sndStartup.play();
      hasPlayedStartupSound = true;
    }
    if (elapsed > biosLength + 2500 && !hasStartedMusicFade && bgMusic) {
      bgMusic.setVolume(0);
      bgMusic.loop();
      bgMusic.fade(MUSIC_VOLUME, 2);
      hasStartedMusicFade = true;
    }
    if (imgStartupScreen) {
      pg.imageMode(CENTER);
      pg.image(imgStartupScreen, width / 2, height / 2, width, height);
    }
  } else {
    pg.textFont(fontReg);
    if (state !== "DESKTOP") {
      state = "DESKTOP";
      desktopStartTime = millis();
      if (bgMusic && !bgMusic.isPlaying()) {
        bgMusic.setVolume(MUSIC_VOLUME);
        bgMusic.loop();
      }
    }
  }
}

function drawErrorScreen() {
  if (imgError) {
    pg.imageMode(CENTER);
    pg.image(imgError, width / 2, height / 2, width, height);
  } else {
    pg.background(0, 0, 170);
    pg.fill(255);
    pg.textFont(fontBold);
    pg.textSize(20);
    pg.textAlign(CENTER, CENTER);
    pg.text(
      "A fatal exception 0E has occurred.\nThe current application will be terminated.\n\nRebooting in 10 seconds...",
      width / 2,
      height / 2
    );
  }
}

//Spawns in the desktop icons with a delay
function drawStaticApps() {
  let elapsedDesktop =
    state === "DESKTOP" || state === "SIMULATION"
      ? millis() - desktopStartTime
      : 0;

  for (let i = 0; i < desktopApps.length; i++) {
    let app = desktopApps[i];
    let delay = i * 120;

    if (state === "SIMULATION" || elapsedDesktop > delay) {
      if (app.img) {
        pg.imageMode(CENTER);
        pg.image(app.img, app.pos.x, app.pos.y, ICON_SIZE, ICON_SIZE);
      }
      drawIconLabel(app.label, app.pos);
    }
  }
}

function drawGameIcon(pos) {
  if (imgGameIcon) {
    pg.imageMode(CENTER);
    pg.image(imgGameIcon, pos.x, pos.y, ICON_SIZE * 1.3, ICON_SIZE * 1.3);
  } else {
    pg.fill(255, 0, 0);
    pg.rectMode(CENTER);
    pg.rect(pos.x, pos.y, ICON_SIZE, ICON_SIZE);
  }
  drawIconLabel("EGGMANIA", pos, 1.2);
}

function drawIconLabel(txt, pos, scaleOffset = 1) {
  pg.textAlign(CENTER, TOP);
  pg.textSize(11);
  pg.textFont(fontReg);
  pg.fill(0);
  pg.text(txt, pos.x + 1, pos.y + (ICON_SIZE * scaleOffset) / 2 + 4);
  pg.fill(255);
  pg.text(txt, pos.x, pos.y + (ICON_SIZE * scaleOffset) / 2 + 3);
}

//Windowstamping 
function spawnRandomPopup() {
  let px = random(200, width - 350);
  let py = random(150, height - 300);
  let randomFrame =
    windowFrameImages[Math.floor(Math.random() * windowFrameImages.length)];
  popups.push(new WindowFrame(px, py, randomFrame));
  lastWindowActivity = millis();
}

function drawPopups() {
  while (popups.length > stampCount) popups.shift();
  let now = millis();
  if (now - lastWindowActivity > 5000 && popups.length > 0) popups.shift();
  for (let p of popups) p.show();
}

class WindowFrame {
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.w = 300;
    this.h = 220;
    this.img = img;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.lastStampX = x;
    this.lastStampY = y;
  }
  updateDrag(mx, my) {
    this.x = mx - this.dragOffsetX;
    this.y = my - this.dragOffsetY;
    lastWindowActivity = millis();
    if (dist(this.x, this.y, this.lastStampX, this.lastStampY) > 25) {
      let duplicate = new WindowFrame(
        this.lastStampX,
        this.lastStampY,
        this.img
      );
      let myIndex = popups.indexOf(this);
      if (myIndex !== -1) popups.splice(myIndex, 0, duplicate);
      this.lastStampX = this.x;
      this.lastStampY = this.y;
    }
  }
  show() {
    pg.imageMode(CORNER);
    if (this.img) pg.image(this.img, this.x, this.y, this.w, this.h);
  }
}

function drawCustomCursor() {
  let useAnimated = false;
  if (
    state === "DESKTOP" ||
    state === "SIMULATION" ||
    state === "EGG_BOOT" ||
    state === "EGG_START" ||
    state === "EGG_GAME" ||
    state === "EGG_GAMEOVER"
  ) {
    if (hasUnlockedCustomCursor) useAnimated = true;
  }

  pg.push();
  pg.imageMode(CORNER);

  if (
    useAnimated &&
    cursorImages.length > 0 &&
    cursorImages[currentCursorIndex]
  ) {
    let gif = cursorImages[currentCursorIndex];
    if (
      typeof gif.setFrame === "function" &&
      typeof gif.numFrames === "function"
    ) {
      let frames = gif.numFrames();
      if (frames > 1) {
        gif.setFrame(floor(frameCount / 4) % frames);
      }
    }
    pg.image(gif, mouseX, mouseY, 32, 32);
  } else if (imgArrow) {
    pg.image(imgArrow, mouseX, mouseY, 24, 24);
  } else {
    pg.fill(255);
    pg.stroke(0);
    pg.strokeWeight(1);
    pg.triangle(
      mouseX,
      mouseY,
      mouseX + 12,
      mouseY + 18,
      mouseX + 18,
      mouseY + 12
    );
  }
  pg.pop();
}

////////////////////particles
class Particle {
  constructor(startX, startY, targetX, targetY, iconImg) {
    this.pos = createVector(startX, startY);
    this.target = createVector(targetX, targetY);
    this.vel = createVector(random(-12, 12), random(-12, 12));
    this.acc = createVector(0, 0);
    this.icon = iconImg;
    this.maxSpeed = 10;
    this.maxForce = 0.7;
    this.interactionRadiusSq = INTERACTION_RADIUS * INTERACTION_RADIUS;
  }
  behaviors() {
    let arriveForce = this.arrive(this.target);
    this.applyForce(arriveForce);

    //Perlin noise for floating movement
    let noiseScale = 0.005;
    let nAngle =
      noise(
        this.pos.x * noiseScale,
        this.pos.y * noiseScale,
        millis() * 0.001
      ) *
      TWO_PI *
      4;
    let noiseForce = p5.Vector.fromAngle(nAngle);
    noiseForce.mult(0.6);
    this.applyForce(noiseForce);

    //Mouse repelling physics
    let dx = this.pos.x - mouseX;
    let dy = this.pos.y - mouseY;
    let distSq = dx * dx + dy * dy;
    if (distSq < this.interactionRadiusSq && distSq > 0) {
      let mouseVec = createVector(mouseX, mouseY);
      let fleeForce = this.flee(mouseVec);
      let pushStrength = map(distSq, 0, this.interactionRadiusSq, 10, 0);
      fleeForce.mult(pushStrength);
      this.applyForce(fleeForce);
    }
  }
  applyForce(f) {
    this.acc.add(f);
  }
  update() {
    this.pos.add(this.vel);
    this.vel.add(this.acc);
    this.vel.mult(0.92);
    this.acc.mult(0);
  }
  show() {
    if (this.icon) {
      pg.imageMode(CENTER);
      pg.image(this.icon, this.pos.x, this.pos.y, ICON_SIZE, ICON_SIZE);
    }
  }
  arrive(target) {
    let desired = p5.Vector.sub(target, this.pos);
    let d = desired.mag();
    if (d < 80) {
      let m = map(d, 0, 80, 0, this.maxSpeed);
      desired.setMag(m);
    } else desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }
  flee(target) {
    let desired = p5.Vector.sub(this.pos, target);
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce * 1.5);
    return steer;
  }
}
