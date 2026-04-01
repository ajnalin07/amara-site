const contactForm = document.querySelector("#contact-form");
const feedback = document.querySelector("#form-feedback");

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  feedback.textContent =
    "Placeholder form submitted. Replace this with your real email, WhatsApp, CRM, or Google Form integration later.";
});
