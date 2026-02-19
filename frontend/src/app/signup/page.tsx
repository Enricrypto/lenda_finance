import BackgroundAmbience from "@/components/landing/BackgroundAmbience";
import LendaLogo from "@/components/landing/LendaLogo";
import FeatureCard from "@/components/landing/FeatureCard";
import TrustBadges from "@/components/landing/TrustBadges";
import SignupCard from "@/components/landing/SignupCard";

const FEATURES = [
  {
    icon: "solar:safe-square-linear",
    title: "Collateral-backed borrowing",
    description: "Secure loans instantly against your verified assets.",
  },
  {
    icon: "solar:chart-2-linear",
    title: "Real-time portfolio dashboard",
    description: "Monitor LTV ratios and liquidation thresholds live.",
  },
  {
    icon: "solar:wallet-money-linear",
    title: "Yield + credit tracking",
    description: "Earn on deposits while accessing flexible credit lines.",
  },
] as const;

export default function SignupPage() {
  return (
    <div className="bg-[#030305] text-slate-300 antialiased min-h-screen flex flex-col justify-center selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden relative">
      <BackgroundAmbience />

      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-24 items-center h-full py-12">
        {/* Left Panel: Marketing */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-12">
          {/* Brand + Headline */}
          <div className="space-y-6">
            <LendaLogo />

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.15]">
              Real-world collateral <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-400">
                lending infrastructure.
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
              Deposit assets, borrow credit, and track your financial position
              in real time.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-5">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>

          {/* Trust badges */}
          <TrustBadges />
        </div>

        {/* Right Panel: Signup */}
        <div className="lg:col-span-5">
          <SignupCard />
        </div>
      </main>
    </div>
  );
}
