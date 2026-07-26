"use client";
import { useActionState } from "react";
import { revealPropertyAccess, type AccessRevealState } from "../actions";
const initial: AccessRevealState = { revealed: false };
export default function AccessReveal({ propertyId }: { propertyId: string }) {
  const [state, action, pending] = useActionState(
    revealPropertyAccess,
    initial,
  );
  if (!state.revealed)
    return (
      <div className="mt-5 rounded-lg bg-[#f4f6f9] p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-bold text-[#657089]">
              Entry instructions
            </dt>
            <dd className="mt-1 font-bold">••••••••</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-[#657089]">
              Key or lockbox details
            </dt>
            <dd className="mt-1 font-bold">••••••••</dd>
          </div>
        </dl>
        <form action={action}>
          <input type="hidden" name="propertyId" value={propertyId} />
          <button
            disabled={pending}
            className="mt-5 min-h-11 rounded-lg bg-[#071f49] px-4 font-extrabold text-white disabled:opacity-60"
          >
            {pending ? "Revealing…" : "Reveal access details"}
          </button>
        </form>
        {state.message && (
          <p role="alert" className="mt-3 text-sm font-bold text-red-700">
            {state.message}
          </p>
        )}
        <p className="mt-3 text-xs text-[#657089]">
          Reveals are recorded in Activity. Details are hidden again when you
          leave this page.
        </p>
      </div>
    );
  return (
    <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5">
      <dl className="grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-bold text-amber-900">
            Entry instructions
          </dt>
          <dd className="mt-1 whitespace-pre-wrap">
            {state.accessNotes || "Not set"}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-bold text-amber-900">
            Key or lockbox details
          </dt>
          <dd className="mt-1 whitespace-pre-wrap">
            {state.keyInstructions || "Not set"}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-bold text-amber-900">Parking</dt>
          <dd className="mt-1 whitespace-pre-wrap">
            {state.parkingNotes || "Not set"}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-bold text-amber-900">Floor or lift</dt>
          <dd className="mt-1 whitespace-pre-wrap">
            {state.floorLiftNotes || "Not set"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
