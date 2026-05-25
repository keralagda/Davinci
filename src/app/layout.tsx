import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Davinci AI - AI-Powered Content Generation Platform",
  description:
    "Davinci AI is an AI-powered content generation platform. Create high-quality content, chat with AI, generate images, write code, and more.",
  keywords: [
    "Davinci AI",
    "AI content generation",
    "AI writer",
    "AI chat",
    "AI image generation",
    "AI code",
    "content platform",
  ],
  authors: [{ name: "Davinci AI Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Davinci AI - AI-Powered Content Generation Platform",
    description:
      "Create high-quality content, chat with AI, generate images, write code, and more with Davinci AI.",
    siteName: "Davinci AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Davinci AI - AI-Powered Content Generation Platform",
    description:
      "Create high-quality content, chat with AI, generate images, write code, and more with Davinci AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
