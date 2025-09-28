import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { Web3Provider } from "@/app/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Verifyfund",
  description: "On-Chain Crowdfunding platform",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/verifyfund-32.png", sizes: "32x32", type: "image/png" },
      { url: "/verifyfund-48.png", sizes: "48x48", type: "image/png" },
      { url: "/verifyfund-64.png", sizes: "64x64", type: "image/png" },
      { url: "/verifyfund-128.png", sizes: "128x128", type: "image/png" },
      { url: "/verifyfund-192.png", sizes: "192x192", type: "image/png" },
      { url: "/verifyfund-256.png", sizes: "256x256", type: "image/png" },
      { url: "/verifyfund-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/verifyfund-192.png", sizes: "192x192", type: "image/png" },
      { url: "/verifyfund-256.png", sizes: "256x256", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (typeof window !== "undefined") {
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === "string" &&
        /Received `false` for a non-boolean attribute `invalid`/.test(args[0])
      ) {
        return;
      }
      originalError(...args);
    };
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Web3Provider>
            <Toaster position="top-right" />
            <main className="min-h-screen bg-background">
              <Navbar />
              {children}
              <Footer />
            </main>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
