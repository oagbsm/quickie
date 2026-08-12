export function GET() {
  const body = `# Quickola

> Quickola is an on-demand local services marketplace for customers and professionals.

Quickola helps people post local jobs, receive offers, choose someone, and message participants in one account.

## Public pages
- [Homepage](https://www.quickola.co.uk/): Product overview
- [Services](https://www.quickola.co.uk/services): Local service categories
- [Browse jobs](https://www.quickola.co.uk/jobs): Open local jobs
- [Help](https://www.quickola.co.uk/help): Customer and professional support
- [Privacy](https://www.quickola.co.uk/privacy): Privacy information
- [Terms](https://www.quickola.co.uk/terms): Terms
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
