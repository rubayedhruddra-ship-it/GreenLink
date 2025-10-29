let slideIndex = 0;
showSlides();

function showSlides() {
  const slides = document.querySelectorAll(".slide");
  slides.forEach(slide => (slide.style.display = "none"));
  slideIndex++;
  if (slideIndex > slides.length) { slideIndex = 1 }
  slides[slideIndex - 1].style.display = "block";
  setTimeout(showSlides, 4000); // 4s interval
}

/* Manual controls */
const prev = document.querySelector(".prev");
const next = document.querySelector(".next");

prev.addEventListener("click", () => changeSlide(-1));
next.addEventListener("click", () => changeSlide(1));

function changeSlide(n) {
  const slides = document.querySelectorAll(".slide");
  slides.forEach(slide => (slide.style.display = "none"));
  slideIndex += n;
  if (slideIndex > slides.length) { slideIndex = 1 }
  if (slideIndex < 1) { slideIndex = slides.length }
  slides[slideIndex - 1].style.display = "block";
}