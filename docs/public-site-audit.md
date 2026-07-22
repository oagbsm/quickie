# Public website audit matrix — 22 July 2026

| Route/group | Current purpose and audience | Previous CTA/problem | Intended CTA | Action |
|---|---|---|---|---|
| `/` | Explain Quickola to business property operators | Broad service catalogue; limited solution pathways; incomplete mobile navigation | Request business access | Rewrite |
| `/business` | Legacy business landing page | Claims open account creation and future services despite controlled registration | Request business access | Redirect to homepage |
| `/product` | Missing platform evaluation page | Product capabilities only implied on homepage | Request business access | Create |
| `/solutions/*` | Missing audience evaluation pages | No focused route for agents, short lets or offices | Request business access | Create three distinct routes |
| `/how-it-works` | Missing process page | Managed fulfilment not explained beyond a short homepage row | Request business access | Create |
| `/service-area` | Missing coverage explanation | Slough limitation only appears in fragments | Request business access | Create |
| `/business/enquire` | Controlled qualification flow | Sound protected backend; CTA/copy says request cleaning rather than request access; errors not associated with fields | Submit access request | Retain backend, improve UI |
| `/business/sign-in` | Customer authentication | Sparse metadata and old registration link copy | Sign in | Retain and polish |
| `/about`, `/trust-safety` | Company and operational trust | Useful claims, inconsistent navigation/metadata | Request business access | Retain and align |
| Consumer cleaning routes | Historic SEO/booking pages | Conflicting individual-cleaning proposition | Request business access | Keep permanent redirects |
| `/contact` | Existing customer/general support | Visually inconsistent and duplicates new-business enquiry | Send support message | Retain for support; link prospects to enquiry |
| Legal routes | Privacy, terms, cancellation, cookies | Duplicate `/terms`; inconsistent shells and canonical metadata | Relevant legal navigation | Retain canonical routes; redirect duplicate |
| Protected business/admin/provider routes | Customer and operational systems | Must not be marketed as public or indexed | Sign in where applicable | Preserve and noindex/disallow |
| `/not-found` | Recovery | Links back through retired consumer routes and says “Book cleaning” | Return home / request access | Rewrite |

## Cross-cutting findings

- Positioning was partly corrected but the public architecture still resembled a single long landing page.
- Mobile users had no access to the full primary navigation.
- Canonicals and unique route metadata were inconsistent; sitemap used a host inconsistent with `metadataBase`.
- Credibility should come from implemented lifecycle controls, secure accounts and controlled coverage rather than unsupported proof points.
- Existing enquiry honeypot, validation, rate limiting, idempotency, database recording and Telegram notification flow are appropriate and must remain intact.
