import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CardCreator from "./pages/CardCreator";
import Events from "./pages/Events";
import Contacts from "./pages/Contacts";
import SendInvites from "./pages/SendInvites";
import QrScanner from "./pages/QrScanner";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import RsvpPage from "./pages/RsvpPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cards" element={<CardCreator />} />
          <Route path="/events" element={<Events />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/send" element={<SendInvites />} />
          <Route path="/qr-scanner" element={<QrScanner />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/rsvp/:invitationId" element={<RsvpPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
