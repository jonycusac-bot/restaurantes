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
