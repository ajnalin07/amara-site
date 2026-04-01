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
  const detailCartControls = document.querySelector("#detail-cart-controls");
  const detailWhatsApp = document.querySelector("#detail-whatsapp");
  const detailEmail = document.querySelector("#detail-email");

  function renderDetailCartControls() {
    if (!product.purchasable) {
      detailCartControls.innerHTML = '<button class="button button-ghost is-disabled" type="button" disabled>Editorial Feature</button>';
      return;
    }

    const quantity = AmaraStore.getCartItemQuantity(product.id);

    if (quantity > 0) {
      detailCartControls.innerHTML = `
        <div class="detail-qty" data-product-id="${product.id}">
          <button class="detail-qty-button" type="button" data-detail-change="-1" aria-label="Decrease quantity">−</button>
          <div class="detail-qty-copy">
            <strong>${quantity}</strong>
            <span>in cart</span>
          </div>
          <button class="detail-qty-button" type="button" data-detail-change="1" aria-label="Increase quantity">+</button>
        </div>
      `;

      detailCartControls.querySelectorAll("[data-detail-change]").forEach((button) => {
        button.addEventListener("click", () => {
          const delta = Number(button.dataset.detailChange);
          AmaraStore.updateCartQuantity(product.id, quantity + delta);
          renderDetailCartControls();
        });
      });

      return;
    }

    detailCartControls.innerHTML = '<button class="button button-primary" id="detail-add-cart" type="button">Add to Cart</button>';
    detailCartControls.querySelector("#detail-add-cart").addEventListener("click", () => {
      AmaraStore.addToCart(product.id, 1);
      renderDetailCartControls();
    });
  }

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
  renderDetailCartControls();

  const relatedProducts = AmaraStore.getRelatedProducts(product, 3);
  relatedSection.hidden = relatedProducts.length === 0;

  if (relatedProducts.length > 0) {
    AmaraStore.bindProductGrid(relatedGrid, relatedProducts, null);
  }
}
