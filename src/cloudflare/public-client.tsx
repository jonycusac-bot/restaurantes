import { hydrateRoot } from "react-dom/client";
import InchMenu from "../app/inch/InchMenu";
import { parseDraft } from "../lib/inch-draft";
const dishes = parseDraft(document.getElementById("inch-menu-data")?.textContent ?? "");
if (dishes) hydrateRoot(document.getElementById("inch-root")!, <InchMenu publishedDishes={dishes} publicOnly />);
