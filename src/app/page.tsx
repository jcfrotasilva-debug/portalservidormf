import { AcessoPlataforma } from "@/components/acesso-plataforma";
import { Audience } from "@/components/audience";
import { BenefitsSimulator } from "@/components/benefits-simulator";
import { Diagnosis } from "@/components/diagnosis";
import { Faq } from "@/components/faq";
import { FinalCta } from "@/components/final-cta";
import { Hero } from "@/components/hero";
import { Implementation } from "@/components/implementation";
import { ModulesGrid } from "@/components/modules-grid";
import { Security } from "@/components/security";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatsBand } from "@/components/stats-band";

export default function Home() {
  return (
    <div className="app-shell min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <div className="relative py-14 sm:py-16">
          <StatsBand />
        </div>
        <AcessoPlataforma />
        <Diagnosis />
        <Audience />
        <BenefitsSimulator />
        <ModulesGrid />
        <Security />
        <Implementation />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
