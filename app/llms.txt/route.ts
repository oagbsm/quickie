export function GET() {
  const body = `# Quickola

> Quickola is STR turnover coordination software for operators who already have their own cleaners or cleaning contractors.

Quickola helps operators add properties, save property-specific turnover standards, invite their existing cleaners, create and assign turnovers, track progress, collect checklist evidence, handle operational issues, and verify when a property is guest-ready.

Quickola does not supply, source, vet or employ cleaners. It is not a cleaner marketplace. It does not set cleaning rates, collect payment for cleaning or manage cleaner payouts.

Core promise: Know every property is ready before the next guest arrives.

## Public pages
- [Homepage](https://www.quickola.co.uk/): Product overview
- [Product](https://www.quickola.co.uk/product): Full manual turnover flow and direct product answers
- [Create account](https://www.quickola.co.uk/business/sign-up): Owner account creation
- [Sign in](https://www.quickola.co.uk/business/sign-in): Existing owner or cleaner access
- [Privacy](https://www.quickola.co.uk/privacy): Privacy information
- [Terms](https://www.quickola.co.uk/terms): Terms
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
