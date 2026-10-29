import { hydrateRoot } from "react-dom/client";
import AdminPreview from "./app/admin/preview/AdminPreview";
import LoginForm from "./app/admin/LoginForm";
const root = document.getElementById("admin-root")!;
hydrateRoot(root, root.dataset.mode === "admin" ? <AdminPreview /> : <LoginForm />);
