import { Outlet } from "react-router-dom";
import { LinksProvider } from "../dashboard/LinksProvider";
import Header from "./Header";
import Sidebar from "./Sidebar";

function DashboardLayout() {
  return (
    <LinksProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="min-h-screen pb-20 lg:ml-64 lg:pb-0">
          <Header />
          <main className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </LinksProvider>
  );
}

export default DashboardLayout;
