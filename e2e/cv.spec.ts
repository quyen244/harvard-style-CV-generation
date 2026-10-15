import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const previewHeadings = (page: Page) => page.locator(".cv-h").allTextContents();

const sectionCard = (page: Page, title: string) =>
  page.locator("aside [data-section-card]").filter({ has: page.locator(`input[aria-label='Section title'][value="${title}"]`) });

const handleOf = (page: Page, title: string) => sectionCard(page, title).getByRole("button", { name: "Drag to reorder section" });

/** Drags a dnd-kit handle onto another row, with intermediate moves so the pointer sensor activates. */
async function dragHandle(page: Page, from: Locator, to: Locator) {
  const a = (await from.boundingBox())!;
  const b = (await to.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + 8, { steps: 4 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator(".cv-name")).toHaveText("Nguyen Van Quyen");
});

test("renders the seeded Harvard CV on one page", async ({ page }) => {
  expect(await previewHeadings(page)).toEqual([
    "Summary",
    "Education",
    "Projects",
    "Research Experience",
    "Technical Skills",
    "Certifications",
    "Activities",
  ]);
  await expect(page.getByText("1 page", { exact: true })).toBeVisible();
});

test("drag Research above Projects; order persists after reload", async ({ page }) => {
  await dragHandle(page, handleOf(page, "Research Experience"), handleOf(page, "Projects"));
  const expected = ["Summary", "Education", "Research Experience", "Projects", "Technical Skills", "Certifications", "Activities"];
  await expect.poll(() => previewHeadings(page)).toEqual(expected);
  await page.reload();
  await expect.poll(() => previewHeadings(page)).toEqual(expected);
});

test("two CVs keep independent section orders", async ({ page }) => {
  await page.getByRole("button", { name: "Switch CV" }).click();
  await page.getByRole("menuitem", { name: "Duplicate this CV" }).click();
  await expect(page.getByLabel("CV name")).toHaveValue("Fullstack / AI Automation (copy)");
  await page.getByLabel("CV name").fill("Research CV");

  await dragHandle(page, handleOf(page, "Research Experience"), handleOf(page, "Projects"));
  await expect.poll(async () => (await previewHeadings(page)).slice(2, 4)).toEqual(["Research Experience", "Projects"]);

  await page.getByRole("button", { name: "Switch CV" }).click();
  await page.getByRole("menuitem", { name: /Fullstack \/ AI Automation/ }).click();
  await expect.poll(async () => (await previewHeadings(page)).slice(2, 4)).toEqual(["Projects", "Research Experience"]);

  await page.getByRole("button", { name: "Switch CV" }).click();
  await page.getByRole("menuitem", { name: /Research CV/ }).click();
  await expect.poll(async () => (await previewHeadings(page)).slice(2, 4)).toEqual(["Research Experience", "Projects"]);
});

test("add a section with an item and bullets, then delete and undo", async ({ page }) => {
  await page.getByRole("button", { name: "Add section" }).click();
  await page.getByRole("menuitem", { name: /^Experience/ }).click();

  const card = page.locator("aside [data-section-card]").last();
  await expect(card.getByLabel("Section title")).toHaveValue("Experience");
  // A new section starts with one empty item; open it.
  await card.getByRole("button", { name: /Untitled item/ }).click();
  await card.getByPlaceholder("Software Engineer Intern, Company").fill("Backend Intern, Tiki");
  await card.getByPlaceholder("Jun 2025 - Present").fill("Jun 2026 - Present");
  const bullet = card.getByPlaceholder(/Describe an achievement/).first();
  await bullet.fill("Cut API latency by **40%**");
  await bullet.press("Enter");
  await page.keyboard.type("Second bullet");

  const entry = page.locator(".cv-entry", { hasText: "Backend Intern, Tiki" });
  await expect(entry).toBeVisible();
  await expect(entry.locator("li")).toHaveText(["Cut API latency by 40%", "Second bullet"]);
  await expect(entry.locator("li strong")).toHaveText("40%");
  await expect(entry.locator(".cv-meta")).toHaveText("Jun 2026 - Present");

  await card.getByRole("button", { name: "Delete item" }).click();
  await expect(entry).toHaveCount(0);
  await page.getByRole("status").getByRole("button", { name: "Undo" }).click();
  await expect(entry).toBeVisible();

  // Ctrl+Z steps back through the history too.
  await card.getByRole("button", { name: "Section actions" }).click();
  await page.getByRole("menuitem", { name: "Delete section" }).click();
  await expect(page.locator(".cv-h").filter({ hasText: /^Experience$/ })).toHaveCount(0);
  await page.keyboard.press("Control+z");
  await expect(page.locator(".cv-h").filter({ hasText: /^Experience$/ })).toHaveCount(1);
});

test("hide a section and an item from the CV", async ({ page }) => {
  const card = sectionCard(page, "Projects");
  await card.getByRole("button", { name: "Expand section" }).click();
  await card.getByRole("button", { name: "Hide from CV" }).first().click();
  await expect(page.locator(".cv-entry", { hasText: "WriteWise" })).toHaveCount(0);
  await expect(card.getByText("3/4 shown")).toBeVisible();

  await card.getByRole("button", { name: "Hide section from CV" }).click();
  await expect(page.locator(".cv-h", { hasText: "Projects" })).toHaveCount(0);
});

test("export then import a CV", async ({ page }) => {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("Nguyen_Van_Quyen_CV.json");
  const json = JSON.parse(readFileSync((await file.path())!, "utf8"));
  expect(json.header.name).toBe("Nguyen Van Quyen");

  json.name = "Imported copy";
  json.header.name = "Imported Person";
  await page.locator("input[type=file]").setInputFiles({
    name: "cv.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(json)),
  });
  await expect(page.locator(".cv-name")).toHaveText("Imported Person");
  await expect(page.getByLabel("CV name")).toHaveValue("Imported copy");
  await expect(page.getByRole("button", { name: "Switch CV" })).toContainText("2");

  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ foo: 1 })),
  });
  await expect(page.getByRole("status").filter({ hasText: "Could not import" })).toBeVisible();
});

test("print output is a single A4 page with only the CV", async ({ page }) => {
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ preferCSSPageSize: true });
  const pages = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? [];
  expect(pages).toHaveLength(1);
  await expect(page.locator("aside")).toBeHidden();
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeHidden();
});
