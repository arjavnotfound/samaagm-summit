import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/Home";
import Register from "@/pages/Register";
import MUN from "@/pages/MUN";
import NotFound from "@/pages/not-found";
import { LoadingScreen } from "@/components/LoadingScreen";

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
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

  return (
    <QueryClientProvider client={queryClient}>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <ScrollToTop />
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
