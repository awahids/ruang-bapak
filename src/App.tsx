import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AuthProvider } from "@/contexts/AuthContext";
import { useRealtimeInbox } from "@/hooks/use-realtime";
import Index from "./pages/Index.tsx";
import Curhat from "./pages/Curhat.tsx";
import Diskusi from "./pages/Diskusi.tsx";
import AmanPak from "./pages/AmanPak.tsx";
import Komunitas from "./pages/Komunitas.tsx";
import Inbox from "./pages/Inbox.tsx";
import Conversation from "./pages/Conversation.tsx";
import Moderasi from "./pages/Moderasi.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Profil from "./pages/Profil.tsx";
import Auth from "./pages/Auth.tsx";
import PostDetail from "./pages/PostDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const RealtimeSync = () => {
  useRealtimeInbox();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <RealtimeSync />
          <Routes>
            {/* Public: signing in, signing up and finishing a password reset */}
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Everything else needs an account */}
            <Route element={<RequireAuth />}>
              <Route path="/" element={<Index />} />
              <Route path="/curhat" element={<Curhat />} />
              <Route path="/diskusi" element={<Diskusi />} />
              <Route path="/aman-pak" element={<AmanPak />} />
              <Route path="/komunitas" element={<Komunitas />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/inbox/:conversationId" element={<Conversation />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/u/:username" element={<Profil />} />
              <Route path="/post/:postId" element={<PostDetail />} />
              <Route path="/moderasi" element={<Moderasi />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
