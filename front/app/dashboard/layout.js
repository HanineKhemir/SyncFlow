import Sidebar from "../components/sidebar/Sidebar";
import "./admin.css";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      
      <aside className="sidebar">
        <Sidebar/>
      </aside>
      
      
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}