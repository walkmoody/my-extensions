const DEFAULT_LINKS = [
  {label:"TTU", url: "https://texastech.instructure.com/", icon: "https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico"},
  {label:"ChatGPT", url: "https://chat.openai.com/chat", icon:"./assets/image.png"},
  {label:"Claude", url: "https://claude.ai/new", icon:"./assets/claude-color.webp"},
  {label:"Github", url: "https://github.com/", icon:"https://github.githubassets.com/assets/pinned-octocat-093da3e6fa40.svg"},
  {label:"Outlook", url: "https://outlook.office.com/mail/?login_hint=wamoody%40ttu.edu", icon:"https://res.public.onecdn.static.microsoft/owamail/20260213001.06/resources/images/favicons/mail-seen.ico"},
  {label:"Gmail", url: "https://mail.google.com/mail/u/0/#inbox", icon:"https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico"},
  {label:"Youtube", url: "https://youtube.com/", icon:"https://www.youtube.com/s/desktop/00d5ae36/img/favicon_144x144.png"},
  {label:"Docs", url: "https://docs.google.com/document/u/0/", icon:"https://www.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png"},
  {label:"Slides", url: "https://docs.google.com/presentation/u/0/", icon:"https://www.gstatic.com/images/branding/product/1x/slides_2020q4_48dp.png"},
];

const GREETINGS = [
  "Walker",
  "Hello",
  "I am watching you.",
  "I am watching you...",
];

function getRandomGreeting() {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

function parseBookmarksHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const anchors = Array.from(doc.querySelectorAll("a[href]"));

  return anchors
    .map(a => {
      const url = a.getAttribute("href")?.trim();
      const label = (a.textContent || "").trim();
      const icon = a.getAttribute("icon") || a.getAttribute("ICON") || "";
      if (!url || !label) return null;
      return { label, url, icon };
    })
    .filter(Boolean);
}


function parseRawLinks(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|").map((x) => (x || "").trim());
      if (!label || !url) return null;
      return { label, url };
    })
    .filter(Boolean);
}

function toRawLinks(links) {
  return links.map((x) => `${x.label} | ${x.url}`).join("\n");
}

async function loadState() {
  const stored = await chrome.storage.local.get(["links"]);
  return {
    links: DEFAULT_LINKS
  };
}

async function saveState(partial) {
  await chrome.storage.local.set(partial);
}

function renderLinks(links) {
  const el = document.getElementById("links");
  if (!el) return;

  el.innerHTML = "";
  for (const item of links) {
    const a = document.createElement("a");
    a.className = "link";
    a.href = item.url;
    a.target = "_self";
    a.rel = "noreferrer";

    const iconHtml = item.icon
      ? `<img class="favicon" src="${item.icon}" alt="" />`
      : "";

    a.innerHTML = `
      <div class="center">
        ${iconHtml}
      </div>
    `;

    el.appendChild(a);
  }
}

function prettyHost(url) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function doSearch() {
  const input = document.getElementById("q");
  const q = (input?.value || "").trim();
  if (!q) return;

  const url = `https://search.brave.com/search?q=${encodeURIComponent(q)}`;
  window.location.assign(url);
}

function bingSearch() {
  const input = document.getElementById("bingQ");  // changed from "q"
  const q = (input?.value || "").trim();
  if (!q) return;

  const url = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
  window.location.assign(url);
}

function openModal() {
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function startClock() {
  const clockEl = document.getElementById("clock");
  if (!clockEl) return;

  function update() {
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).replace(/\s*(AM|PM)/i, "");

    clockEl.textContent = time;
  }

  update();                 // run immediately
  setInterval(update, 1000); // update every second
}

function enableDynamicBackground() {
  const root = document.documentElement;
  const lerp = 0.05;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  function tick() {
    currentX += (targetX - currentX) * lerp;
    currentY += (targetY - currentY) * lerp;

    root.style.setProperty("--tx", currentX.toFixed(2) + "px");
    root.style.setProperty("--ty", currentY.toFixed(2) + "px");

    requestAnimationFrame(tick);
  }

  window.addEventListener("mousemove", (e) => {
    const nx = e.clientX / window.innerWidth - 0.5;   // -0.5..0.5
    const ny = e.clientY / window.innerHeight - 0.5;  // -0.5..0.5

    // max travel ~3% of viewport — safely within the 5% buffer from scale(1.1)
    targetX = nx * window.innerWidth * 0.04;
    targetY = ny * window.innerHeight * 0.03;
  }, { passive: true });

  requestAnimationFrame(tick);
}



(async function init() {
  const state = await loadState();
  renderLinks(state.links);
  startClock();
  enableDynamicBackground();
  const greetingEl = document.getElementById("greeting");
  if (greetingEl) {
    greetingEl.textContent = getRandomGreeting();
  }
  // --- Search wiring (form submit covers Enter + button) ---
  const form = document.getElementById("searchForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      doSearch();
    });
  } else {
    // fallback if you remove the form later
    document.getElementById("go")?.addEventListener("click", doSearch);
    document.getElementById("q")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSearch();
    });
  }
  const bingForm = document.getElementById("bingForm");
  if (bingForm) {
    bingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      bingSearch();
    });
  } else {
    document.getElementById("bingGo")?.addEventListener("click", bingSearch);
    document.getElementById("bingQ")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") bingSearch();
    });
  }

  // --- Modal wiring (optional) ---
  const linksRawEl = document.getElementById("linksRaw");
  if (linksRawEl) linksRawEl.value = toRawLinks(state.links);

  document.getElementById("edit")?.addEventListener("click", openModal);
  document.getElementById("close")?.addEventListener("click", closeModal);

  document.getElementById("save")?.addEventListener("click", async () => {
    const raw = document.getElementById("linksRaw")?.value ?? "";
    const parsed = parseRawLinks(raw);
    if (!parsed.length) return;
    await saveState({ links: parsed });
    renderLinks(parsed);
    closeModal();
  });
})();

