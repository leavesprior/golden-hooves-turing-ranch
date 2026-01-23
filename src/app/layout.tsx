import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/lib/gameContext";
import { RPGProvider } from "@/lib/rpgContext";
import { KarmaProvider } from "@/lib/karmaContext";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Back of Beyond Ranch | Gold Country Adventure",
  description: "Embark on a 16-bit adventure at Back of Beyond Ranch. Explore Gold Country, hunt for treasure, and book your mountain retreat.",
  keywords: ["vacation rental", "Gold Country", "Kirkwood", "cabin", "adventure", "treasure hunt"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={pressStart2P.variable}>
      <body className="antialiased">
        <KarmaProvider>
          <GameProvider>
            <RPGProvider>
              {children}
            </RPGProvider>
          </GameProvider>
        </KarmaProvider>
      </body>
    </html>
  );
}
