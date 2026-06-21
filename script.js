const header = document.querySelector("[data-header]");

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

const createInquiryEmail = (formData) => {
  const subject = "TriPOS POS inquiry";
  const body = [
    `Name: ${formData.get("name") || ""}`,
    `Email: ${formData.get("email") || ""}`,
    `Restaurant: ${formData.get("restaurant") || ""}`,
    "",
    "Message:",
    formData.get("message") || "",
  ].join("\n");

  return { subject, body };
};

const openMailFallback = (formData) => {
  const { subject, body } = createInquiryEmail(formData);
  window.location.href = `mailto:triposcanada@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

document.querySelector("[data-contact-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector("button[type='submit']");

  status.textContent = "Sending...";
  status.dataset.state = "loading";
  submitButton.disabled = true;

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Message could not be sent.");
    }

    form.reset();
    status.textContent = "Thanks. Your inquiry has been sent.";
    status.dataset.state = "success";
  } catch (error) {
    status.textContent = "Opening your email app instead.";
    status.dataset.state = "error";
    openMailFallback(formData);
  } finally {
    submitButton.disabled = false;
  }
});
