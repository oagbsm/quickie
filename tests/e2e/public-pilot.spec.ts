import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage communicates managed business cleaning and passes a basic accessibility scan", async ({page}) => {
  await page.goto("/");
  await expect(page.getByRole("heading",{level:1})).toHaveText("The smarter way to manage every clean, every time.");
  await expect(page.getByRole("link",{name:"Request business access"}).first()).toBeVisible();
  await expect(page.getByText(/controlled service currently available in Slough/i)).toBeVisible();
  await expect(page.getByText(/book a cleaner for your home/i)).toHaveCount(0);
  const results=await new AxeBuilder({page}).analyze();
  expect(results.violations.filter(v=>["critical","serious"].includes(v.impact||""))).toEqual([]);
});

test("desktop and mobile navigation expose the public architecture",async({page},testInfo)=>{
  await page.goto("/");
  if(testInfo.project.name==="mobile") await page.getByText("Menu",{exact:true}).click();
  const navigation=page.getByRole("navigation",{name:testInfo.project.name==="mobile"?"Mobile navigation":"Primary navigation"});
  await expect(navigation.getByRole("link",{name:"How it works"})).toBeVisible();
  await expect(navigation.getByRole("link",{name:"For businesses"})).toBeVisible();
  for(const removed of ["Product","Solutions","Pricing","Service area"]) await expect(navigation.getByRole("link",{name:removed,exact:true})).toHaveCount(0);
  await expect(page.getByRole("link",{name:"Sign in"}).first()).toBeVisible();
  await expect(page.getByRole("link",{name:"Request business access"}).first()).toBeVisible();
});

test("landing page uses truthful capability, legal and CTA copy",async({page})=>{
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Everything you need to organise property cleaning in one place."})).toBeVisible();
  for(const title of ["Manage every property","Request cleans quickly","Follow every booking"]) await expect(page.getByRole("heading",{name:title})).toBeVisible();
  await expect(page.getByText("16B Quinbrookes")).toBeVisible();
  await expect(page.getByText("Booking received",{exact:true})).toBeVisible();
  await expect(page.getByText("MATO GROUP LTD",{exact:true})).toBeVisible();
  await expect(page.getByText("Company number 17327292",{exact:true})).toBeVisible();
  for(const unsupported of ["No contracts","cancel anytime","Real-Time Updates","audit history","100+","Consistent results","Vetted professionals","Insured & compliant"]) await expect(page.getByText(new RegExp(unsupported,"i"))).toHaveCount(0);
  await expect(page.getByRole("heading",{name:"Ready to simplify your property cleaning?"})).toBeVisible();
});

test("landing section links target real sections and hero mock-up is readable",async({page},testInfo)=>{
  await page.goto("/");
  await expect(page.locator('#for-businesses')).toBeVisible();
  await expect(page.locator('#how-it-works')).toBeVisible();
  if(testInfo.project.name==="mobile") await page.getByText("Menu",{exact:true}).click();
  const navigation=page.getByRole("navigation",{name:testInfo.project.name==="mobile"?"Mobile navigation":"Primary navigation"});
  await expect(navigation.getByRole("link",{name:"For businesses"})).toHaveAttribute("href","#for-businesses");
  await expect(navigation.getByRole("link",{name:"How it works"})).toHaveAttribute("href","#how-it-works");
  await expect(page.getByText("Saturday, 25 July · 10:00")).toBeVisible();
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
