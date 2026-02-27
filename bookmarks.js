(() => {
  // If you're running this on bookmarks.html, it will extract all links.
  const anchors = Array.from(document.querySelectorAll("a[href]"));

  const lines = anchors
    .map(a => {
      const label = (a.textContent || "").trim();
      const url = a.getAttribute("href");
      if (!label || !url) return null;
      return `${label} | ${url}`;
    })
    .filter(Boolean);

  console.log(lines.join("\n"));
})();