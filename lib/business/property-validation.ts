import { normaliseUkPostcode, UK_POSTCODE_PATTERN } from "../uk-address.ts";

export const ONBOARDING_PROPERTY_TYPES = [
  "house",
  "flat",
  "airbnb",
  "serviced_apartment",
  "other",
] as const;

export const ONBOARDING_BEDROOMS = ["0", "1", "2", "3", "4", "5"] as const;
export const ONBOARDING_BATHROOMS = ["1", "2", "3", "4", "5"] as const;

export type PropertyBasicsErrors = Partial<
  Record<
    | "nickname"
    | "propertyType"
    | "addressLine1"
    | "city"
    | "postcode"
    | "bedrooms"
    | "bathrooms",
    string
  >
>;

const trimmed = (form: FormData, name: string) => String(form.get(name) || "").trim();

export function validateOnboardingPropertyBasics(form: FormData): PropertyBasicsErrors {
  const errors: PropertyBasicsErrors = {};
  const propertyType = trimmed(form, "propertyType");
  const bedrooms = trimmed(form, "bedrooms");
  const bathrooms = trimmed(form, "bathrooms");
  const postcode = normaliseUkPostcode(trimmed(form, "postcode"));

  if (!trimmed(form, "nickname")) errors.nickname = "Enter a property name.";
  if (!ONBOARDING_PROPERTY_TYPES.includes(propertyType as (typeof ONBOARDING_PROPERTY_TYPES)[number]))
    errors.propertyType = "Select a property type.";
  if (!trimmed(form, "addressLine1")) errors.addressLine1 = "Enter the full address.";
  if (!trimmed(form, "city")) errors.city = "Enter the town or city.";
  if (!postcode || !UK_POSTCODE_PATTERN.test(postcode))
    errors.postcode = "Enter a valid UK postcode, for example SL1 1AA.";
  if (!ONBOARDING_BEDROOMS.includes(bedrooms as (typeof ONBOARDING_BEDROOMS)[number]))
    errors.bedrooms = "Select the number of bedrooms.";
  if (!ONBOARDING_BATHROOMS.includes(bathrooms as (typeof ONBOARDING_BATHROOMS)[number]))
    errors.bathrooms = "Select the number of bathrooms.";

  return errors;
}
