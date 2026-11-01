import { menuSections, type Category, type Dish, type MenuSection } from "./menu";

const normalize = (text: string) => text.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function visibleMenuCategories(menuCategories: Category[], section: MenuSection, active: string, search: string, searchText: (dish: Dish) => string): Category[] {
  const query = normalize(search.trim());
  const ids = query ? menuSections.flatMap(s => s.categoryIds) : menuSections.find(s => s.id === section)!.categoryIds.filter(id => id === active);
  return ids.map(id => menuCategories.find(c => c.id === id)).filter((c): c is Category => Boolean(c)).map(c => ({
    ...c,
    dishes: query ? c.dishes.filter(d => normalize(searchText(d)).includes(query)) : c.dishes,
  })).filter(c => !query || c.dishes.length > 0);
}
