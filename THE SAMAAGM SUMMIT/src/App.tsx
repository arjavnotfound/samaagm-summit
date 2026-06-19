import { useState, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/Home";
import Register from "@/pages/Register";
import MUN from "@/pages/MUN";
import NotFound from "@/pages/not-found";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useLenis, lenisScrollTop } from "@/hooks/use-lenis";

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    lenisScrollTop(true);
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function RouteCurtain() {
  const [location] = useLocation();
  const [play, setPlay] = useState(false);
  const firstRef = useRef(true);
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPlay(false);
    const raf = requestAnimationFrame(() => setPlay(true));
    const t = setTimeout(() => setPlay(false), 980);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [location]);
  return (
    <div className={`rt-curtain${play ? " rt-curtain--play" : ""}`} aria-hidden>
      <span className="rt-curtain-mark">TSS</span>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/event" component={Register} />
      <Route path="/mun" component={MUN} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [loaded, setLoaded] = useState(false);
  useLenis();

  return (
    <QueryClientProvider client={queryClient}>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <ScrollToTop />
        <RouteCurtain />
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
