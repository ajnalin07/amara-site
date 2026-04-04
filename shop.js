const shopGrid = document.querySelector("#shop-grid");
const shopEmpty = document.querySelector("#shop-empty");
const filterButtons = document.querySelectorAll("#shop-filters .filter-pill");

let activeFilter = "all";

function emptyStateMarkup(filter) {
  if (filter === "scarf") {
    return `
      <h3>Scarves are ready to be added next.</h3>
      <p>Add scarf photos into <code>assets/scarves</code> and we can publish them as customizable products immediately.</p>
    `;
  }

  return `
    <h3>No pieces are showing in this filter yet.</h3>
    <p>Try another category while we keep expanding the collection.</p>
  `;
}

function renderShop() {
  const products =
    activeFilter === "all"
      ? AmaraStore.getProducts()
      : AmaraStore.getProducts().filter((product) => product.category === activeFilter);

  shopEmpty.hidden = products.length > 0;

  if (products.length === 0) {
    shopGrid.innerHTML = "";
    shopEmpty.innerHTML = emptyStateMarkup(activeFilter);
    return;
  }

  AmaraStore.bindProductGrid(shopGrid, products, null);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    renderShop();
  });
});

renderShop();
