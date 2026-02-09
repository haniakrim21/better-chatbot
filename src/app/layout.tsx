import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import {
  ThemeProvider,
  ThemeStyleProvider,
} from "@/components/layouts/theme-provider";
import { Toaster } from "ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { BackgroundAnimated } from "@/components/background-animated";
import { ThesysProvider } from "@/components/thesys-provider";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Nabd | Pulse of AI",
  description: "Nabd (Pulse) is your advanced AI workspace.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          themes={["light", "dark"]}
          storageKey="app-theme-v2"
          disableTransitionOnChange
        >
          <ThemeStyleProvider>
            <NextIntlClientProvider messages={messages}>
              <ThesysProvider>
                <BackgroundAnimated />
                <div id="root" className="relative z-10">
                  {children}
                  <Toaster richColors />
                </div>
              </ThesysProvider>
            </NextIntlClientProvider>
          </ThemeStyleProvider>
        </ThemeProvider>
        <Script id="markdown-it-isspace-patch" strategy="beforeInteractive">
          {`
            if (typeof window !== 'undefined') {
              window.isSpace = function(code) {
                return code === 0x09 || code === 0x20;
              };
            }
          `}
        </Script>
      </body>
    </html>
  );
}
