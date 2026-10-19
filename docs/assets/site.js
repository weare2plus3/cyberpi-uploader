// Two small behaviours on top of the pre-rendered page.
(function () {
  // The design system's Header rises to level 2 once content scrolls under it.
  var header = document.querySelector("[data-header] .tt-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("tt-elev-2", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Copy buttons on code panels.
  document.querySelectorAll("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      var code = button.closest("figure").querySelector("code").textContent;
      var done = function () {
        button.textContent = "Copied";
        setTimeout(function () { button.textContent = "Copy"; }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, function () {});
    });
  });
})();
