
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Cuisine from "./pages/Cuisine";
import Confirmation from "./pages/Confirmation";
import NotFound from "./pages/NotFound";
import Panier from "./pages/Panier";
import SuiviCommande from "./pages/SuiviCommande";
import Historique from "./pages/Historique";
import HistoriqueAuth from "./pages/HistoriqueAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cuisine" element={<Cuisine />} />
          <Route path="/historique" element={<Historique />} />
          <Route path="/historique-auth" element={<HistoriqueAuth />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/panier" element={<Panier />} />
          <Route path="/suivi" element={<SuiviCommande />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
