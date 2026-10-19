/*
 * Builds docs/index.html (the GitHub Pages site) by pre-rendering the page with the
 * TWO+THREE design system's own React components (docs/assets/ds/bundle.js).
 * The result is static HTML: visitors download no React.
 *
 *   npm run site
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const root = path.join(__dirname, "..");
const pkg = require(path.join(root, "package.json"));

// Load the design system bundle the way a browser would: it reads window.React.
const sandbox = { window: { React } };
vm.runInNewContext(fs.readFileSync(path.join(root, "docs/assets/ds/bundle.js"), "utf8"), sandbox);
const { Header, Button, Card, Tag, Icon, Logo } = sandbox.window.TwoPlusThree;
const h = React.createElement;

const MARKETPLACE = "https://marketplace.visualstudio.com/items?itemName=weare2plus3.cyberpi-uploader";
const REPO = "https://github.com/weare2plus3/cyberpi-uploader";
const STUDIO = "https://2plus3.studio";

const example = `import event, cyberpi


@event.start
def on_start():
    cyberpi.display.show_label("Hello", 24, "center")
    cyberpi.led.on(0, 255, 0)
    print("ready")`;

const output = `── Uploading hello.py to /dev/cu.usbserial-110 ──
Board is in upload mode.
Sent 324 bytes in 5 blocks.
✔ Uploaded 324 bytes in 4.1s.
ready`;

const Section = ({ id, title, intro, children }) =>
  h("section", { id, className: "s-section", "aria-labelledby": id && `${id}-title` },
    h("div", { className: "s-section-head" },
      h("h2", { id: id && `${id}-title`, className: "display" }, title),
      intro ? h("p", { className: "body-lg s-muted s-intro" }, intro) : null),
    children);

const CodeBlock = ({ label, children, copy }) =>
  h("figure", { className: "s-code" },
    h("figcaption", { className: "s-code-bar" },
      h("span", { className: "label s-muted" }, label),
      copy ? h("button", { type: "button", className: "tt-btn tt-btn-quiet tt-btn-sm s-copy", "data-copy": "" }, "Copy") : null),
    h("pre", { className: "code" }, h("code", null, children)));

const steps = [
  ["Plug in", "Connect the CyberPi with a USB data cable and switch it on. Quit mBlock if it's open: it holds the port."],
  ["Press ⌘⌥U", "Open a .py file and press ⌘⌥U, or click the upload icon. Pick the port the first time; we remember it."],
  ["Watch it run", "The CyberPi restarts with your program. Anything it prints appears in the CyberPi panel in VS Code."],
];

const features = [
  ["code", "Upload from where you write", "The editor title bar, the status bar, the Explorer's right-click menu or the Command Palette. Whichever is closest."],
  ["download", "Nothing else to install", "The serial driver is built in for Apple silicon and Intel Macs. No Python, mLink or mBlock needed."],
  ["info", "See what it prints", "A serial monitor shows your program's print() output as the robot runs it."],
  ["check", "Safe uploads", "Programs land in a staging slot first, so a failed upload leaves your last program in place."],
];

const faqs = [
  ["It can't find the CyberPi.", h(React.Fragment, null, "Run ", h("code", { className: "code" }, "ls /dev/cu.*"), " in Terminal with the CyberPi switched on. If nothing like ", h("code", { className: "code" }, "cu.usbserial-…"), " appears, try another cable. Many USB-C cables only charge.")],
  ["It says the port is busy.", "Quit mBlock 5 and mLink, or stop the serial monitor with “CyberPi: Start / Stop Serial Monitor”."],
  ["The old program still runs.", "Switch the CyberPi off and on. The new program starts from the staging slot on the next boot."],
  ["Does it work on Windows or Linux?", "Not yet. It's built and tested for macOS."],
];

const page = h("div", { className: "s-page" },
  h("a", { href: "#main", className: "s-skip label" }, "Skip to content"),
  h("div", { className: "s-header", "data-header": "" },
    h(Header, {
      logoHref: STUDIO,
      nav: [
        { label: "How it works", href: "#how" },
        { label: "Help", href: "#help" },
        { label: "GitHub", href: REPO },
      ],
      action: h(Button, { variant: "secondary", size: "sm", href: MARKETPLACE }, "Install"),
    })),

  h("main", { id: "main" },
    // Hero
    h("section", { className: "s-hero" },
      h("div", { className: "s-hero-copy" },
        h("div", { className: "s-eyebrow-row" },
          h("img", { src: "assets/icon.png", alt: "", width: 48, height: 48, className: "s-app-icon" }),
          h("span", { className: "label s-muted" }, "VS Code extension for Mac")),
        h("h1", { className: "display-xl s-title" }, "CyberPi uploader"),
        h("p", { className: "body-lg s-lead" },
          "Write Python for your Makeblock CyberPi and mBot2 in VS Code, then send it to the robot with one keystroke. No mBlock, no mLink, nothing else to install."),
        h("div", { className: "s-actions" },
          h(Button, { href: MARKETPLACE, iconAfter: "external" }, "Install the extension"),
          h(Button, { variant: "secondary", href: REPO, icon: "code" }, "See the code")),
        h("div", { className: "s-tags" },
          h(Tag, null, "Free"), h(Tag, null, "Open source"), h(Tag, null, `v${pkg.version}`))),
      h("div", { className: "s-hero-demo" },
        h(CodeBlock, { label: "hello.py" }, example),
        h(CodeBlock, { label: "Output · CyberPi" }, output))),

    // Steps
    h(Section, { id: "start", title: "three steps to the robot." },
      h("ol", { className: "s-cards" },
        steps.map(([title, text], i) =>
          h("li", { key: title }, h(Card, { eyebrow: h("span", { className: "numeral" }, String(i + 1).padStart(2, "0")), title }, text))))),

    // Features
    h(Section, { id: "features", title: "made to stay out of the way." },
      h("ul", { className: "s-features" },
        features.map(([icon, title, text]) =>
          h("li", { key: title, className: "s-feature" },
            h(Icon, { name: icon, size: 24 }),
            h("div", null,
              h("h3", { className: "heading s-feature-title" }, title),
              h("p", { className: "body s-muted" }, text)))))),

    // First program
    h(Section, { id: "program", title: "your first program.",
      intro: "Start every program from an @event handler, the way mBlock does. The extension warns you before uploading a file without one." },
      h("div", { className: "s-split" },
        h(CodeBlock, { label: "main.py", copy: true }, example),
        h("div", { className: "s-split-copy" },
          h("p", { className: "body" }, "Press ", h("kbd", { className: "code" }, "⌘⌥U"), ". The screen says Hello, the LEDs turn green and ", h("code", { className: "code" }, "ready"), " appears in the output panel."),
          h("p", { className: "body s-muted" }, "Want autocomplete for ", h("code", { className: "code" }, "cyberpi"), ", ", h("code", { className: "code" }, "mbot2"), " and ", h("code", { className: "code" }, "mbuild"), "? Add type stubs to your project and VS Code's Python extension does the rest."),
          h(Button, { variant: "quiet", href: `${REPO}#use`, iconAfter: "arrow-right" }, "Read the guide")))),

    // How it works
    h(Section, { id: "how", title: "how it works.",
      intro: "The extension speaks the same USB serial protocol as mBlock 5, straight from VS Code." },
      h("ol", { className: "s-protocol" },
        [
          ["Upload mode", "It switches the CyberPi into upload mode and prepares it, as mBlock does."],
          ["Send", "Your file goes to a staging slot in 80-byte blocks. Each block is checked and acknowledged before the next."],
          ["Restart", "The board restarts and swaps in the new program. If anything fails on the way, the old one stays."],
        ].map(([title, text], i) =>
          h("li", { key: title, className: "s-protocol-step" },
            h("span", { className: "numeral s-muted" }, String(i + 1).padStart(2, "0")),
            h("h3", { className: "heading s-feature-title" }, title),
            h("p", { className: "body s-muted" }, text)))),
      h("p", { className: "body s-muted s-note" },
        "Frame formats, checksums and tests are in the ",
        h("a", { href: `${REPO}#how-it-works` }, "protocol notes"),
        ". Thanks to ", h("a", { href: "https://github.com/dachrisch/mbot2-course-setup" }, "dachrisch/mbot2-course-setup"),
        " for first decoding mBlock's upload sequence.")),

    // Help
    h(Section, { id: "help", title: "if something's not right." },
      h("dl", { className: "s-faq" },
        faqs.map(([q, a]) => h(React.Fragment, { key: q },
          h("dt", { className: "heading s-feature-title" }, q),
          h("dd", { className: "body s-muted" }, a)))),
      h("p", { className: "body s-note" },
        "Still stuck? ", h("a", { href: `${REPO}/issues` }, "Open an issue"), " and include what the CyberPi panel shows."))),

  h("footer", { className: "s-footer" },
    h("div", { className: "s-footer-brand" },
      h("a", { href: STUDIO, className: "s-footer-logo", "aria-label": "TWO+THREE home" }, h(Logo, { height: 40, label: "" })),
      h("p", { className: "body s-muted" }, "software. culture. gifts. books. design.")),
    h("nav", { className: "s-footer-nav", "aria-label": "Footer" },
      [["Marketplace", MARKETPLACE], ["GitHub", REPO], ["Releases", `${REPO}/releases`], ["Report an issue", `${REPO}/issues`], ["2plus3.studio", STUDIO]]
        .map(([label, href]) => h("a", { key: label, href, className: "label" }, label))),
    h("p", { className: "s-legal s-muted" },
      "MIT licence. © 2026 TWO PLUS THREE LIMITED. Not affiliated with or endorsed by Makeblock. CyberPi, mBot2 and mBlock are trademarks of Makeblock Co., Ltd.")));

const title = "CyberPi Uploader · TWO+THREE";
const description = "Upload Python to a Makeblock CyberPi or mBot2 from VS Code on your Mac, over USB, without mBlock. Free and open source.";
const url = "https://weare2plus3.github.io/cyberpi-uploader/";

const html = `<!doctype html>
<!-- Generated by site/build.js from the TWO+THREE design system. Edit site/build.js and run "npm run site". -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="CyberPi Uploader">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${url}assets/icon.png">
<meta property="og:site_name" content="TWO+THREE">
<meta name="twitter:card" content="summary">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f5f2ea">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111110">
<link rel="icon" type="image/png" href="assets/icon.png">
<link rel="apple-touch-icon" href="assets/icon.png">
<link rel="stylesheet" href="assets/ds/tokens.css">
<link rel="stylesheet" href="assets/ds/bundle.css">
<link rel="stylesheet" href="assets/site.css">
<script defer src="assets/site.js"></script>
</head>
<body>
${renderToStaticMarkup(page)}
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/index.html"), html);
fs.writeFileSync(path.join(root, "docs/.nojekyll"), "");
console.log(`docs/index.html written (${html.length} bytes)`);
