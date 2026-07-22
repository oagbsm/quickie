import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage communicates managed business cleaning and passes a basic accessibility scan", async ({page}) => {
  await page.goto("/");
  await expect(page.getByRole("heading",{level:1})).toHaveText("Manage every property clean in one place.");
  await expect(page.getByRole("link",{name:"Request business access"}).first()).toBeVisible();
  await expect(page.getByText(/controlled service currently available in Slough/i)).toBeVisible();
  await expect(page.getByText(/book a cleaner for your home/i)).toHaveCount(0);
  const results=await new AxeBuilder({page}).analyze();
  expect(results.violations.filter(v=>["critical","serious"].includes(v.impact||""))).toEqual([]);
});

test("desktop and mobile navigation expose the public architecture",async({page},testInfo)=>{
  await page.goto("/");
  if(testInfo.project.name==="mobile") await page.getByText("Menu",{exact:true}).click();
  await expect(page.getByRole("navigation",{name:testInfo.project.name==="mobile"?"Mobile navigation":"Primary navigation"}).getByRole("link",{name:"Product"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Sign in"}).first()).toBeVisible();
});

test("solution, product, process and service-area routes render",async({page})=>{
  for(const path of ["/product","/how-it-works","/service-area","/solutions/letting-agents","/solutions/airbnb","/solutions/offices"]){await page.goto(path);await expect(page.getByRole("heading",{level:1}),path).toBeVisible();await expect(page.getByRole("link",{name:"Request business access"}).first()).toBeVisible();}
});

test("business enquiry validates and is clearly non-confirming",async({page})=>{
  await page.goto("/business/enquire");
  await expect(page.getByRole("heading",{level:1})).toHaveText("Tell us about your operation.");
  await expect(page.getByLabel("Business or organisation")).toBeVisible();
  await expect(page.getByText(/submission does not (confirm|guarantee)/i).first()).toBeVisible();
  await page.getByRole("button",{name:"Request business access"}).click();
  await expect(page.getByLabel("Your name")).toBeFocused();
});

test("consumer booking URLs permanently retire to business enquiry",async({request})=>{
  for(const path of ["/book","/regular-cleaner-slough","/slough/langley/cleaner","/commercial-cleaning"]){const response=await request.get(path,{maxRedirects:0});expect(response.status(),path).toBe(308);expect(response.headers().location).toBe("/business/enquire");}
});

test("protected portals redirect unauthenticated visitors",async({page})=>{await page.goto("/admin");await expect(page).toHaveURL(/\/admin\/login$/);await page.goto("/business/dashboard");await expect(page).toHaveURL(/\/business\/sign-in$/);});

test("public routes have no horizontal overflow",async({page})=>{for(const path of ["/","/product","/how-it-works","/service-area","/solutions/letting-agents","/business/enquire","/business/sign-in"]){await page.goto(path);expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),`${path} overflows`).toBe(false);}});

test("unknown routes render a useful 404",async({page})=>{const response=await page.goto("/not-a-real-quickola-page");expect(response?.status()).toBe(404);await expect(page.getByRole("heading",{level:1})).toHaveText("That page is not here.");});
