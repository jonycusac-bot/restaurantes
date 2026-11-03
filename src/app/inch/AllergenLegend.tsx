/* Static Cloudflare assets: no Next image server is used. */
/* eslint-disable @next/next/no-img-element */
import type { Language } from "./translations";
import { allergenLegend, allergenLegendTitles } from "../../lib/allergen-legend";

export default function AllergenLegend({language}:{language:Language}) {
 return <section className="inch-allergenLegend" lang={language} aria-labelledby="inch-allergenLegend-title">
  <h2 id="inch-allergenLegend-title">{allergenLegendTitles[language]}</h2>
  <ul className="inch-allergenGrid">
   {allergenLegend.map(allergen=><li key={allergen.id} data-allergen-id={allergen.id}>
    <img src={allergen.icon} alt="" width="56" height="56" loading="lazy" />
    <span>{allergen.labels[language]}</span>
   </li>)}
  </ul>
 </section>;
}
