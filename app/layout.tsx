import type { Metadata, Viewport } from "next";
import { Albert_Sans, JetBrains_Mono } from "next/font/google";
import { SceneBackground } from "@/components/scene-background";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { site } from "@/content/site";
import "./globals.css";

// A free, close match for Aeonik Pro. To use Aeonik itself once you hold a
// licence, load its .woff2 with next/font/local under the same variable.
const display = Albert_Sans({ variable: "--font-display", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · ${site.roles[0].replace(/\.$/, "")}`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.description },
};

export const viewport: Viewport = {
  themeColor: "#07040d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${display.variable} ${jetbrains.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-fg focus:px-3 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        <SceneBackground />
        <SiteNav />
        <div className="relative z-[1] mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pb-6 sm:px-4">
          <main id="content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
