type MayaRequest = {
  id: string;
  service: string | null;
  area: string | null;
  postcode: string | null;
  source: string | null;
  status: string | null;
  pol_status?: string | null;
  zayn_status?: string | null;
  customer_rating?: number | null;
  customer_issue?: string | null;
  estimated_value?: number | null;
  customer_paid_amount?: number | null;
};

type MayaBusiness = {
  id: string;
  business_name: string | null;
  category: string | null;
  status: string | null;
  active: boolean | null;
  provider_type?: string | null;
  auto_match_enabled?: boolean | null;
};

type MayaMatch = {
  id: string;
  request_id: string | null;
  business_id: string | null;
  status: string | null;
  quoted_price?: number | null;
};

type MayaGrowthPanelProps = {
  requests: MayaRequest[];
  businesses: MayaBusiness[];
  matches: MayaMatch[];
};

function label(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getPostcodeDistrict(value: string | null | undefined) {
  if (!value) return "Slough";
  const cleanValue = value.toUpperCase().replace(/\s+/g, "").trim();
  const match = cleanValue.match(/^([A-Z]{1,2}\d[A-Z\d]?)/);
  return match ? match[1] : label(value);
}

function countBy<T>(items: T[], getKey: (item: T) => string | null | undefined) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = label(getKey(item));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topEntry(counts: Record<string, number>, fallback: string) {
  const sorted = Object.entries(counts)
    .filter(([key]) => key !== "Unknown")
    .sort((a, b) => b[1] - a[1]);

  return sorted[0] || [fallback, 0];
}

function normaliseKey(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

function providerMatchesService(service: string | null | undefined, business: MayaBusiness) {
  const serviceKey = normaliseKey(service);
  const categoryKey = normaliseKey(business.category);

  if (!serviceKey || !categoryKey) return false;

  return categoryKey === serviceKey;
}

function getActiveProviderCount(service: string, businesses: MayaBusiness[]) {
  return businesses.filter((business) =>
    business.active &&
    business.status === "approved" &&
    providerMatchesService(service, business)
  ).length;
}

function getFirstActiveProviderGap(service: string, businesses: MayaBusiness[]) {
  const activeProviderCount = getActiveProviderCount(service, businesses);
  return Math.max(0, 3 - activeProviderCount);
}

function findSupplyGaps(requests: MayaRequest[], businesses: MayaBusiness[]) {
  const openDemandWithoutSupply = requests
    .filter((request) => request.service)
    .filter((request) => getActiveProviderCount(label(request.service), businesses) === 0)
    .filter((request) => !["completed", "completed_unconfirmed", "cancelled"].includes(request.status || ""));

  const grouped = openDemandWithoutSupply.reduce<Record<string, { service: string; area: string; count: number }>>((acc, request) => {
    const service = label(request.service);
    const area = getPostcodeDistrict(request.postcode || request.area);
    const key = `${service}__${area}`;

    if (!acc[key]) {
      acc[key] = { service, area, count: 0 };
    }

    acc[key].count += 1;
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => b.count - a.count);
}

function CommandRow({ children, index }: { children: string; index: number }) {
  return (
    <div className="flex gap-3 rounded-[14px] bg-white px-3 py-2 text-[13px] font-bold leading-relaxed text-[#46536d] ring-1 ring-[#e1e8f2]">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#071638] text-[11px] font-black text-white">{index + 1}</span>
      <span>{children}</span>
    </div>
  );
}

export default function MayaGrowthPanel({ requests, businesses }: MayaGrowthPanelProps) {
  const completedHappy = requests.filter((request) => request.status === "completed" && ["completed_happy", "customer_confirmed_completed"].includes(request.zayn_status || request.pol_status || ""));
  const issueRequests = requests.filter((request) => request.status === "issue_reported" || request.zayn_status === "needs_review" || request.pol_status === "customer_reported_issue");
  const supplyGaps = findSupplyGaps(requests, businesses);
  const serviceCounts = countBy(requests, (request) => request.service);
  const areaCounts = countBy(requests, (request) => getPostcodeDistrict(request.postcode || request.area));
  const sourceCounts = countBy(requests, (request) => request.source || "manual");
  const [topService] = topEntry(serviceCounts, "Local Helper");
  const [topArea] = topEntry(areaCounts, "Slough");
  const [topSource] = topEntry(sourceCounts, "Manual");
  const sourceRows = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const focusService = supplyGaps[0]?.service || (topService === "Unknown" ? "Local Helper" : topService);
  const focusArea = supplyGaps[0]?.area || (topArea === "Unknown" ? "Slough" : topArea);
  const hasSupplyGaps = supplyGaps.length > 0;
  const todayMode = hasSupplyGaps ? "Provider hunt" : "User hunt";
  const topCommand = hasSupplyGaps
    ? `User growth is blocked. Clear ${supplyGaps.length} supply gap${supplyGaps.length === 1 ? "" : "s"}, then push customers.`
    : `Push ${focusService.toLowerCase()} in ${focusArea} today and get 5 real customer requests.`;
  const proofCommand = issueRequests.length
    ? "Do not use issue jobs as proof. Fix them first."
    : completedHappy.length
      ? "Use the latest happy completed job as proof in posts."
      : "Get one clean completed job so tomorrow’s posts have proof.";

  const userCommands = [
    `Post for ${focusService.toLowerCase()} in ${focusArea} in 3 local Facebook groups. Use /check-price?source=facebook.`,
    "Send the same message to 10 local WhatsApp/community contacts. Use /check-price?source=whatsapp.",
    "Post once on Nextdoor or a local community page. Use /check-price?source=nextdoor.",
    "Turn every reply into a complete Cumar request.",
    "Every request must have a source: facebook, whatsapp, nextdoor, gumtree, instagram, flyer, google, seo or manual.",
  ];

  const supplyCommands = supplyGaps.flatMap((gap, gapIndex) => {
    const neededProviders = Math.max(getFirstActiveProviderGap(gap.service, businesses), 2);
    return [
      `Priority ${gapIndex + 1}: onboard ${neededProviders} ${gap.service.toLowerCase()} providers for ${gap.area}.`,
      `Search Gumtree, Facebook groups and Google Maps for ${gap.service.toLowerCase()} near ${gap.area}.`,
      `Message providers: "Hi, I’m building Quickola in ${gap.area}. We send local ${gap.service.toLowerCase()} jobs to available providers. It is free while we test. You only reply if you want the job. Can I add you for ${gap.area} requests?"`,
      `After adding providers, retest the ${gap.service.toLowerCase()} request in ${gap.area}.`,
    ];
  });

  const proofCommands = [
    proofCommand,
    "Screenshot/save the best happy completion or customer confirmation.",
    "Use proof only when the customer confirmed happy or there was no issue.",
  ];

  const sourceCommands = [
    "Use a different source link for each channel so Maya knows what worked.",
    "Facebook posts use /check-price?source=facebook.",
    "WhatsApp messages use /check-price?source=whatsapp.",
    "Nextdoor posts use /check-price?source=nextdoor.",
    `Current best source: ${topSource}. Repeat it if it produced real requests.`,
  ];

  const customerPost = `Need ${focusService.toLowerCase()} in ${focusArea}? Quickola checks the fair local price first, then helps find an available local provider. No pressure to book. Send your postcode and what you need.`;

  return (
    <section className="rounded-[28px] border border-[#f7d7ef] bg-white p-4 shadow-[0_18px_44px_rgba(7,22,56,0.06)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#c026d3]">Maya</p>
          <h2 className="mt-1 text-[28px] font-black tracking-[-0.06em] text-[#071638]">User growth commands</h2>
        </div>
        <span className="w-fit rounded-full bg-[#fde7ff] px-3 py-1.5 text-[12px] font-black text-[#c026d3]">
          {todayMode}
        </span>
      </div>

      <div className="mt-5 rounded-[24px] border border-[#f7d7ef] bg-[#fff7fd] p-5">
        <p className="text-[12px] font-black uppercase tracking-[0.1em] text-[#c026d3]">Main command</p>
        <h3 className="mt-2 text-[30px] font-black leading-tight tracking-[-0.07em] text-[#071638]">
          {topCommand}
        </h3>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <section className="rounded-[22px] border border-[#dfe7f2] bg-[#f7fbff] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#075cff]">1. Get users</p>
              <h3 className="mt-1 text-[22px] font-black tracking-[-0.05em] text-[#071638]">Customer acquisition</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[12px] font-black text-[#075cff] ring-1 ring-[#dfe7f2]">Main focus</span>
          </div>
          <div className="mt-4 grid gap-2">
            {userCommands.map((item, index) => <CommandRow key={item} index={index}>{item}</CommandRow>)}
          </div>
          <div className="mt-4 rounded-[16px] bg-white p-3 ring-1 ring-[#dfe7f2]">
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#075cff]">Post this</p>
            <textarea
              readOnly
              value={customerPost}
              className="mt-2 min-h-[105px] w-full rounded-[13px] border border-[#e1e8f2] bg-[#fbfdff] px-3 py-2 text-[13px] font-bold leading-relaxed text-[#46536d] outline-none"
            />
          </div>
        </section>

        <section className="rounded-[22px] border border-[#ffd4da] bg-[#fff8f9] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#d4142a]">2. Clear blockers</p>
              <h3 className="mt-1 text-[22px] font-black tracking-[-0.05em] text-[#071638]">Supply gaps</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[12px] font-black text-[#d4142a] ring-1 ring-[#ffd4da]">{supplyGaps.length} active</span>
          </div>

          {supplyGaps.length ? (
            <div className="mt-4 grid gap-2">
              {supplyGaps.map((gap) => (
                <div key={`${gap.service}-${gap.area}`} className="rounded-[14px] bg-white px-3 py-2 text-[13px] font-bold leading-relaxed text-[#46536d] ring-1 ring-[#ffd4da]">
                  <span className="font-black text-[#071638]">{gap.service}</span> in <span className="font-black text-[#071638]">{gap.area}</span> — {gap.count} request{gap.count === 1 ? "" : "s"}, no approved provider.
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-[14px] bg-white px-3 py-2 text-[13px] font-bold text-[#08783f] ring-1 ring-[#cfeedd]">No supply blockers. Push users.</p>
          )}

          {supplyCommands.length ? (
            <div className="mt-4 grid gap-2">
              {supplyCommands.map((item, index) => <CommandRow key={`${index}-${item}`} index={index}>{item}</CommandRow>)}
            </div>
          ) : null}
        </section>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <section className="rounded-[22px] border border-[#e0d4ff] bg-[#f7f2ff] p-4">
          <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#6d28d9]">3. Track source</p>
          <h3 className="mt-1 text-[22px] font-black tracking-[-0.05em] text-[#071638]">Know where users came from</h3>
          <div className="mt-4 grid gap-2">
            {sourceCommands.map((item, index) => <CommandRow key={item} index={index}>{item}</CommandRow>)}
          </div>
          <div className="mt-4 rounded-[16px] bg-white p-3 ring-1 ring-[#e0d4ff]">
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#6d28d9]">Current source count</p>
            <div className="mt-2 grid gap-2">
              {sourceRows.length ? sourceRows.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between rounded-[12px] bg-[#fbfdff] px-3 py-2 text-[13px] font-bold text-[#46536d] ring-1 ring-[#e1e8f2]">
                  <span>{source}</span>
                  <span className="font-black text-[#071638]">{count}</span>
                </div>
              )) : (
                <div className="rounded-[12px] bg-[#fbfdff] px-3 py-2 text-[13px] font-bold text-[#63708a] ring-1 ring-[#e1e8f2]">
                  No sources recorded yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#cfeedd] bg-[#f1fbf5] p-4">
          <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#08783f]">4. Use proof</p>
          <h3 className="mt-1 text-[22px] font-black tracking-[-0.05em] text-[#071638]">Trust asset</h3>
          <div className="mt-4 grid gap-2">
            {proofCommands.map((item, index) => <CommandRow key={item} index={index}>{item}</CommandRow>)}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-[22px] border border-[#f2dfaa] bg-[#fffdf7] p-4">
        <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#8a5a00]">5. End of day</p>
        <h3 className="mt-1 text-[22px] font-black tracking-[-0.05em] text-[#071638]">Record results</h3>
        <div className="mt-4 grid gap-2 xl:grid-cols-3">
          <CommandRow index={0}>Write down how many requests came from each channel.</CommandRow>
          <CommandRow index={1}>Write down how many providers replied yes.</CommandRow>
          <CommandRow index={2}>Tomorrow, repeat the source that produced real requests.</CommandRow>
        </div>
      </section>
    </section>
  );
}
