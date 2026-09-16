
let currentLang = localStorage.getItem("lang") || "fr";
let siteData = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadData();
    renderAll();
    initNavigation();
    initLanguage();
    initMobileMenu();
    initReveal();
    initContactForm();
  } catch (error) {
    console.error("Erreur lors du chargement du portfolio :", error);
  }
});

async function loadData() {
  const response = await fetch("/api/content", { headers: { "Accept": "application/json" } });
  if (!response.ok) throw new Error(`API ${response.status}`);
  siteData = await response.json();
}

function text(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[char]));
}

function renderAll() {
  if (!siteData) return;
  const L = currentLang;

  document.documentElement.lang = L;

  // Meta
  const meta = siteData.meta?.[L];
  if (meta) {
    text("page-title", meta.title);
    document.title = meta.title;
    const desc = document.getElementById("meta-description");
    const ogTitle = document.getElementById("og-title");
    const ogDesc = document.getElementById("og-description");
    if (desc) desc.setAttribute("content", meta.description);
    if (ogTitle) ogTitle.setAttribute("content", meta.title);
    if (ogDesc) ogDesc.setAttribute("content", meta.description);
  }

  // Navigation
  const nav = siteData.nav[L];
  document.querySelectorAll("[data-nav]").forEach(link => {
    const key = link.dataset.nav;
    if (nav?.[key]) link.textContent = nav[key];
  });

  // Hero
  const hero = siteData.hero[L];
  text("hero-eyebrow", hero.eyebrow);
  text("hero-title", hero.title);
  text("hero-subtitle", hero.subtitle);
  text("hero-tagline", hero.tagline);
  text("hero-primary", hero.cta_primary);
  text("hero-cv", hero.cta_secondary);

  // About
  const about = siteData.about[L];
  text("about-heading", about.heading);
  text("about-lead", about.lead);
  text("about-description", about.description);
  text("about-value", about.value);
  text("about-location", about.location);
  text("about-languages", about.languages);
  text("about-experience", about.experience);
  text("about-degree", about.degree);

  // Expertise
  text("expertise-heading", siteData.expertise[L].heading);
  renderExpertise(siteData.expertise.items, L);

  // Projects
  text("projects-heading", siteData.projects[L].heading);
  text("projects-intro", siteData.projects[L].intro);
  renderProjects(siteData.projects.items, L);

  // Experience
  text("experience-heading", siteData.experience[L].heading);
  text("experience-intro", siteData.experience[L].intro);
  text("experience-cv-link", siteData.experience[L].more + " →");
  renderExperience(siteData.experience.items, L);

  // Toolbox
  text("toolbox-heading", siteData.toolbox[L].heading);
  text("toolbox-intro", siteData.toolbox[L].intro);
  renderToolbox(siteData.toolbox.groups, L);

  // Education
  text("education-heading", siteData.education[L].heading);
  text("education-intro", siteData.education[L].intro);
  renderEducation(siteData.education.items, L);

  // Contact
  const contact = siteData.contact[L];
  text("contact-heading", contact.heading);
  text("contact-subtitle", contact.subtitle);
  text("contact-name-label", contact.name_label);
  text("contact-email-label", contact.email_label);
  text("contact-message-label", contact.message_label);
  text("contact-submit", contact.submit_label);

  const email = document.getElementById("contact-email");
  const linkedin = document.getElementById("contact-linkedin");
  const github = document.getElementById("contact-github");
  if (email) { email.textContent = contact.email; email.href = `mailto:${contact.email}`; }
  if (linkedin) linkedin.href = contact.linkedin;
  if (github) github.href = contact.github;

  const note = document.getElementById("form-note");
  if (note) note.textContent = L === "fr"
    ? "Votre message sera transmis par courriel."
    : "Your message will be forwarded by email.";

  document.querySelectorAll(".lang-btn").forEach(btn => {
    const active = btn.dataset.lang === L;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  initReveal();
}

function renderExpertise(items, L) {
  const container = document.getElementById("expertise-grid");
  if (!container) return;
  container.innerHTML = items.map(item => `
    <article class="expertise-card reveal">
      <div class="expertise-card__num">${escapeHtml(item.icon)}</div>
      <h3>${escapeHtml(L === "fr" ? item.title_fr : item.title_en)}</h3>
      <p>${escapeHtml(L === "fr" ? item.desc_fr : item.desc_en)}</p>
      <div class="tags">${item.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    </article>
  `).join("");
}

function renderProjects(items, L) {
  const container = document.getElementById("projects-grid");
  if (!container) return;
  container.innerHTML = items.map(item => `
    <article class="project-card reveal">
      <div class="project-card__num">PROJECT ${escapeHtml(item.number)}</div>
      <h3>${escapeHtml(L === "fr" ? item.title_fr : item.title_en)}</h3>
      <div class="project-context">${escapeHtml(L === "fr" ? item.context_fr : item.context_en)}</div>
      <p>${escapeHtml(L === "fr" ? item.desc_fr : item.desc_en)}</p>
      <div class="tags">${item.tech.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    </article>
  `).join("");
}

function renderExperience(items, L) {
  const container = document.getElementById("experience-list");
  if (!container) return;
  container.innerHTML = items.map(item => `
    <article class="timeline-item reveal">
      <div class="timeline-period">${escapeHtml(item.period)}</div>
      <div>
        <h3>${escapeHtml(L === "fr" ? item.role_fr : item.role_en)}</h3>
        <div class="timeline-org">${escapeHtml(item.org)}</div>
        <p>${escapeHtml(L === "fr" ? item.desc_fr : item.desc_en)}</p>
      </div>
    </article>
  `).join("");
}

function renderToolbox(groups, L) {
  const container = document.getElementById("toolbox-grid");
  if (!container) return;
  container.innerHTML = groups.map(group => `
    <article class="toolbox-card reveal">
      <h3>${escapeHtml(L === "fr" ? group.name_fr : group.name_en)}</h3>
      <div>${group.items.map(item => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>
    </article>
  `).join("");
}

function renderEducation(items, L) {
  const container = document.getElementById("education-grid");
  if (!container) return;
  container.innerHTML = items.map(item => `
    <article class="education-card reveal">
      <div class="education-year">${escapeHtml(item.year)}</div>
      <div>
        <h3>${escapeHtml(L === "fr" ? item.title_fr : item.title_en)}</h3>
        <p>${escapeHtml(item.org)}</p>
      </div>
    </article>
  `).join("");
}

function initLanguage() {
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang;
      localStorage.setItem("lang", currentLang);
      renderAll();
    });
  });
}

function initNavigation() {
  const nav = document.getElementById("site-nav");
  if (!nav) return;
  const update = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

function initMobileMenu() {
  const btn = document.getElementById("menu-btn");
  const links = document.getElementById("nav-links");
  if (!btn || !links) return;

  btn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  links.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      links.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

function initReveal() {
  const elements = document.querySelectorAll(".reveal:not(.visible)");
  if (!("IntersectionObserver" in window)) {
    elements.forEach(el => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -35px 0px" });

  elements.forEach(el => observer.observe(el));
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const name = document.getElementById("f-name")?.value.trim() || "";
    const email = document.getElementById("f-email")?.value.trim() || "";
    const message = document.getElementById("f-message")?.value.trim() || "";
    const button = document.getElementById("contact-submit");

    if (!name || !email || !message) {
      alert(currentLang === "fr" ? "Veuillez remplir tous les champs." : "Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert(currentLang === "fr" ? "Veuillez entrer une adresse courriel valide." : "Please enter a valid email address.");
      return;
    }

    const original = siteData?.contact?.[currentLang]?.submit_label || (currentLang === "fr" ? "Envoyer le message" : "Send message");
    button.disabled = true;
    button.textContent = currentLang === "fr" ? "Envoi en cours…" : "Sending…";

    try {
      const response = await fetch("https://formsubmit.co/ajax/ai.novacrew@gmail.com", {
        method: "POST",
        headers: {"Content-Type":"application/json","Accept":"application/json"},
        body: JSON.stringify({
          name,
          email,
          message,
          _subject: "Nouveau message depuis phubertin.dev",
          _template: "table",
          _captcha: "true"
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error("FormSubmit error");

      button.textContent = currentLang === "fr" ? "Message envoyé ✓" : "Message sent ✓";
      button.style.background = "#10b981";
      form.reset();

      setTimeout(() => {
        button.textContent = original;
        button.style.background = "";
        button.disabled = false;
      }, 3500);
    } catch (error) {
      console.error(error);
      button.textContent = original;
      button.disabled = false;
      alert(currentLang === "fr"
        ? "Impossible d’envoyer le message pour le moment. Vous pouvez écrire directement à ai.novacrew@gmail.com."
        : "The message could not be sent right now. You can email ai.novacrew@gmail.com directly.");
    }
  });
}
