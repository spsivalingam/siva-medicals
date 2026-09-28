// Renders public/og-image.png (1200x630) from site data using Playwright's Chromium.
import { chromium } from "@playwright/test";

const html = `<!doctype html><html><body style="margin:0;width:1200px;height:630px;display:flex;align-items:center;
  background:linear-gradient(135deg,#0f766e,#115e59);font-family:system-ui,sans-serif;color:#fff">
  <div style="padding:80px">
    <div style="font-size:96px;line-height:1">✚</div>
    <div style="font-size:72px;font-weight:800;margin-top:24px">Sri Arogya Pharmacy</div>
    <div style="font-size:40px;opacity:.9;margin-top:12px">ஸ்ரீ ஆரோக்யா மருந்தகம்</div>
    <div style="font-size:32px;opacity:.85;margin-top:32px">RS Puram, Coimbatore · Call / WhatsApp</div>
  </div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: "public/og-image.png" });
await browser.close();
console.log("wrote public/og-image.png");
