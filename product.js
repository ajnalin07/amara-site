const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const product = slug ? AmaraStore.findProductBySlug(slug) : null;

const productPage = document.querySelector("#product-page");
const notFound = document.querySelector("#product-not-found");
const relatedSection = document.querySelector("#related-section");
const relatedGrid = document.querySelector("#related-grid");

if (!product) {
  notFound.hidden = false;
} else {
  const detailImage = document.querySelector("#detail-image");
  const detailCategory = document.querySelector("#detail-category");
  const detailName = document.querySelector("#detail-name");
  const detailPrice = document.querySelector("#detail-price");
  const detailDescription = document.querySelector("#detail-description");
  const detailAddCart = document.querySelector("#detail-add-cart");
  const detailWhatsApp = document.querySelector("#detail-whatsapp");
  const detailEmail = document.querySelector("#detail-email");

  productPage.hidden = false;
  document.title = `${product.name} | Amara`;

  detailImage.src = encodeURI(product.image);
  detailImage.alt = product.name;
  detailCategory.textContent = product.categoryLabel;
  detailName.textContent = product.name;
  detailPrice.textContent = AmaraStore.formatPrice(product.price);
  detailDescription.textContent = product.description;
  detailWhatsApp.href = AmaraStore.inquiryHref(product);
  detailEmail.href = AmaraStore.inquiryEmailHref(product);

  if (product.purchasable) {
    detailAddCart.addEventListener("click", () => {
      AmaraStore.addToCart(product.id, 1);
      detailAddCart.textContent = "Added to Cart";
    });
  } else {
    detailAddCart.textContent = "Editorial Feature";
    detailAddCart.disabled = true;
    detailAddCart.classList.add("is-disabled");
  }

  const relatedProducts = AmaraStore.getRelatedProducts(product, 3);
  relatedSection.hidden = relatedProducts.length === 0;

  if (relatedProducts.length > 0) {
    AmaraStore.bindProductGrid(relatedGrid, relatedProducts, null);
  }
}
