import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/useAuth";
import { i18n } from "@/lib/i18n";
import { useEffect } from "react";

// Pages
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import MedicineSearch from "@/pages/medicine-search";
import AIConsultation from "@/pages/ai-consultation";
import Profile from "@/pages/profile";
import HelpCenter from "@/pages/help-center";
import ContactSupport from "@/pages/contact-support";
import PrescriptionAnalysis from "@/pages/prescription-analysis";
import SymptomChecker from "@/pages/symptom-checker";
import TermsOfService from "@/pages/legal/terms-of-service";
import PrivacyPolicy from "@/pages/legal/privacy-policy";
import MedicalDisclaimer from "@/pages/legal/medical-disclaimer";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import Settings from "@/pages/settings";
import PharmacyManagement from "@/pages/pharmacy-management";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/auth/login" component={LoginPage} />
          <Route path="/auth/register" component={RegisterPage} />
          <Route path="/medicine-search" component={MedicineSearch} />
          <Route path="/medicines" component={MedicineSearch} />
          <Route path="/ai-consultation" component={AIConsultation} />
          <Route path="/consultation" component={AIConsultation} />
          <Route path="/orders" component={Orders} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/profile" component={Profile} />
          <Route path="/help-center" component={HelpCenter} />
          <Route path="/help" component={HelpCenter} />
          <Route path="/contact-support" component={ContactSupport} />
          <Route path="/contact" component={ContactSupport} />
          <Route path="/prescription-analysis" component={PrescriptionAnalysis} />
          <Route path="/symptom-checker" component={SymptomChecker} />
          <Route path="/legal/terms" component={TermsOfService} />
          <Route path="/legal/privacy" component={PrivacyPolicy} />
          <Route path="/legal/disclaimer" component={MedicalDisclaimer} />
          <Route path="/settings" component={Settings} />
          <Route path="/pharmacy-management" component={PharmacyManagement} />
          <Route path="/pharmacy" component={PharmacyManagement} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize i18n
    i18n.init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
