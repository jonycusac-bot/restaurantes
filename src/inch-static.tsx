import { hydrateRoot } from "react-dom/client";
import InchMenu from "./app/inch/InchMenu";

const root = document.getElementById("inch-root");
if (root) hydrateRoot(root, <InchMenu />);
