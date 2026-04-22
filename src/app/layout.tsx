import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/lib/gameContext";
import { RPGProvider } from "@/lib/rpgContext";
import { KarmaProvider } from "@/lib/karmaContext";
import { AuthProvider } from "@/lib/authContext";
import { SaveLoadProvider } from "@/lib/saveLoadContext";
import { CrossGameProgressionProvider } from "@/lib/crossGameProgressionContext";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Back of Beyond Ranch | Gold Country Vacation Rental with EV Charging",
  description: "60-acre mountain retreat in Gold Country, California. Solar-powered EV charging, hot tub, 6 bedrooms, sleeps 12. Near Kirkwood, Bear Valley & Sierra-at-Tahoe ski resorts. Play the Golden Frog Trail adventure game.",
  keywords: [
    "vacation rental", "Gold Country", "Kirkwood", "cabin", "EV charging",
    "Airbnb", "Calaveras County", "Bear Valley", "Sierra-at-Tahoe",
    "hot tub", "pet friendly", "ranch", "West Point California",
    "adventure", "treasure hunt", "Golden Frog Trail",
  ],
  metadataBase: new URL("https://backofbeyondranch.farm"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Back of Beyond Ranch | Gold Country Vacation Rental with EV Charging",
    description: "60-acre mountain retreat near 3 ski resorts. Solar-powered EV charger, hot tub, game room, ranch animals. Sleeps 12 in Gold Country, CA.",
    url: "https://backofbeyondranch.farm",
    siteName: "Back of Beyond Ranch",
    images: [
      {
        url: "/cabin-photos/cabin-1.jpg",
        width: 1200,
        height: 630,
        alt: "Back of Beyond Ranch - Mountain cabin in Gold Country, California",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Back of Beyond Ranch | Gold Country Vacation Rental",
    description: "60-acre mountain retreat near 3 ski resorts. Solar-powered EV charger, hot tub, sleeps 12.",
    images: ["/cabin-photos/cabin-1.jpg"],
    creator: "@BackBeyondRanch",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "VacationRental",
      "@id": "https://backofbeyondranch.farm/#vacation-rental",
      name: "Back of Beyond Ranch",
      description: "A 60-acre mountain retreat in the heart of California Gold Country. Features a solar-powered Level 2 EV charger, hot tub, game room with pool table, ranch animals (horses, emus, sheep, chickens), fishing lakes, mountain bikes, fire pit, BBQ, canoe, and hiking trails. Located near Kirkwood (48 mi), Bear Valley (57 mi), and Sierra-at-Tahoe (75 mi) ski resorts.",
      url: "https://backofbeyondranch.farm",
      image: "https://backofbeyondranch.farm/cabin-photos/cabin-1.jpg",
      address: {
        "@type": "PostalAddress",
        addressLocality: "West Point",
        addressRegion: "CA",
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 38.3965,
        longitude: -120.5269,
      },
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Solar-powered Level 2 EV charger (220V)", value: true },
        { "@type": "LocationFeatureSpecification", name: "Hot tub", value: true },
        { "@type": "LocationFeatureSpecification", name: "Game room with pool table", value: true },
        { "@type": "LocationFeatureSpecification", name: "Fishing lakes", value: true },
        { "@type": "LocationFeatureSpecification", name: "Mountain bikes", value: true },
        { "@type": "LocationFeatureSpecification", name: "Fire pit", value: true },
        { "@type": "LocationFeatureSpecification", name: "BBQ grill", value: true },
        { "@type": "LocationFeatureSpecification", name: "Canoe", value: true },
        { "@type": "LocationFeatureSpecification", name: "Hiking trails", value: true },
        { "@type": "LocationFeatureSpecification", name: "Ranch animals (horses, emus, sheep, chickens)", value: true },
      ],
      numberOfBedrooms: 6,
      numberOfBathroomsTotal: 3,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: 4.85,
        reviewCount: 268,
        bestRating: 5,
      },
      occupancy: {
        "@type": "QuantitativeValue",
        value: 12,
      },
      petsAllowed: true,
    },
    {
      "@type": "FAQPage",
      "@id": "https://backofbeyondranch.farm/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "Does Back of Beyond Ranch have EV charging?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Back of Beyond Ranch has a solar-powered Level 2 (220V) EV charger available for guests. It can fully charge most electric vehicles overnight. The charger is powered by the ranch's solar panel system.",
          },
        },
        {
          "@type": "Question",
          name: "How far is Back of Beyond Ranch from Kirkwood ski resort?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Kirkwood Mountain Resort is approximately 48 miles from the ranch, about a 45-minute drive via Highway 88. It's the closest major ski resort to the property.",
          },
        },
        {
          "@type": "Question",
          name: "What ski resorts are near Back of Beyond Ranch?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Three ski resorts are within driving range: Kirkwood Mountain Resort (48 miles, ~45 min), Bear Valley Mountain Resort (57 miles, ~1 hr), and Sierra-at-Tahoe (75 miles, ~1.5 hr). All three are reachable on a single EV charge from the ranch.",
          },
        },
        {
          "@type": "Question",
          name: "How many guests can Back of Beyond Ranch accommodate?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The ranch accommodates up to 12 guests across 6 bedrooms and 3 bathrooms. The property sits on 10 private acres in Gold Country, California.",
          },
        },
        {
          "@type": "Question",
          name: "Is Back of Beyond Ranch pet friendly?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, Back of Beyond Ranch is pet friendly. The 60-acre property gives dogs plenty of room to explore. The ranch also has its own animals including horses, emus, sheep, and chickens.",
          },
        },
        {
          "@type": "Question",
          name: "What is the Golden Frog Trail?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The Golden Frog Trail is an interactive Gold Rush adventure game built into the ranch's website. Guests can play online before their stay or explore QR-code-based challenges on the property. It features a karma system where your in-game choices can earn real booking discounts.",
          },
        },
      ],
    },
    {
      "@type": "Organization",
      "@id": "https://backofbeyondranch.farm/#organization",
      name: "Back of Beyond Ranch",
      url: "https://backofbeyondranch.farm",
      logo: "https://backofbeyondranch.farm/cabin-photos/cabin-1.jpg",
      sameAs: [
        "https://airbnb.com/h/backofbeyondranch",
        "https://x.com/BackBeyondRanch",
      ],
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <KarmaProvider>
            <CrossGameProgressionProvider>
              <SaveLoadProvider>
                <GameProvider>
                  <RPGProvider>
                    {children}
                  </RPGProvider>
                </GameProvider>
              </SaveLoadProvider>
            </CrossGameProgressionProvider>
          </KarmaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
