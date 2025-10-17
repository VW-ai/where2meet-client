export async function GET() {
  const robotsTxt = `# *
User-agent: *
Allow: /

# Host
Host: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://where2meet.app'}

# Sitemaps
Sitemap: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://where2meet.app'}/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
