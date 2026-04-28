import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Curhat from "./pages/Curhat.tsx";
import Diskusi from "./pages/Diskusi.tsx";
import AmanPak from "./pages/AmanPak.tsx";
import Komunitas from "./pages/Komunitas.tsx";
import Inbox from "./pages/Inbox.tsx";
import Profil from "./pages/Profil.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/curhat" element={<Curhat />} />
          <Route path="/diskusi" element={<Diskusi />} />
          <Route path="/aman-pak" element={<AmanPak />} />
          <Route path="/komunitas" element={<Komunitas />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/profil" element={<Profil />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
