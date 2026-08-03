import Link from "next/link";
import { addProperty, updateProperty } from "../actions";
type P = Record<string, string | number | boolean | null>;
export default function PropertyForm({
  property,
  onboarding = true,
  duplicatePropertyId,
}: {
  property?: P;
  onboarding?: boolean;
  duplicatePropertyId?: string;
}) {
  const c =
    "mt-1.5 min-h-12 w-full rounded-lg border border-[#cfd7e3] bg-white px-3.5 py-2.5 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";
  return (
    <form
      action={property?.id ? updateProperty : addProperty}
      className="grid gap-7 rounded-xl border border-[#dfe4eb] bg-white p-5 sm:p-7"
    >
      {property && property.id && (
        <input type="hidden" name="id" value={String(property.id)} />
      )}{" "}
      {onboarding && <input type="hidden" name="returnTo" value="onboarding" />}
      {duplicatePropertyId && (
        <input
          type="hidden"
          name="duplicatePropertyId"
          value={duplicatePropertyId}
        />
      )}{" "}
      {property?.id && (
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={`/business/properties/${property.id}/cleaners`}
            className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-extrabold"
          >
            Manage cleaners
          </Link>
          <Link
            href={`/business/properties/new?duplicate=${property.id}`}
            className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-extrabold"
          >
            Duplicate settings and checklist
          </Link>
        </div>
      )}
      <label className="font-bold">
        Property image{" "}
        <span className="text-sm font-normal text-[#657089]">
          (optional, JPG, PNG or WebP up to 10 MB)
        </span>
        <input
          className={c}
          name="propertyImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
        />
      </label>
      <fieldset className="grid gap-5">
        <legend className="text-lg font-extrabold">Property details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="font-bold">
            Property name
            <input
              className={c}
              name="nickname"
              defaultValue={String(property?.nickname || "")}
              required
            />
          </label>
          <label className="font-bold">
            Property type
            <select
              className={c}
              name="propertyType"
              defaultValue={String(property?.property_type || "")}
              required
            >
              <option value="" disabled>
                Select type
              </option>
              <option value="house">House</option>
              <option value="flat">Flat or apartment</option>
              <option value="serviced_apartment">Serviced apartment</option>
              <option value="cottage">Cottage</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <label className="font-bold">
          Full address
          <input
            className={c}
            name="addressLine1"
            autoComplete="address-line1"
            defaultValue={String(property?.address_line_1 || "")}
            required
          />
        </label>
        <input type="hidden" name="addressLine2" value="" />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="font-bold">
            Town or city
            <input
              className={c}
              name="city"
              autoComplete="address-level2"
              defaultValue={String(property?.city || "")}
              required
            />
          </label>
          <label className="font-bold">
            Postcode
            <input
              className={c}
              name="postcode"
              autoComplete="postal-code"
              defaultValue={String(property?.postcode || "")}
              required
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="font-bold">
            Bedrooms
            <input
              className={c}
              name="bedrooms"
              type="number"
              min="0"
              defaultValue={String(property?.bedrooms ?? "")}
              required
            />
          </label>
          <label className="font-bold">
            Bathrooms
            <input
              className={c}
              name="bathrooms"
              type="number"
              min="0"
              step="0.5"
              defaultValue={String(property?.bathrooms ?? "")}
              required
            />
          </label>
        </div>
        <input type="hidden" name="approximateSize" value="" />
        <input
          type="hidden"
          name="accessMethod"
          value="Key safe or owner-arranged access"
        />
      </fieldset>
      {property?.id ? <fieldset className="grid gap-5 border-t pt-6">
        <legend className="text-lg font-extrabold">Clean standard</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="font-bold">
            Default checkout
            <input
              className={c}
              name="defaultCheckoutTime"
              type="time"
              defaultValue={String(property?.default_checkout_time || "11:00")}
              required
            />
          </label>
          <label className="font-bold">
            Default check-in
            <input
              className={c}
              name="defaultCheckinTime"
              type="time"
              defaultValue={String(property?.default_checkin_time || "15:00")}
              required
            />
          </label>
          <label className="font-bold">
            Estimated clean (minutes)
            <input
              className={c}
              name="estimatedTurnoverMinutes"
              type="number"
              min="15"
              step="15"
              defaultValue={String(property?.estimated_turnover_minutes || 180)}
              required
            />
          </label>
        </div>
        <label className="font-bold">
          Access instructions{" "}
          <span className="text-sm font-normal text-[#657089]">
            (shown only after acceptance)
          </span>
          <textarea
            className={c}
            name="accessNotes"
            rows={3}
            defaultValue={String(property?.access_notes || "")}
          />
        </label>
        <label className="font-bold">
          Bed setup
          <textarea
            className={c}
            name="bedConfiguration"
            rows={2}
            defaultValue={String(property?.bed_configuration || "")}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="font-bold">
            Linen instructions
            <textarea
              className={c}
              name="linenRequirements"
              rows={2}
              defaultValue={String(property?.linen_requirements || "")}
            />
          </label>
          <label className="font-bold">
            Towel requirements
            <textarea
              className={c}
              name="towelRequirements"
              rows={2}
              defaultValue={String(property?.towel_requirements || "")}
            />
          </label>
        </div>
        <label className="font-bold">
          Guest-ready standard
          <textarea
            className={c}
            name="cleaningNotes"
            rows={3}
            defaultValue={String(property?.cleaning_notes || "")}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="font-bold">
            Key or lockbox instructions
            <textarea
              className={c}
              name="keyInstructions"
              rows={2}
              defaultValue={String(property?.key_instructions || "")}
            />
          </label>
          <label className="font-bold">
            Key-return instructions
            <textarea
              className={c}
              name="keyReturnInstructions"
              rows={2}
              defaultValue={String(property?.key_return_instructions || "")}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="font-bold">
            Parking instructions
            <textarea
              className={c}
              name="parkingNotes"
              rows={2}
              defaultValue={String(property?.parking_notes || "")}
            />
          </label>
          <label className="font-bold">
            Floor or lift information
            <textarea
              className={c}
              name="floorLiftNotes"
              rows={2}
              defaultValue={String(property?.floor_lift_notes || "")}
            />
          </label>
          <label className="font-bold">
            Waste instructions
            <textarea
              className={c}
              name="wasteInstructions"
              rows={2}
              defaultValue={String(property?.waste_instructions || "")}
            />
          </label>
        </div>
        <label className="font-bold">
          Consumables instructions
          <textarea
            className={c}
            name="consumablesInstructions"
            rows={2}
            defaultValue={String(property?.consumables_instructions || "")}
          />
        </label>
        <label className="flex min-h-11 items-center gap-3 font-bold">
          <input
            name="sofaBedRequired"
            type="checkbox"
            defaultChecked={Boolean(property?.sofa_bed_required)}
            className="h-5 w-5"
          />
          Prepare the sofa bed
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="font-bold">
            Heating instructions
            <textarea
              className={c}
              name="heatingInstructions"
              rows={2}
              defaultValue={String(property?.heating_instructions || "")}
            />
          </label>
          <label className="font-bold">
            Lighting instructions
            <textarea
              className={c}
              name="lightingInstructions"
              rows={2}
              defaultValue={String(property?.lighting_instructions || "")}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="font-bold">
            Emergency contact
            <input
              className={c}
              name="emergencyContact"
              defaultValue={String(property?.emergency_contact || "")}
            />
          </label>
          <label className="font-bold">
            Internal notes{" "}
            <span className="text-sm font-normal text-[#657089]">
              (never shown to cleaners)
            </span>
            <textarea
              className={c}
              name="internalNotes"
              rows={2}
              defaultValue={String(property?.internal_notes || "")}
            />
          </label>
        </div>
        <label className="max-w-xs font-bold">
          Required completion photos
          <input
            className={c}
            name="requiredCompletionPhotos"
            type="number"
            min="0"
            max="50"
            defaultValue={String(property?.required_completion_photos ?? 4)}
            required
          />
        </label>
      </fieldset> : null}
      <button className="min-h-12 rounded-lg bg-[#071f49] px-5 font-extrabold text-white">
        {property?.id ? "Save property standard" : "Add property"}
      </button>
    </form>
  );
}
