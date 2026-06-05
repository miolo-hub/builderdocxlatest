import { DashboardPreview } from "./DashboardPreview";
import { FeatureSpotlights } from "./FeatureSpotlights";
import { FeaturesOverview } from "./FeaturesOverview";
import { FinalCTA } from "./FinalCTA";
import { HeroSection } from "./HeroSection";
import { InventoryShowcase } from "./InventoryShowcase";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { StickySectionNav } from "./StickySectionNav";
import { WhyBuiltSection } from "./WhyBuiltSection";

export function LandingPage() {
  return (
    <div
      className="landing-page min-h-screen"
      style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
    >
      <LandingNav />
      <StickySectionNav />
      <HeroSection />
      <FeaturesOverview />
      <WhyBuiltSection />
      <InventoryShowcase />
      <FeatureSpotlights />
      <DashboardPreview />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
