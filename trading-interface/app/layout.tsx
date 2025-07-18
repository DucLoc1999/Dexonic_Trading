import type { Metadata } from "next";
import Providers from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dexonic - Trading Assistant",
  description: "Advanced trading platform with AI-powered insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full w-full">
      <body className="font-montserrat min-w-full min-h-full w-full h-full overflow-auto">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
