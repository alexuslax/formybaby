const HER_NAME = "Xhane";

const state = {
  currentScreen: "welcome",
  noAttempts: 0,
  noCanClick: false,
  noMoveLocked: false,
  typingStarted: false,
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

const letter = `Hi, ${HER_NAME}.

I’ve been wanting to tell you something for a while now.

Getting to know you has genuinely become one of my favorite parts of my day. Every conversation, every laugh, and even the small moments mean a lot to me.

So I just wanted to ask you something sincerely.`;

const noMessages = [
  "Are you sure? 🥺",
  "Think again...",
  "Nice try 😂",
  "Maybe the other button? ❤️"
];

function showScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });

  state.currentScreen = screenId;

  if (screenId === "letter" && !state.typingStarted) {
    state.typingStarted = true;
    typeLetter();
  }

  if (screenId === "success") {
    startHearts(420);
  }
}

function typeLetter() {
  let index = 0;
  letterText.textContent = "";
  continueLetterButton.classList.remove("visible");

  const typeNext = () => {
    letterText.textContent = letter.slice(0, index);
    index += 1;

    if (index <= letter.length) {
      window.setTimeout(typeNext, letter[index - 1] === "\n" ? 120 : 28);
      return;
    }

    letterText.classList.add("done");
    continueLetterButton.classList.add("visible");
  };

  typeNext();
}

function moveNoButton() {
  if (state.noMoveLocked) return;
  state.noMoveLocked = true;

  const choiceRow = noButton.closest(".choice-row");
  const margin = 10;
  const rect = noButton.getBoundingClientRect();
  const rowRect = choiceRow.getBoundingClientRect();
  const maxLeft = Math.max(margin, rowRect.width - rect.width - margin);
  const maxTop = Math.max(margin, rowRect.height - rect.height - margin);
  const directions = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 }
  ];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  const currentLeft = noButton.classList.contains("dodging") ? rect.left - rowRect.left : rowRect.width - rect.width - margin;
  const currentTop = noButton.classList.contains("dodging") ? rect.top - rowRect.top : margin;
  const stepX = randomBetween(90, 180);
  const stepY = randomBetween(70, 150);
  let left = clamp(currentLeft + direction.x * stepX, margin, maxLeft);
  let top = clamp(currentTop + direction.y * stepY, margin, maxTop);

  if (Math.abs(left - currentLeft) < 12 && Math.abs(top - currentTop) < 12) {
    left = randomBetween(margin, maxLeft);
    top = randomBetween(margin, maxTop);
  }

  noButton.classList.add("dodging");
  noButton.style.left = `${left}px`;
  noButton.style.top = `${top}px`;
  noButton.style.transform = `rotate(${randomBetween(-3, 3)}deg)`;

  state.noAttempts += 1;
  noMessage.textContent = noMessages[(state.noAttempts - 1) % noMessages.length];

  window.setTimeout(() => {
    state.noMoveLocked = false;
  }, 760);
}

function handlePointerMove(event) {
  if (state.currentScreen !== "question" || state.noCanClick) return;

  const rect = noButton.getBoundingClientRect();
  const buttonCenterX = rect.left + rect.width / 2;
  const buttonCenterY = rect.top + rect.height / 2;
  const distance = Math.hypot(event.clientX - buttonCenterX, event.clientY - buttonCenterY);

  if (distance < 95) moveNoButton();
}

function handleNoChoice() {
  moveNoButton();
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

function init() {
  document.querySelectorAll("[data-name]").forEach((node) => {
    node.textContent = HER_NAME;
  });

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => showScreen(button.dataset.next));
  });

  yesButton.addEventListener("click", handleYesChoice);
  noButton.addEventListener("click", handleNoChoice);
  noButton.addEventListener("mouseenter", moveNoButton);
  document.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  startHearts();

  window.setTimeout(() => {
    loader.classList.add("hide");
  }, 950);
}

document.addEventListener("DOMContentLoaded", init);
