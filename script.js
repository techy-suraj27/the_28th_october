/* OUR LITTLE UNIVERSE — interactive details */
"use strict";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// Smooth reveal as each section enters the viewport.
const revealItems = $$(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => revealObserver.observe(item));
} else {
  revealItems.forEach(item => item.classList.add("visible"));
}

// A small surprise modal.
const surpriseModal = $("#surpriseModal");
const surpriseButton = $("#surpriseButton");
function openModal() {
  surpriseModal.hidden = false;
  document.body.classList.add("modal-open");
  const closeButton = $(".modal-close", surpriseModal);
  if (closeButton) closeButton.focus();
}
function closeModal() {
  surpriseModal.hidden = true;
  document.body.classList.remove("modal-open");
  surpriseButton?.focus();
}
surpriseButton?.addEventListener("click", openModal);
$$("[data-close-modal]").forEach(button => button.addEventListener("click", closeModal));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && surpriseModal && !surpriseModal.hidden) closeModal();
});

// Clickable reasons.
const reasonMessage = $("#reasonMessage");
$$(".reason-heart").forEach(button => {
  button.addEventListener("click", () => {
    $$(".reason-heart").forEach(heart => heart.classList.remove("active"));
    button.classList.add("active");
    if (reasonMessage) reasonMessage.textContent = button.dataset.message;
  });
});

// Open and fold the personal letter.
const letterCard = $("#letterCard");
const letterFront = $(".letter-front", letterCard);
const letterInside = $("#letterInside");
$("#openLetter")?.addEventListener("click", () => {
  letterFront.hidden = true;
  letterInside.hidden = false;
  letterCard.scrollIntoView({ behavior: "smooth", block: "center" });
});
$("#closeLetter")?.addEventListener("click", () => {
  letterInside.hidden = true;
  letterFront.hidden = false;
});

// Confetti / heart burst for the birthday finale.
const confettiLayer = $("#confettiLayer");
const wishMessage = $("#wishMessage");
function celebrate() {
  const symbols = ["♥", "✦", "✧", "❤", "·"];
  const colours = ["#ed4765", "#ff8294", "#f5b9c5", "#fff0e8", "#dca5b3"];
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.color = colours[Math.floor(Math.random() * colours.length)];
    piece.style.fontSize = `${10 + Math.random() * 17}px`;
    piece.style.setProperty("--fall-duration", `${2.1 + Math.random() * 2.7}s`);
    piece.style.setProperty("--drift", `${Math.round(Math.random() * 180 - 90)}px`);
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    confettiLayer.appendChild(piece);
    window.setTimeout(() => piece.remove(), 6000);
  }
  if (wishMessage) wishMessage.textContent = "May this year bring you every little thing your heart is wishing for. Happy birthday, MJ. ❤️";
  showToast("A whole universe of love, just for you. ♥");
}
$("#celebrateButton")?.addEventListener("click", celebrate);

// A subtle, original ambient tone created in-browser. It starts only after a user click.
// This is optional; no external audio file is required.
let audioContext = null;
let soundOn = false;
let musicTimer = null;
const soundToggle = $("#soundToggle");
const melody = [261.63, 329.63, 392.00, 329.63, 293.66, 349.23, 440.00, 349.23];
let noteIndex = 0;
function playNote() {
  if (!soundOn || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = melody[noteIndex % melody.length];
  noteIndex++;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.025, audioContext.currentTime + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.8);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.85);
}
async function toggleSound() {
  try {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        showToast("Ambient sound isn't supported by this browser.");
        return;
      }
      audioContext = new AudioContextClass();
    }
    if (audioContext.state === "suspended") await audioContext.resume();
    soundOn = !soundOn;
    if (soundOn) {
      playNote();
      musicTimer = window.setInterval(playNote, 900);
    } else {
      window.clearInterval(musicTimer);
    }
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundToggle.innerHTML = soundOn ? '♫ <span>Sound on</span>' : '♫ <span>Sound off</span>';
  } catch (error) {
    showToast("Your browser couldn't start the sound. You can still enjoy the page!");
  }
}
soundToggle?.addEventListener("click", toggleSound);


// Dynamic photo gallery: arrows, swipe/drag, active-card emphasis and gentle autoplay.
const galleryViewport = $("#galleryViewport");
const galleryTrack = $("#galleryTrack");
const gallerySlides = $$(".gallery-slide", galleryTrack || document);
const galleryCurrent = $("#galleryCurrent");
const galleryProgress = $("#galleryProgress");
const galleryPrev = $("#galleryPrev");
const galleryNext = $("#galleryNext");
let galleryIndex = 0;
let galleryAutoplay = null;
let dragStartX = 0;
let dragDeltaX = 0;
let dragging = false;
let dragMoved = false;

function galleryVisibleCount() {
  if (window.matchMedia("(max-width: 560px)").matches) return 1;
  if (window.matchMedia("(max-width: 800px)").matches) return 2;
  return 3;
}
function galleryMaxIndex() {
  return Math.max(0, gallerySlides.length - galleryVisibleCount());
}
function updateGallery(nextIndex, animate = true) {
  if (!galleryTrack || !gallerySlides.length) return;
  galleryIndex = Math.max(0, Math.min(nextIndex, galleryMaxIndex()));
  galleryTrack.style.transition = animate ? "" : "none";
  const slide = gallerySlides[galleryIndex];
  const trackStyle = getComputedStyle(galleryTrack);
  const gap = parseFloat(trackStyle.columnGap || trackStyle.gap) || 0;
  const slideWidth = slide.getBoundingClientRect().width;
  galleryTrack.style.transform = `translateX(-${galleryIndex * (slideWidth + gap)}px)`;
  gallerySlides.forEach((item, index) => item.classList.toggle("is-active", index === galleryIndex));
  if (galleryCurrent) galleryCurrent.textContent = String(galleryIndex + 1).padStart(2, "0");
  if (galleryProgress) galleryProgress.style.width = `${((galleryIndex + 1) / gallerySlides.length) * 100}%`;
  if (galleryPrev) galleryPrev.disabled = galleryIndex === 0;
  if (galleryNext) galleryNext.disabled = galleryIndex === galleryMaxIndex();
}
function stopGalleryAutoplay() {
  window.clearInterval(galleryAutoplay);
  galleryAutoplay = null;
}
function startGalleryAutoplay() {
  stopGalleryAutoplay();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  galleryAutoplay = window.setInterval(() => {
    if (document.hidden || dragging || !gallerySlides.length) return;
    updateGallery(galleryIndex >= galleryMaxIndex() ? 0 : galleryIndex + 1);
  }, 4800);
}
galleryPrev?.addEventListener("click", () => { updateGallery(galleryIndex - 1); startGalleryAutoplay(); });
galleryNext?.addEventListener("click", () => { updateGallery(galleryIndex + 1); startGalleryAutoplay(); });
galleryViewport?.addEventListener("mouseenter", stopGalleryAutoplay);
galleryViewport?.addEventListener("mouseleave", startGalleryAutoplay);
galleryViewport?.addEventListener("focusin", stopGalleryAutoplay);
galleryViewport?.addEventListener("focusout", startGalleryAutoplay);
galleryViewport?.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  dragging = true;
  dragMoved = false;
  dragStartX = event.clientX;
  dragDeltaX = 0;
  galleryViewport.classList.add("is-dragging");
  stopGalleryAutoplay();
});
galleryViewport?.addEventListener("pointermove", event => {
  if (!dragging) return;
  dragDeltaX = event.clientX - dragStartX;
  if (Math.abs(dragDeltaX) > 7) dragMoved = true;
});
function finishGalleryDrag() {
  if (!dragging) return;
  dragging = false;
  galleryViewport?.classList.remove("is-dragging");
  if (Math.abs(dragDeltaX) > 45) updateGallery(galleryIndex + (dragDeltaX < 0 ? 1 : -1));
  startGalleryAutoplay();
}
galleryViewport?.addEventListener("pointerup", finishGalleryDrag);
galleryViewport?.addEventListener("pointercancel", finishGalleryDrag);
galleryViewport?.addEventListener("click", event => {
  if (dragMoved) {
    event.preventDefault();
    event.stopPropagation();
    dragMoved = false;
  }
}, true);
window.addEventListener("resize", () => updateGallery(galleryIndex, false));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopGalleryAutoplay();
  else startGalleryAutoplay();
});
if (gallerySlides.length) {
  updateGallery(0, false);
  startGalleryAutoplay();
}

// Small toast for feedback.
let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

// Birthday date is shown in the page. No countdown is shown, so the page works
// correctly before, on, and after October 28 without needing date edits.
