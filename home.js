const modalController = AmaraStore.createModalController();
const featuredGrid = document.querySelector("#featured-grid");

const featuredProducts = AmaraStore.getProducts().slice(0, 6);
AmaraStore.bindProductGrid(featuredGrid, featuredProducts, modalController);
