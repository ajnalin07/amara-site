const contactForm = document.querySelector("#contact-form");
const feedback = document.querySelector("#form-feedback");

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = formData.get("name") || "";
  const email = formData.get("email") || "";
  const interest = formData.get("interest") || "";
  const message = formData.get("message") || "";
  const subject = encodeURIComponent(`Amara inquiry: ${interest}`);
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nInquiry type: ${interest}\n\nMessage:\n${message}`
  );

  window.location.href = `mailto:${AmaraStore.contact.email}?subject=${subject}&body=${body}`;
  feedback.textContent =
    "Your mail app should open now. If it doesn’t, email Amara directly at garimabang18@gmail.com or message Amara on WhatsApp at +91 87690 81934.";
});
