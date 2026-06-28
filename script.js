const HER_NAME = "Xhane";


const state = {
  currentScreen: "welcome",
  noAttempts: 0,
  noCanClick: false,
  noMoveLocked: false,
  letterShown: false,
  heartTimer: null
};

const screens = [...document.querySelectorAll(".screen")];
const loader = document.querySelector("#loading-screen");
const nextButtons = document.querySelectorAll("[data-next]");
const letterText = document.querySelector("#letter-text");
const continueLetterButton = document.querySelector("#letter .primary-btn");
const yesButton = document.querySelector("#yes-btn");
const noButton = document.querySelector("#no-btn");
const noMessage = document.querySelector("#no-message");
const heartLayer = document.querySelector(".ambient-hearts");
const confettiCanvas = document.querySelector("#confetti-canvas");
const confettiContext = confettiCanvas.getContext("2d");
const bgMusic = document.querySelector("#bg-music");

const letter = `Hindi ikaw ang una,
pero ikaw ang nauna.

Nauna mong iparamdam
na ang pagmamahal ay hindi dapat mabigat,
dahil sa tunay na pag-ibig,
dalawa ang sabay na nagbubuhat.

Nauna mong pakinggan
ang mapait kong nakaraan,
at hindi mo ako minadaling
kalimutan ang sakit na dala ko.

Nauna mong yakapin
ang mga parte ko
na kahit ako mismo
ay hirap tanggapin.

Nauna mong buksan
ang puso kong sarado,
at tinuruan mo itong
huwag matakot magmahal muli.

At marahil,
iyon ang dahilan
kung bakit,
kahit hindi ikaw ang una,

ikaw ang naunang
nagpakilala sa akin
ng tunay na kahulugan
ng pagmamahal.

At mula noon,
ikaw na ang naging
pamantayan
ng bawat pag-ibig
na nanaisin ko.`;
const secondColumnStart = "Nauna mong buksan";

const noMessages = [
  "Are you sure? 🥺",
  "AYAW MO HA?????",
  "BABY NAMAAAAAAN!!!!",
  "SIGE TALAGA",
  "BAHALA KA DYAN CHEEE",
  "PAG AKO UMIYAK",
  "TAMA NA KASI",
  "YUNG LUHA KO TEH",
  "HINDI MO NA AKO MAIIWASAN",
  "BABY SUNTUKAN NALANG OH",
  "SUMUSOBRA KANA TALAGA"
];

function showScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });

  state.currentScreen = screenId;

  if (screenId === "letter" && !state.letterShown) {
    state.letterShown = true;
    showLetter();
  }

  if (screenId === "success") {
    startHearts(420);
  }
}

function showLetter() {
  const splitIndex = letter.indexOf(secondColumnStart);
  const columns = splitIndex === -1
    ? [letter]
    : [letter.slice(0, splitIndex).trim(), letter.slice(splitIndex).trim()];

  letterText.replaceChildren(...columns.map((column) => {
    const letterColumn = document.createElement("div");
    letterColumn.className = "letter-column";
    letterColumn.textContent = column;
    return letterColumn;
  }));

  continueLetterButton.classList.add("visible");
}

function moveNoButton(pointerX, pointerY) {
  if (state.noMoveLocked) return;
  state.noMoveLocked = true;

  const choiceRow = noButton.closest(".choice-row");
  const margin = 10;
  const rect = noButton.getBoundingClientRect();
  const rowRect = choiceRow.getBoundingClientRect();
  const maxLeft = Math.max(margin, rowRect.width - rect.width - margin);
  const maxTop = Math.max(margin, rowRect.height - rect.height - margin);
  const currentLeft = noButton.classList.contains("dodging") ? rect.left - rowRect.left : rowRect.width - rect.width - margin;
  const currentTop = noButton.classList.contains("dodging") ? rect.top - rowRect.top : margin;

  const buttonCenterX = rect.left + rect.width / 2;
  const buttonCenterY = rect.top + rect.height / 2;

  let directionX = buttonCenterX - (pointerX ?? buttonCenterX);
  let directionY = buttonCenterY - (pointerY ?? buttonCenterY);
  const directionLength = Math.hypot(directionX, directionY);

  if (directionLength < 1) {
    // Pointer is essentially on top of the button; pick a gentle random escape.
    const angle = randomBetween(0, Math.PI * 2);
    directionX = Math.cos(angle);
    directionY = Math.sin(angle);
  } else {
    directionX /= directionLength;
    directionY /= directionLength;
  }

  const distance = randomBetween(120, 200);
  let left = clamp(currentLeft + directionX * distance, margin, maxLeft);
  let top = clamp(currentTop + directionY * distance, margin, maxTop);

  // If clamping collapsed the move (e.g. cornered), pick a free spot instead of staying put.
  if (Math.abs(left - currentLeft) < 12 && Math.abs(top - currentTop) < 12) {
    left = randomBetween(margin, maxLeft);
    top = randomBetween(margin, maxTop);
  }

  noButton.classList.add("dodging");
  noButton.style.left = `${left}px`;
  noButton.style.top = `${top}px`;
  noButton.style.transform = `rotate(${randomBetween(-2, 2)}deg)`;

  state.noAttempts += 1;
  noMessage.textContent = noMessages[(state.noAttempts - 1) % noMessages.length];

  window.setTimeout(() => {
    state.noMoveLocked = false;
  }, 480);
}

function handlePointerMove(event) {
  if (state.currentScreen !== "question" || state.noCanClick) return;

  const rect = noButton.getBoundingClientRect();
  const buttonCenterX = rect.left + rect.width / 2;
  const buttonCenterY = rect.top + rect.height / 2;
  const distance = Math.hypot(event.clientX - buttonCenterX, event.clientY - buttonCenterY);

  if (distance < 110) moveNoButton(event.clientX, event.clientY);
}

function handleNoChoice(event) {
  const rect = noButton.getBoundingClientRect();
  const fallbackX = rect.left + rect.width / 2;
  const fallbackY = rect.top + rect.height / 2;
  moveNoButton(event?.clientX ?? fallbackX, event?.clientY ?? fallbackY);
}

function keepNoButtonInView() {
  if (!noButton.classList.contains("dodging")) return;

  const choiceRow = noButton.closest(".choice-row");
  const margin = 10;
  const rect = noButton.getBoundingClientRect();
  const rowRect = choiceRow.getBoundingClientRect();
  const currentLeft = rect.left - rowRect.left;
  const currentTop = rect.top - rowRect.top;
  const left = clamp(currentLeft, margin, rowRect.width - rect.width - margin);
  const top = clamp(currentTop, margin, rowRect.height - rect.height - margin);

  noButton.style.left = `${left}px`;
  noButton.style.top = `${top}px`;
}

function handleYesChoice() {
  runConfetti();
  startHearts(180);

  window.setTimeout(() => {
    showScreen("success");
  }, 680);
}

function startHearts(interval = 900) {
  if (state.heartTimer) window.clearInterval(state.heartTimer);

  createHeart();
  state.heartTimer = window.setInterval(createHeart, interval);
}

function createHeart() {
  const heart = document.createElement("span");
  heart.className = "floating-heart";
  heart.textContent = Math.random() > 0.45 ? "♥" : "♡";
  heart.style.left = `${randomBetween(2, 96)}vw`;
  heart.style.setProperty("--size", `${randomBetween(14, 28)}px`);
  heart.style.setProperty("--duration", `${randomBetween(7, 13)}s`);
  heart.style.setProperty("--drift", `${randomBetween(-44, 44)}px`);

  heartLayer.appendChild(heart);
  heart.addEventListener("animationend", () => heart.remove());
}

function runConfetti() {
  resizeCanvas();
  const pieces = Array.from({ length: 150 }, () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.48,
    radius: randomBetween(3, 7),
    color: ["#dd5d8a", "#ffd8c7", "#ffe4ed", "#ffffff", "#b63f70"][Math.floor(Math.random() * 5)],
    velocityX: randomBetween(-7, 7),
    velocityY: randomBetween(-12, -5),
    rotation: randomBetween(0, 360),
    rotationSpeed: randomBetween(-8, 8),
    life: 120
  }));

  function animate() {
    confettiContext.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    pieces.forEach((piece) => {
      piece.x += piece.velocityX;
      piece.y += piece.velocityY;
      piece.velocityY += 0.22;
      piece.rotation += piece.rotationSpeed;
      piece.life -= 1;

      confettiContext.save();
      confettiContext.translate(piece.x, piece.y);
      confettiContext.rotate(piece.rotation * Math.PI / 180);
      confettiContext.fillStyle = piece.color;
      confettiContext.globalAlpha = Math.max(piece.life / 120, 0);
      confettiContext.fillRect(-piece.radius, -piece.radius / 2, piece.radius * 2, piece.radius);
      confettiContext.restore();
    });

    if (pieces.some((piece) => piece.life > 0)) {
      requestAnimationFrame(animate);
      return;
    }

    confettiContext.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  animate();
}

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  confettiCanvas.width = Math.floor(window.innerWidth * pixelRatio);
  confettiCanvas.height = Math.floor(window.innerHeight * pixelRatio);
  confettiContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  keepNoButtonInView();
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function startMusic() {
  if (!bgMusic) return;
  bgMusic.volume = 0.55;

  // Browsers allow autoplay if the audio starts muted.
  bgMusic.muted = true;
  bgMusic.play().catch((error) => {
    console.warn("Music could not autoplay yet:", error);
  });

  // Regardless of whether muted autoplay succeeds or gets blocked,
  // always arm the fallback so the very first tap/scroll/keypress
  // guarantees sound starts.
  armUnmuteOnFirstInteraction();
}

function unmuteMusic() {
  if (!bgMusic) return;
  bgMusic.muted = false;

  if (bgMusic.paused) {
    bgMusic.play().catch((error) => {
      console.warn("Music still could not play:", error);
    });
  }
}

function armUnmuteOnFirstInteraction() {
  const events = ["pointerdown", "keydown", "touchstart", "wheel", "mousemove"];

  function handleFirstInteraction() {
    unmuteMusic();
    events.forEach((eventName) => {
      document.removeEventListener(eventName, handleFirstInteraction);
    });
  }

  events.forEach((eventName) => {
    document.addEventListener(eventName, handleFirstInteraction, { once: true, passive: true });
  });
}

function init() {
  document.querySelectorAll("[data-name]").forEach((node) => {
    node.textContent = HER_NAME;
  });

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showScreen(button.dataset.next);
    });
  });

  yesButton.addEventListener("click", handleYesChoice);
  noButton.addEventListener("click", handleNoChoice);
  noButton.addEventListener("mouseenter", (event) => moveNoButton(event.clientX, event.clientY));
  document.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  startHearts();
  startMusic();

  window.setTimeout(() => {
    loader.classList.add("hide");
  }, 2500);
}

document.addEventListener("DOMContentLoaded", init);