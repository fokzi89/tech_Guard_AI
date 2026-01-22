import Link from "next/link";
import { Shield, Zap, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ThemeToggle } from "@/app/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b" style={{borderColor: 'hsl(var(--border))'}}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">TechGuard AI</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fadeIn">
            <Shield className="h-4 w-4" />
            Safety-First AI Troubleshooting
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground animate-slideUp">
            Troubleshoot Industrial Equipment{" "}
            <span className="text-primary">Without the Risk</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: "0.1s" }}>
            AI-powered guidance for field technicians with built-in safety guardrails that actively prevent dangerous procedures before they happen.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-slideUp" style={{ animationDelay: "0.2s" }}>
            <Link href="/auth/login">
              <Button size="lg" className="text-base px-8 py-6 h-auto group">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn" style={{ animationDelay: "0.3s" }}>
            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card border hover:border-primary/50 transition-colors">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Safety Guardian</h3>
              <p className="text-sm text-muted-foreground text-center">
                AI blocks dangerous procedures before they reach technicians
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card border hover:border-primary/50 transition-colors">
              <div className="p-3 rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Instant Diagnostics</h3>
              <p className="text-sm text-muted-foreground text-center">
                Get step-by-step troubleshooting from machine manuals in seconds
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card border hover:border-primary/50 transition-colors">
              <div className="p-3 rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Secure & Compliant</h3>
              <p className="text-sm text-muted-foreground text-center">
                Multi-tenant isolation with complete audit trails for liability
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20" style={{borderColor: 'hsl(var(--border))'}}>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 TechGuard AI. Built with safety in mind.
          </p>
        </div>
      </footer>
    </div>
  );
}
