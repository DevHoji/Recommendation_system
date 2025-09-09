import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/contexts/UserContext";

export const metadata: Metadata = {
  title: "CineAI - AI-Powered Movie Recommendations",
  description: "Discover your next favorite movie with AI-powered recommendations, voice search, and personalized suggestions.",
  keywords: ["movies", "recommendations", "AI", "voice search", "cinema", "films"],
  authors: [{ name: "CineAI Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="font-sans antialiased bg-black text-white min-h-screen"
      >
        <UserProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                border: '1px solid #374151',
              },
            }}
          />
        </UserProvider>
      </body>
    </html>
  );
}
