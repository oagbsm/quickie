import { normaliseUkPostcode, UK_POSTCODE_PATTERN } from "../uk-address.ts";

export const ONBOARDING_BEDROOMS = ["0", "1", "2", "3", "4", "5"] as const;

export type PropertyBasicsErrors = Partial<
  Record<
    "nickname" | "addressLine1" | "postcode" | "bedrooms",
    string
  >
>;

const trimmed = (form: FormData, name: string) => String(form.get(name) || "").trim();

export function validatePropertyBasics(form: FormData): PropertyBasicsErrors {
  const errors: PropertyBasicsErrors = {};
  const bedrooms = trimmed(form, "bedrooms");
  const postcode = normaliseUkPostcode(trimmed(form, "postcode"));

  if (!trimmed(form, "nickname")) errors.nickname = "Enter a property name.";
  if (!trimmed(form, "addressLine1")) errors.addressLine1 = "Enter the full address.";
  if (!postcode || !UK_POSTCODE_PATTERN.test(postcode))
    errors.postcode = "Enter a valid UK postcode, for example SL1 1AA.";
  if (!ONBOARDING_BEDROOMS.includes(bedrooms as (typeof ONBOARDING_BEDROOMS)[number]))
    errors.bedrooms = "Select the number of bedrooms.";

  return errors;
}
