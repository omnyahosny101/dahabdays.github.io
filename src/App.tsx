import { useEffect } from "react";
import { Footer, Nav } from "./components/ui";
import { DepthGauge, Splash, useRevealAll } from "./components/brand";
import { Quiz } from "./components/extras";
import { StoreProvider, useRoute, useStore } from "./lib/store";
import { I18nProvider } from "./lib/i18n";
import { initAnalytics, track } from "./lib/analytics";
import Home from "./pages/Home";
import Catalog, { Contact, Gallery } from "./pages/Catalog";
import Book, { Thanks } from "./pages/Book";
import Admin from "./pages/Admin";
import { Account, Blog, Manage, PostView } from "./pages/Guest";

function Shell() {
  const [route] = useRoute();
  const { ready, settings } = useStore();
  useRevealAll(route);
  useEffect(() => {
    // returning from Paymob: ?r=thanks&success=true…
    if (new URLSearchParams(location.search).get("r") === "thanks" && location.hash !== "#thanks") location.hash = "thanks";
  }, []);
  useEffect(() => { if (ready) initAnalytics(settings.pixelId, settings.ga4Id); }, [ready, settings.pixelId, settings.ga4Id]);
  useEffect(() => { if (route !== "admin") track("PageView"); }, [route]);
  const overlay = ["home", "courses", "dives", "trips", "rentals", "gallery", "manage", "account", "blog", "post"].includes(route);
  return (
    <>
      <Nav route={route} overlay={overlay} />
      <main className={ready ? "" : "opacity-95"}>
        {route === "home" && <Home />}
        {route === "courses" && <Catalog category="course" />}
        {route === "dives" && <Catalog category="fun" />}
        {route === "trips" && <Catalog category="tour" />}
        {route === "rentals" && <Catalog category="rental" />}
        {route === "gallery" && <Gallery />}
        {route === "contact" && <Contact />}
        {route === "book" && <Book />}
        {route === "thanks" && <Thanks />}
        {route === "manage" && <Manage />}
        {route === "account" && <Account />}
        {route === "blog" && <Blog />}
        {route === "post" && <PostView />}
        {route === "quiz" && <div className="bg-foam pb-20 pt-28"><div className="wrap max-w-2xl"><Quiz /></div></div>}
        {route === "admin" && <Admin />}
      </main>
      {route !== "admin" && <Footer />}
      {["home", "courses", "dives", "trips", "gallery"].includes(route) && <DepthGauge />}
      <Splash />
    </>
  );
}

function WithI18n() {
  const { settings } = useStore();
  return <I18nProvider fallbackRates={settings.rates}><Shell /></I18nProvider>;
}

export default function App() {
  return <StoreProvider><WithI18n /></StoreProvider>;
}
