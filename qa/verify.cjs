const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const playwrightPath = process.env.PLAYWRIGHT_PATH || path.join(os.homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const { chromium } = require(playwrightPath);

const projectDir = path.resolve(__dirname, "..");
const outputDir = path.join(projectDir, "qa", "artifacts");
const url = process.env.QA_URL || "http://127.0.0.1:4173/";
const widths = [320, 360, 375, 390, 393, 412, 430, 768, 920, 921, 960, 1024, 1440];

fs.mkdirSync(outputDir, { recursive: true });

const report = {
  url,
  testedAt: new Date().toISOString(),
  widths: [],
  interaction: {},
  reducedMotion: {},
  failures: [],
};

async function main() {
const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

for (const width of widths) {
  const height = width >= 1000 ? 1000 : 900;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1400);

  const revealElements = page.locator(".reveal");
  for (let index = 0; index < (await revealElements.count()); index += 1) {
    const reveal = revealElements.nth(index);
    const participatesInLayout = await reveal.evaluate((element) => getComputedStyle(element).display !== "none");
    if (!participatesInLayout) continue;
    await reveal.scrollIntoViewIfNeeded();
    await page.waitForTimeout(55);
  }
  await page.locator("#top").scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const allImages = [...document.images];
    const brokenImages = allImages
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src);
    const internalTargets = [...document.querySelectorAll('a[href^="#"]')]
      .map((anchor) => anchor.getAttribute("href"))
      .filter((href) => href && href.length > 1 && !document.querySelector(href));
    const clippedText = [...document.querySelectorAll("h1,h2,h3,p,a,button,dt,dd")]
      .filter((element) => element.scrollWidth > element.clientWidth + 2 && getComputedStyle(element).overflowX !== "visible")
      .map((element) => ({ tag: element.tagName, text: element.textContent.trim().slice(0, 40) }));
    const protectedPhraseFailures = [...document.querySelectorAll(".phrase,.phrase-line,.keep,.company-name")]
      .map((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const lineTops = [...range.getClientRects()]
          .filter((rect) => rect.width > 0 && rect.height > 0)
          .map((rect) => Math.round(rect.top));
        const uniqueLines = [...new Set(lineTops)];
        const rect = element.getBoundingClientRect();
        const outsideViewport = rect.left < -1 || rect.right > doc.clientWidth + 1;
        const internalOverflow = element.scrollWidth > element.clientWidth + 1;
        return {
          text: element.textContent.trim(),
          lines: uniqueLines.length,
          outsideViewport,
          internalOverflow,
        };
      })
      .filter((item) => item.lines > 1 || item.outsideViewport || item.internalOverflow);
    const forcedBreaks = document.querySelectorAll("main br, dialog br").length;
    const resources = performance.getEntriesByType("resource")
      .filter((entry) => /assets\/images\//.test(entry.name))
      .map((entry) => ({
        name: entry.name.split("/").pop(),
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
      }));
    return {
      title: document.title,
      bodyTextLength: document.body.innerText.trim().length,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      horizontalOverflow: Math.max(0, doc.scrollWidth - doc.clientWidth),
      brokenImages,
      internalTargets,
      clippedText,
      protectedPhraseFailures,
      forcedBreaks,
      hero: (() => {
        const image = document.querySelector(".hero img");
        return image
          ? { currentSrc: image.currentSrc.split("/").pop(), naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }
          : null;
      })(),
      hiddenReveals: [...document.querySelectorAll(".reveal")].filter((item) => {
        const style = getComputedStyle(item);
        return style.display !== "none" && style.opacity === "0";
      }).length,
      loaderVisible: (() => {
        const loader = document.querySelector(".page-loader");
        return loader ? getComputedStyle(loader).visibility !== "hidden" : false;
      })(),
      noindex: document.querySelector('meta[name="robots"]')?.content || "",
      imageFormats: [...new Set(allImages.map((image) => image.currentSrc.split(".").pop()))],
      resources,
    };
  });

  const widthResult = {
    width,
    height,
    status: response?.status() || null,
    ...metrics,
    consoleErrors,
    pageErrors,
  };
  report.widths.push(widthResult);

  if (widthResult.status !== 200) report.failures.push(`${width}px: HTTP ${widthResult.status}`);
  if (widthResult.horizontalOverflow !== 0) report.failures.push(`${width}px: horizontal overflow ${widthResult.horizontalOverflow}px`);
  if (metrics.brokenImages.length) report.failures.push(`${width}px: broken images ${metrics.brokenImages.join(", ")}`);
  if (metrics.internalTargets.length) report.failures.push(`${width}px: missing anchors ${metrics.internalTargets.join(", ")}`);
  if (metrics.protectedPhraseFailures.length) report.failures.push(`${width}px: protected phrase failures ${JSON.stringify(metrics.protectedPhraseFailures)}`);
  if (metrics.forcedBreaks !== 0) report.failures.push(`${width}px: ${metrics.forcedBreaks} forced br elements remain`);
  if (consoleErrors.length || pageErrors.length) report.failures.push(`${width}px: browser errors`);
  if (metrics.hiddenReveals !== 0) report.failures.push(`${width}px: ${metrics.hiddenReveals} reveal elements stayed hidden`);

  if ([320, 375, 390, 430, 1440].includes(width)) {
    await page.screenshot({ path: path.join(outputDir, `full-${width}.jpg`), type: "jpeg", quality: 76, fullPage: true });
    for (const selector of ["#top", "#group", "#stockmart", "#companies", "#contact"]) {
      const element = page.locator(selector);
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      await element.screenshot({ path: path.join(outputDir, `${selector.slice(1)}-${width}.jpg`), type: "jpeg", quality: 82 });
    }
  }

  if (width === 390) {
    await page.locator("#top").scrollIntoViewIfNeeded();
    await page.locator(".menu-button").click();
    await page.waitForTimeout(420);
    const menuOpen = await page.locator("#mobile-menu").evaluate((element) => ({
      visible: getComputedStyle(element).visibility === "visible",
      ariaHidden: element.getAttribute("aria-hidden"),
    }));
    await page.keyboard.press("Escape");
    const menuClosed = await page.locator("#mobile-menu").getAttribute("aria-hidden");
    report.interaction.mobileMenu = { menuOpen, menuClosed };
    if (!menuOpen.visible || menuOpen.ariaHidden !== "false" || menuClosed !== "true") {
      report.failures.push("mobile menu interaction failed");
    }

    await page.locator("#stockmart").scrollIntoViewIfNeeded();
    await page.locator('#stockmart [data-image-zoom]').click();
    const imageDialogOpen = await page.locator("#image-dialog").evaluate((element) => element.open);
    const imageDialogSource = await page.locator("[data-image-dialog-image]").getAttribute("src");
    await page.locator("[data-image-dialog-close]").click();
    const imageDialogClosed = await page.locator("#image-dialog").evaluate((element) => !element.open);
    report.interaction.imageDialog = { imageDialogOpen, imageDialogSource, imageDialogClosed };
    if (!imageDialogOpen || !imageDialogClosed || imageDialogSource !== "assets/images/stockmart.jpg") {
      report.failures.push("image dialog interaction failed");
    }
  }

  if (width === 1440) {
    await page.locator("#group").scrollIntoViewIfNeeded();
    await page.locator('[data-group-key="stockmart"]').click();
    const groupDetail = await page.locator("[data-group-name]").textContent();
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await page.locator("[data-demo-submit]").click();
    const dialogOpen = await page.locator("#demo-dialog").evaluate((element) => element.open);
    await page.locator("[data-dialog-close]").last().click();
    const dialogClosed = await page.locator("#demo-dialog").evaluate((element) => !element.open);
    report.interaction.desktop = { groupDetail, dialogOpen, dialogClosed };
    if (groupDetail.trim() !== "stockmart" || !dialogOpen || !dialogClosed) {
      report.failures.push("desktop interactions failed");
    }
  }

  await page.close();
}

const reducedPage = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
await reducedPage.goto(url, { waitUntil: "networkidle" });
await reducedPage.waitForTimeout(200);
report.reducedMotion = await reducedPage.evaluate(() => ({
  loaderDisplay: getComputedStyle(document.querySelector(".page-loader")).display,
  hiddenReveals: [...document.querySelectorAll(".reveal")].filter((item) => getComputedStyle(item).opacity === "0").length,
  heroTransform: getComputedStyle(document.querySelector(".hero-media")).transform,
  scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
}));
if (report.reducedMotion.loaderDisplay !== "none" || report.reducedMotion.hiddenReveals !== 0) {
  report.failures.push("reduced-motion final state failed");
}
await reducedPage.close();

await browser.close();

fs.writeFileSync(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.failures.length ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
