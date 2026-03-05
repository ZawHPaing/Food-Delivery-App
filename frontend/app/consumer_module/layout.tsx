import TopBanner from "@/components/ui/TopBanner";
import Header from "@/components/ui/Header";

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBanner />
      <Header />
      {children}
    </>
  );
}
