"use client";

import type { ServiceFormField } from "../data/serviceFormConfigs";

type DynamicServiceFieldsProps = {
  fields: ServiceFormField[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
};

export default function DynamicServiceFields({
  fields,
  values,
  onChange,
}: DynamicServiceFieldsProps) {
  if (!fields.length) return null;

  return (
    <div className="mt-2 space-y-2">
      {fields.map((field) => {
        const isQuoteField = field.name === "quoteAmount";

        if (field.type === "chips") {
          return (
            <div key={field.name} className="space-y-1 rounded-[14px] bg-white/0">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[11.5px] font-black tracking-[-0.02em] text-[#071638] sm:text-[13px]">
                  {field.label}
                </label>
                {field.optional ? (
                  <span className="text-[10.5px] font-bold text-[#6b7a90]">Optional</span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {field.options?.map((option) => {
                  const active = values[field.name] === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange(field.name, option.value)}
                      className={`min-h-[35px] rounded-[11px] px-3 py-1.5 text-left text-[12px] font-black leading-tight tracking-[-0.02em] transition sm:min-h-[40px] sm:px-3.5 sm:py-2 sm:text-[12.5px] ${
                        active
                          ? "bg-[#079448] text-white shadow-[0_8px_18px_rgba(7,148,72,0.22)]"
                          : "bg-[#f2f6fb] text-[#071638] ring-1 ring-[#e8eef5] hover:bg-[#e8f0f8]"
                      }`}
                    >
                      <span className="block min-w-0">
                        <span className="block truncate">{option.label}</span>
                        {option.helper ? (
                          <span className={`mt-0.5 block text-[9.5px] font-bold leading-none ${active ? "text-white/80" : "text-[#6b7a90]"}`}>
                            {option.helper}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        if (field.type === "postcode" || field.type === "money" || field.type === "text") {
          return (
            <div key={field.name} className={isQuoteField ? "space-y-1 rounded-[12px] bg-[#fbfcfe] p-2" : "space-y-1"}>
              <div className="flex items-center justify-between gap-3">
                <label className={isQuoteField ? "text-[11px] font-black tracking-[-0.02em] text-[#52627a] sm:text-[12px]" : "text-[11.5px] font-black tracking-[-0.02em] text-[#071638] sm:text-[13px]"}>
                  {field.label}
                </label>
                {field.optional ? (
                  <span className="text-[11px] font-bold text-[#6b7a90]">Optional</span>
                ) : null}
              </div>

              <div className="relative">
                {field.type === "money" ? (
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-black text-[#52627a]">
                    £
                  </span>
                ) : null}
                <input
                  type={field.type === "money" ? "number" : "text"}
                  inputMode={field.type === "money" ? "decimal" : undefined}
                  value={values[field.name] ?? ""}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  placeholder={field.placeholder}
                  className={`${isQuoteField ? "h-[36px] rounded-[10px] bg-white text-[13px]" : "h-[40px] rounded-[11px] bg-[#f2f6fb] text-[13px] sm:h-11 sm:text-[15px]"} w-full font-bold tracking-[-0.02em] text-[#071638] outline-none transition placeholder:text-[#7a8798] focus:bg-white focus:ring-2 focus:ring-[#079448]/30 ${
                    field.type === "money" ? "pl-7 pr-3" : "px-3.5"
                  }`}
                />
              </div>

              {field.example ? (
                <p className={isQuoteField ? "text-[10.5px] font-semibold text-[#8b97a8]" : "text-[11px] font-semibold text-[#7a8798]"}>{field.example}</p>
              ) : null}
            </div>
          );
        }

        if (field.type === "select") {
          return (
            <div key={field.name} className="space-y-1">
              <label className="text-[11.5px] font-black tracking-[-0.02em] text-[#071638] sm:text-[13px]">
                {field.label}
              </label>
              <select
                value={values[field.name] ?? ""}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="h-[40px] w-full rounded-[11px] bg-[#f2f6fb] px-3.5 text-[13px] font-bold tracking-[-0.02em] text-[#071638] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#079448]/30 sm:h-11 sm:text-[15px]"
              >
                <option value="">Select one</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}