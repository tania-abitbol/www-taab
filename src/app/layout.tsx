import type { Metadata } from "next";
import { Roboto, Lexend_Deca, Pacifico, Baloo_2 } from "next/font/google";

import "./globals.css";
import { ClientTracking } from "./ClientTracking";

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-baloo",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto",
});
const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-lexend-deca",
});

export const metadata: Metadata = {
  title: "TAAB Studio",
  description:
    "TAAB Studio, le studio de création d'applications mobile de divertissements",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${roboto.variable} ${lexendDeca.variable} ${pacifico.variable} ${baloo.variable}`}
      >
        <ClientTracking />
        {children}
      </body>
    </html>
  );
}
