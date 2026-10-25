export type SeedUpsertArgs = {
  where: Record<string, unknown>;
  update: Record<string, unknown>;
  create: Record<string, unknown>;
};

type SeedDelegate = {
  upsert(args: SeedUpsertArgs): Promise<{ id: string }>;
};

export type SeedClient = {
  restaurant: SeedDelegate;
  category: SeedDelegate;
  dish: SeedDelegate;
  allergen: SeedDelegate;
  dishAllergen: SeedDelegate;
};

const restaurantData = {
  slug: "burger-co-central",
  name: "Burger & Co. Central",
  currency: "EUR",
};

const categoryData = [
  { slug: "hamburguesas-gourmet", name: "Hamburguesas Gourmet", sortOrder: 1 },
  { slug: "bebidas-refrescos", name: "Bebidas y Refrescos", sortOrder: 2 },
];

const allergenData = {
  GLUTEN: "Gluten",
  MILK: "Lácteos",
  EGG: "Huevo",
} as const;

const dishData = [
  {
    slug: "burger-la-bestia",
    categorySlug: "hamburguesas-gourmet",
    name: "Burger La Bestia",
    description: "200 g de carne madurada, cheddar, bacon crujiente y salsa de la casa.",
    price: "12.90",
    sortOrder: 1,
    allergens: ["GLUTEN", "MILK"],
  },
  {
    slug: "crispy-chicken-burger",
    categorySlug: "hamburguesas-gourmet",
    name: "Crispy Chicken Burger",
    description: "Pollo crujiente, lechuga, tomate y mayonesa ahumada.",
    price: "10.50",
    sortOrder: 2,
    allergens: ["GLUTEN", "EGG"],
  },
  {
    slug: "papas-fritas-trufadas",
    categorySlug: "hamburguesas-gourmet",
    name: "Papas Fritas Trufadas",
    description: "Patatas rústicas con aceite de trufa y parmesano.",
    price: "5.50",
    sortOrder: 3,
    allergens: ["MILK"],
  },
  {
    slug: "refresco-de-cola",
    categorySlug: "bebidas-refrescos",
    name: "Refresco de Cola",
    description: "Lata de 33 cl servida fría con limón.",
    price: "2.50",
    sortOrder: 1,
    allergens: [],
  },
];

export async function seedMenu(db: SeedClient): Promise<void> {
  const restaurant = await db.restaurant.upsert({
    where: { slug: restaurantData.slug },
    update: { name: restaurantData.name, currency: restaurantData.currency },
    create: restaurantData,
  });

  const categoryIds = new Map<string, string>();
  for (const category of categoryData) {
    const saved = await db.category.upsert({
      where: {
        restaurantId_slug: { restaurantId: restaurant.id, slug: category.slug },
      },
      update: { name: category.name, sortOrder: category.sortOrder, isActive: true },
      create: { ...category, restaurantId: restaurant.id, isActive: true },
    });
    categoryIds.set(category.slug, saved.id);
  }

  const allergenIds = new Map<string, string>();
  for (const dish of dishData) {
    const categoryId = categoryIds.get(dish.categorySlug);
    if (!categoryId) throw new Error(`Categoría no encontrada: ${dish.categorySlug}`);

    const savedDish = await db.dish.upsert({
      where: {
        restaurantId_slug: { restaurantId: restaurant.id, slug: dish.slug },
      },
      update: {
        categoryId,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        sortOrder: dish.sortOrder,
        isAvailable: true,
      },
      create: {
        restaurantId: restaurant.id,
        categoryId,
        slug: dish.slug,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        sortOrder: dish.sortOrder,
        isAvailable: true,
      },
    });

    for (const code of dish.allergens) {
      let allergenId = allergenIds.get(code);
      if (!allergenId) {
        const name = allergenData[code as keyof typeof allergenData];
        const allergen = await db.allergen.upsert({
          where: { code },
          update: { name },
          create: { code, name },
        });
        allergenId = allergen.id;
        allergenIds.set(code, allergenId);
      }

      await db.dishAllergen.upsert({
        where: {
          restaurantId_dishId_allergenId: {
            restaurantId: restaurant.id,
            dishId: savedDish.id,
            allergenId,
          },
        },
        update: { presence: "CONTAINS" },
        create: {
          restaurantId: restaurant.id,
          dishId: savedDish.id,
          allergenId,
          presence: "CONTAINS",
        },
      });
    }
  }
}
