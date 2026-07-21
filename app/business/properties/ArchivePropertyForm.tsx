"use client";
import { setPropertyStatus } from "../actions";
export default function ArchivePropertyForm({
  id,
  archived,
  hasActiveBookings,
}: {
  id: string;
  archived: boolean;
  hasActiveBookings: boolean;
}) {
  return (
    <form
      action={setPropertyStatus}
      onSubmit={(event) => {
        if (archived) return;
        const warning = hasActiveBookings
          ? "This property has active bookings. Archiving will keep its booking history but may make future management harder. Archive anyway?"
          : "Archive this property? Existing booking history will remain available.";
        if (!window.confirm(warning)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input
        type="hidden"
        name="status"
        value={archived ? "active" : "archived"}
      />
      <input type="hidden" name="confirmActiveBookings" value={hasActiveBookings ? "1" : "0"} />
      <button
        className={`min-h-11 w-full rounded-xl px-4 font-black ${archived ? "bg-[#edf7f1] text-[#079448]" : "text-red-700 hover:bg-red-50"}`}
      >
        {archived ? "Restore property" : "Archive property"}
      </button>
    </form>
  );
}
