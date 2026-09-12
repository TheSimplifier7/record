/* make_banners.js · profile banners on the dark ground, 6 September 2026.
   X 1500x500 · YouTube 2560x1440 (safe area 1546x423 centred) · Reddit 1920x576.
   Nothing on them that goes stale: the mark, the name, the law, the address. */
const fs = require("fs");
const page = (w, h, safeW, safeH) => {
  const s = Math.min(safeW / 1500, safeH / 500);           // scale relative to the X banner
  const f = n => Math.round(n * s);
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;width:${w}px;height:${h}px;background:#141210;overflow:hidden}
  body{font-family:'IBM Plex Mono',ui-monospace,monospace;color:#EFE8DC;-webkit-font-smoothing:antialiased;
    background-image:radial-gradient(${Math.round(w*.6)}px ${Math.round(h*.6)}px at 78% 0%,rgba(203,164,60,.07),transparent 70%)}
  .safe{position:absolute;left:${Math.round((w-safeW)/2)}px;top:${Math.round((h-safeH)/2)}px;width:${safeW}px;height:${safeH}px;
    display:flex;flex-direction:column;justify-content:center;padding:0 ${f(96)}px;box-sizing:border-box}
  .row{display:flex;align-items:center;gap:${f(18)}px}
  svg{width:${f(54)}px;height:${f(40)}px;display:block;overflow:visible}
  .name{font-weight:600;font-size:${f(22)}px;letter-spacing:.32em;text-transform:uppercase;color:#EFE8DC}
  .law{font-family:'Newsreader',Georgia,serif;font-weight:400;font-size:${f(64)}px;line-height:1.05;letter-spacing:-.01em;color:#EFE8DC;margin-top:${f(34)}px}
  .law i{font-style:normal;color:#CBA43C}
  .sub{margin-top:${f(26)}px;font-size:${f(15)}px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:#B8AE9E}
  .sub b{color:#CBA43C;font-weight:600}
  .rule{position:absolute;left:${f(96)}px;right:${f(96)}px;bottom:${f(40)}px;border-top:1px solid #4A4238}
</style></head><body><div class="safe">
  <div class="row"><svg viewBox="0 0 40 30" fill="none"><path d="M2 3V9.5H11V16H20V22.5H29V29H38" stroke="#CBA43C" stroke-width="2.4" stroke-linejoin="miter" stroke-linecap="square"/><circle cx="33.5" cy="29" r="2.9" fill="#CBA43C"/></svg><span class="name">The Simplifier</span></div>
  <div class="law">Named before. Graded after. <i>Nothing deleted.</i></div>
  <div class="sub">Gold · Silver · Platinum · one level a week · <b>thesimplifier7.github.io/record</b></div>
  <div class="rule"></div>
</div></body></html>`;
};
/* X: the profile image covers roughly the bottom-left 300 x 220 of the banner
   on the profile page, and mobile crops a little from each side. Content sits
   in the upper band, indented past the avatar, and the address goes right. */
fs.writeFileSync("banner_x.html", pageX());
function pageX(){
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;width:1500px;height:500px;background:#141210;overflow:hidden}
  body{font-family:'IBM Plex Mono',ui-monospace,monospace;color:#EFE8DC;-webkit-font-smoothing:antialiased;
    background-image:radial-gradient(900px 300px at 80% 0%,rgba(203,164,60,.07),transparent 70%)}
  .top{position:absolute;left:340px;top:72px;display:flex;align-items:center;gap:18px}
  svg{width:54px;height:40px;display:block;overflow:visible}
  .name{font-weight:600;font-size:22px;letter-spacing:.32em;text-transform:uppercase}
  .law{position:absolute;left:340px;top:150px;white-space:nowrap;font-family:'Newsreader',Georgia,serif;font-size:58px;line-height:1.05;letter-spacing:-.01em}
  .law i{font-style:normal;color:#CBA43C}
  .sub{position:absolute;left:340px;top:238px;font-size:15px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:#B8AE9E}
  .addr{position:absolute;right:96px;bottom:44px;font-size:15px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#CBA43C}
  .rule{position:absolute;left:340px;right:96px;top:286px;border-top:1px solid #4A4238}
</style></head><body>
  <div class="top"><svg viewBox="0 0 40 30" fill="none"><path d="M2 3V9.5H11V16H20V22.5H29V29H38" stroke="#CBA43C" stroke-width="2.4" stroke-linejoin="miter" stroke-linecap="square"/><circle cx="33.5" cy="29" r="2.9" fill="#CBA43C"/></svg><span class="name">The Simplifier</span></div>
  <div class="law">Named before. Graded after. <i>Nothing deleted.</i></div>
  <div class="sub">Gold · Silver · Platinum · one level a week · graded Friday on the close</div>
  <div class="rule"></div>
  <div class="addr">thesimplifier7.github.io/record</div>
</body></html>`;
}
fs.writeFileSync("banner_youtube.html", page(2560, 1440, 1546, 423));
fs.writeFileSync("banner_reddit.html", page(1920, 576, 1700, 480));
console.log("banner html written");
