import { prisma } from "@/lib/prisma";

export async function GET(): Promise<Response> {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: "burger-co-central" },
      include: {
        categories: {
          orderBy: { sortOrder: "asc" },
          include: {
            dishes: {
              orderBy: { price: "asc" },
              include: {
                allergens: {
                  orderBy: { allergen: { code: "asc" } },
                  select: {
                    presence: true,
                    allergen: { select: { code: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!restaurant) {
      return Response.json(
        { error: "No se encontró el restaurante de prueba." },
        { status: 404 },
      );
    }

    return Response.json(restaurant, { status: 200 });
  } catch (error) {
    console.error("Error al consultar el menú:", error);
    return Response.json(
      { error: "No se pudo cargar el menú." },
      { status: 500 },
    );
  }
}
