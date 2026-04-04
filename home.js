const featuredGrid = document.querySelector("#featured-grid");

const featuredProducts = AmaraStore.getProducts()
  .filter((product) => product.purchasable)
  .slice(0, 6);
AmaraStore.bindProductGrid(featuredGrid, featuredProducts, null);
