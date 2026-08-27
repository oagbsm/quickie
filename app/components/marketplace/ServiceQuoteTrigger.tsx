"use client";

import { OPEN_SERVICE_QUOTE_EVENT } from "./ServiceQuotePanel";

export default function ServiceQuoteTrigger({ children, className }: { children: React.ReactNode; className: string }) { return <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent(OPEN_SERVICE_QUOTE_EVENT))}>{children}</button>; }
