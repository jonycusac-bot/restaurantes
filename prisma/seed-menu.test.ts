import assert from "node:assert/strict";
import test from "node:test";
import { seedMenu, type SeedClient, type SeedUpsertArgs } from "./seed-menu";

test("seeding twice upserts the same menu without deleting existing records", async () => {
  const records = new Map<string, string>();
  let nextId = 1;
  const operations: string[] = [];
  const delegate = (model: string) => ({
    upsert: async (args: SeedUpsertArgs) => {
      const key = `${model}:${JSON.stringify(args.where)}`;
      let id = records.get(key);
      if (!id) {
        id = `${model}-${nextId++}`;
        records.set(key, id);
        operations.push(`create:${model}`);
      } else {
        operations.push(`update:${model}`);
      }
      return { id };
    },
  });

  const db = {
    restaurant: delegate("restaurant"),
    category: delegate("category"),
    dish: delegate("dish"),
    allergen: delegate("allergen"),
    dishAllergen: delegate("dishAllergen"),
  } as unknown as SeedClient;

  await seedMenu(db);
  const firstCount = records.size;
  await seedMenu(db);

  assert.equal(firstCount, 15);
  assert.equal(records.size, firstCount);
  assert.equal(operations.filter((operation) => operation.startsWith("create:")).length, 15);
  assert.equal(operations.filter((operation) => operation.startsWith("update:")).length, 15);
  assert.equal(operations.some((operation) => operation.startsWith("delete:")), false);
});
