const featuredGrid = document.querySelector("#featured-grid");

const featuredProducts = [
  ...AmaraStore.getProducts().filter((product) => product.category === "tote" && product.purchasable).slice(0, 3),
  ...AmaraStore.getProducts().filter((product) => product.category === "scarf" && product.purchasable).slice(0, 3),
];
AmaraStore.bindProductGrid(featuredGrid, featuredProducts, null);
