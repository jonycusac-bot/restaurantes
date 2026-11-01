import assert from "node:assert/strict";
import test from "node:test";
import { initialDraft, type AdminDish } from "../src/lib/inch-draft";
import { menuSections } from "../src/app/inch/menu";
import { approvedSushiDishes } from "../src/lib/sushi-release";
import { publicHtml } from "../src/cloudflare/html";

const sushiIds = new Set(menuSections.find(section => section.id === "sushi")!.categoryIds);
const old: AdminDish[] = [
  { id: "entradas-0", categoryId: "entradas", name: "Edamame", description: "", price: 6, hidden: false, imageSrc: `/media/${"a".repeat(64)}.webp`, imageName: "edamame.webp" },
  { id: "sashimi-0", categoryId: "sashimi", name: "Sashimi de salmón", description: "", price: 12, hidden: false, imageSrc: "/inch/sashimi.webp", imageName: "sashimi.webp" },
  { id: "nigiris-0", categoryId: "nigiris", name: "Nigiri de salmón", description: "", price: 6.45, hidden: false, imageSrc: "", imageName: "Sin imagen" },
  { id: "uramaki-0", categoryId: "uramaki", name: "Uramaki de salmón", description: "", price: 13, hidden: false, imageSrc: "/inch/uramaki.webp", imageName: "uramaki.webp" },
  { id: "uramaki-1", categoryId: "uramaki", name: "California Roll", description: "Aguacate, pepino y bocas de mar.", price: 11, hidden: false, imageSrc: "/inch/california-roll.webp", imageName: "california-roll.webp" },
  { id: "uramaki-2", categoryId: "uramaki", name: "Inch Roll", description: "", price: 17.6, hidden: false, imageSrc: "", imageName: "Sin imagen" },
  { id: "uramaki-3", categoryId: "uramaki", name: "Langostino Tempura Roll", description: "Langostino en tempura, kimchi, tobico y aguacate.", price: 14.45, hidden: false, imageSrc: "", imageName: "Sin imagen" },
  { id: "owner-tartar", categoryId: "tartar", name: "Tartar Shushi", description: "", price: 9, hidden: false, imageSrc: `/media/${"b".repeat(64)}.jpg`, imageName: "tartar.jpg" },
  { id: "owner-poke", categoryId: "poke", name: "Poke Bowls", description: "", price: 10, hidden: false, imageSrc: `/media/${"c".repeat(64)}.jpg`, imageName: "poke.jpg" },
];
const carta = initialDraft.filter(dish => !sushiIds.has(dish.categoryId)).map((dish, index) => index === 0 ? { ...dish, price: 11.11 } : dish);
const published = [...carta, ...old];

test("Sushi nuevo usa 56 importes sin alterar CARTA ni perder fotos de los platos identificados", () => {
  const result = approvedSushiDishes(published, published);
  assert.deepEqual(result.filter(dish => !sushiIds.has(dish.categoryId)), carta);
  const visible = result.filter(dish => sushiIds.has(dish.categoryId) && !dish.hidden);
  assert.equal(visible.length, 56);
  for (const dish of old.filter(dish => ["entradas-0", "sashimi-0", "nigiris-0", "uramaki-0", "uramaki-1", "uramaki-3"].includes(dish.id))) {
    const next = visible.find(item => item.id === dish.id)!;
    assert.equal(next.imageSrc, dish.imageSrc);
    assert.equal(next.imageName, dish.imageName);
  }
  assert.equal(visible.find(dish => dish.id === "uramaki-1")!.name, "Uramaki California");
  assert.equal(visible.find(dish => dish.id === "uramaki-3")!.name, "Uramaki de Langostino en Tempura");
  assert.ok(visible.every(dish => !dish.imageSrc || old.some(previous => previous.id === dish.id && previous.imageSrc === dish.imageSrc)), "No asignar fotos a platos nuevos por semejanza");
  assert.equal(new Set(result.map(dish => dish.id)).size, result.length);
});

test("las fichas antiguas no solicitadas quedan ocultas con sus fotos intactas, no borradas ni reasignadas", () => {
  const result = approvedSushiDishes(published, published);
  const archived = result.filter(dish => sushiIds.has(dish.categoryId) && dish.hidden);
  assert.deepEqual(archived.map(dish => dish.id), ["uramaki-2", "owner-tartar", "owner-poke"]);
  for (const dish of archived) assert.deepEqual(dish, { ...old.find(previous => previous.id === dish.id)!, hidden: true });
  const html = publicHtml(result);
  assert.doesNotMatch(html, /<h3>Tartar Shushi<\/h3>|<h3>Poke Bowls<\/h3>|<h3>Inch Roll<\/h3>/);
  assert.match(html, /Tartar de Salmón/);
});

test("no mezcla un borrador distinto ni reutiliza una ID que el dueño ya ocupó", () => {
  assert.throws(() => approvedSushiDishes(published.map(dish => dish.id === "owner-tartar" ? { ...dish, price: 7 } : dish), published), /cambio|distinto|pendiente/i);
  const target = initialDraft.find(dish => dish.name === "Tartar de Salmón")!;
  const collision = { ...old[7], id: target.id, name: "Otro plato" };
  assert.throws(() => approvedSushiDishes([...published, collision], [...published, collision]), /ID|identidad|colisi[oó]n/i);
});

test("renombrar Edamame (sin entrada en oldNames) bloquea la sustitución para evitar sobrescribir una edición real", () => {
  const renamedEdamame = published.map(dish => dish.id === "entradas-0" ? { ...dish, name: "Edamame con Sal" } : dish);
  assert.throws(() => approvedSushiDishes(renamedEdamame, renamedEdamame), /identidad|colisi[oó]n/i);
});
