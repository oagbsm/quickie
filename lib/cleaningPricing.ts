export const CLEANING_HOURLY_RATE = 22;
export const cleaningExtras = [{ name: "Ironing", minutes: 60 }, { name: "Laundry", minutes: 30 }, { name: "Inside windows", minutes: 45 }, { name: "Inside fridge", minutes: 30 }, { name: "Inside oven", minutes: 60 }] as const;
export type CleaningPriceInput = { service: string; frequency: string; property: string; floor: string; bedrooms: number; bathrooms: number; condition: string; lastClean: string; extras: string[]; parking: string };
export function calculateCleaningQuote(input: CleaningPriceInput) {
  const bedrooms = Math.min(8, Math.max(0, Number(input.bedrooms) || 0));
  const bathrooms = Math.min(8, Math.max(1, Number(input.bathrooms) || 1));
  let minutes = 60 + bedrooms * 30 + bathrooms * 25;
  if (input.service === "Short-stay cleaning") minutes += 30;
  if (input.service === "Deep clean") minutes += 90;
  if (input.service === "End of tenancy") minutes += 150;
  if (input.service === "After builders") minutes += 180;
  if (input.lastClean === "A while ago") minutes += 45;
  if (input.lastClean === "Never professionally cleaned") minutes += 75;
  if (input.condition === "Cluttered") minutes += 45;
  if (input.condition === "Heavily soiled") minutes += 120;
  if (input.property === "Flat" && input.floor === "Stairs only") minutes += 15;
  minutes += cleaningExtras.filter((extra) => input.extras.includes(extra.name)).reduce((total, extra) => total + extra.minutes, 0);
  const hours = Math.max(2, Math.ceil(minutes / 30) / 2);
  const discount = input.frequency === "Weekly" ? 0.9 : input.frequency === "Fortnightly" ? 0.95 : 1;
  return { hours, price: Math.round(hours * CLEANING_HOURLY_RATE * discount + (input.parking === "Paid parking (+£5)" ? 5 : 0)) };
}
