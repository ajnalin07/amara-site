const shopGrid = document.querySelector("#shop-grid");
const filterButtons = document.querySelectorAll("#shop-filters .filter-pill");

let activeFilter = "all";

function renderShop() {
  const products =
    activeFilter === "all"
      ? AmaraStore.getProducts()
      : AmaraStore.getProducts().filter((product) => product.category === activeFilter);

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
