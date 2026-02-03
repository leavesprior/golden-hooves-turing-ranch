import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/lib/gameContext";
import { RPGProvider } from "@/lib/rpgContext";
import { KarmaProvider } from "@/lib/karmaContext";
import { AuthProvider } from "@/lib/authContext";
import { SaveLoadProvider } from "@/lib/saveLoadContext";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Golden Frog Trail | Gold Country Adventure",
  description: "Embark on a 16-bit adventure at Back of Beyond Ranch. Play the Golden Frog Trail, explore Gold Country, hunt for treasure, and book your mountain retreat.",
  keywords: ["vacation rental", "Gold Country", "Kirkwood", "cabin", "adventure", "treasure hunt", "Golden Frog Trail"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={pressStart2P.variable}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <KarmaProvider>
            <SaveLoadProvider>
              <GameProvider>
                <RPGProvider>
                  {children}
                </RPGProvider>
              </GameProvider>
            </SaveLoadProvider>
          </KarmaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
