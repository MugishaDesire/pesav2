
import { useRouter } from "expo-router";
import { useApp } from "../lib/AppContext";
import Dashboard from "../screens/Dashboard";
import Welcome from "../screens/Welcome";

export default function Home() {
  const app = useApp();
  const router = useRouter();


  const go = (path: string) => router.push(path as never);

  if (!app.user) {
    return <Welcome onLogin={() => go("/login")} onDemo={app.loadDemoData} />;
  }
  return <Dashboard go={go} />;
}
