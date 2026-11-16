import { NextResponse } from "next/server";

const PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>TAAB — Maintenance</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff;color:#111;font-family:Georgia,'Times New Roman',serif">
<main style="max-width:28rem;padding:2rem;text-align:center">
<p style="margin:0;letter-spacing:.16em;text-transform:uppercase;font-size:.8rem">TAAB</p>
<h1 style="margin:1rem 0 .75rem;font-size:2.25rem;font-weight:500">Maintenance</h1>
<p style="margin:0;font-size:1.125rem;line-height:1.5">Le site est momentanément hors service.</p>
<p style="margin:.75rem 0 0;font-size:1rem;line-height:1.5;color:#444">The site is temporarily unavailable.</p>
</main>
</body>
</html>`;

/** Temporary hold. Remove this file to serve the site again. Nothing else was deleted. */
export function middleware() {
  return new NextResponse(PAGE, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": "3600",
      "x-robots-tag": "noindex",
    },
  });
}

export const config = {
  matcher: ["/((?!\\.well-known).*)"],
};
