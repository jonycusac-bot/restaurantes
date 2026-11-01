// Read-only acceptance on the isolated local menu preview (never saves data).
window.checkGlobalSearch = async () => {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  check(location.origin === "http://127.0.0.1:4173", "Solo QA local");
  const input = document.querySelector(".inch-search input");
  const type = async value => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 100));
  };
  await type("tom kha");
  check([...document.querySelectorAll(".inch-category h2")].map(node => node.textContent).join(" ").includes("Sopas"), "Sopas aparece desde Entrantes");
  check([...document.querySelectorAll(".inch-dish h3")].some(node => node.textContent.includes("Tom Kha")), "Tom Kha aparece");
  await type("pollo");
  check(document.querySelectorAll(".inch-category").length > 1, "Coincidencias agrupadas en varias categorías");
  check(!!document.querySelector(".inch-searchScope"), "Búsqueda global indicada");
  await type("inch roll");
  check([...document.querySelectorAll(".inch-category h2")].map(node => node.textContent).join(" ").includes("Uramaki"), "Sushi aparece desde Carta");
  check([...document.querySelectorAll(".inch-dish h3")].some(node => node.textContent === "Inch Roll"), "Inch Roll aparece");
  await type("no-existe-un-plato-asi");
  check(document.querySelectorAll(".inch-category").length === 0 && !!document.querySelector(".inch-empty"), "Cero resultados globales");
  await type("");
  check([...document.querySelectorAll(".inch-category h2")].map(node => node.textContent).join(" ") === "Entrantes", "Se restaura la sección activa");
  document.getElementById("inch-tab-sushi").click();
  await new Promise(resolve => setTimeout(resolve, 100));
  await type("tom kha");
  check([...document.querySelectorAll(".inch-category h2")].some(node => node.textContent.includes("Sopas")), "Carta aparece desde Sushi");
  return { passed: true, readOnly: true, crossSection: true, sushi: true, reverse: true, empty: true, reset: true };
};
