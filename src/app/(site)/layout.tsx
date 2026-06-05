import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Public marketing/site chrome. The dashboard uses its own shell instead.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
