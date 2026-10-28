import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../src/app/api/menu/route";

test("GET /api/menu returns the test restaurant with price-sorted dishes", async () => {
  const response = await GET();
  assert.equal(response.status, 200);

  const menu = (await response.json()) as {
    slug: string;
    categories: Array<{
      dishes: Array<{ price: string | number }>;
    }>;
  };

  assert.equal(menu.slug, "burger-co-central");
  assert.equal(menu.categories.length, 2);
  assert.equal(menu.categories.reduce((sum, category) => sum + category.dishes.length, 0), 4);

  for (const category of menu.categories) {
    const prices = category.dishes.map((dish) => Number(dish.price));
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  }
});

test("GET /api/menu includes recorded allergen names, codes and presence for each dish", async () => {
  const response = await GET();
  assert.equal(response.status, 200);
  const menu = await response.json() as {
    categories: Array<{ dishes: Array<{
      slug: string;
      allergens: Array<{ presence: "CONTAINS" | "MAY_CONTAIN"; allergen: { code: string; name: string } }>;
    }> }>;
  };
  const dishes = menu.categories.flatMap((category) => category.dishes);
  for (const dish of dishes) assert.ok(Array.isArray(dish.allergens), `${dish.slug} must include allergens`);
  const burger = dishes.find((dish) => dish.slug === "burger-la-bestia");
  assert.ok(burger);
  assert.deepEqual(burger.allergens, [
    { presence: "CONTAINS", allergen: { code: "GLUTEN", name: "Gluten" } },
    { presence: "CONTAINS", allergen: { code: "MILK", name: "Lácteos" } },
  ]);
  assert.deepEqual(dishes.find((dish) => dish.slug === "refresco-de-cola")?.allergens, []);
});
