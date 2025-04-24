import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { ModeProvider } from '@/contexts/ModeContext';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import Debug from '@/pages/Debug';
import ConflictTest from '@/pages/ConflictTest';
import TestMapping from '@/pages/TestMapping';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="light" storageKey="voter-tool-theme">
        <ModeProvider>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/debug" element={<Debug />} />
              <Route path="/test/conflicts" element={<ConflictTest />} />
              <Route path="/test/mapping" element={<TestMapping />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </QueryClientProvider>
        </ModeProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
