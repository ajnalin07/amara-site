const cartList = document.querySelector("#cart-list");
const emptyCart = document.querySelector("#empty-cart");
const summaryItems = document.querySelector("#summary-items");
const summarySubtotal = document.querySelector("#summary-subtotal");
const summaryShipping = document.querySelector("#summary-shipping");
const summaryTotal = document.querySelector("#summary-total");
const clearCartButton = document.querySelector("#clear-cart");
const checkoutButton = document.querySelector("#checkout-button");
const emailOrderButton = document.querySelector("#email-order-button");
const shippingMessage = document.querySelector("#shipping-message");
const shippingHelper = document.querySelector("#shipping-helper");
const recommendedGrid = document.querySelector("#recommended-grid");
const recommendationsSection = document.querySelector("#cart-recommendations");
const modalController = AmaraStore.createModalController();

const FREE_SHIPPING_THRESHOLD = 120;
const STANDARD_SHIPPING = 8;

function calculateShipping(subtotal, itemCount) {
  if (itemCount === 0) {
    return 0;
  }

  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}

function updateRecommendations(items) {
  const cartIds = new Set(items.map((item) => item.id));
  const recommendations = AmaraStore.getProducts()
    .filter((product) => product.purchasable && !cartIds.has(product.id))
    .slice(0, 3);

  recommendationsSection.hidden = recommendations.length === 0;

  if (recommendations.length > 0) {
    AmaraStore.bindProductGrid(recommendedGrid, recommendations, modalController, {
      showCategory: true,
      afterAdd: () => renderCartPage(),
    });
  } else {
    recommendedGrid.innerHTML = "";
  }
}

function renderCartPage() {
  const items = AmaraStore.getDetailedCart();
  const subtotal = AmaraStore.getCartSubtotal();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = calculateShipping(subtotal, itemCount);
  const total = subtotal + shipping;

  emptyCart.hidden = items.length > 0;
  cartList.innerHTML = "";
  checkoutButton.classList.toggle("is-disabled", items.length === 0);
  emailOrderButton.classList.toggle("is-disabled", items.length === 0);

  summaryItems.textContent = String(itemCount);
  summarySubtotal.textContent = AmaraStore.formatPrice(subtotal);
  summaryShipping.textContent = shipping === 0 ? "Free" : AmaraStore.formatPrice(shipping);
  summaryTotal.textContent = AmaraStore.formatPrice(total);
  checkoutButton.href = items.length > 0 ? AmaraStore.cartWhatsAppHref(items) : "#";
  emailOrderButton.href = items.length > 0 ? AmaraStore.cartEmailHref(items) : "#";

  if (items.length === 0) {
    shippingMessage.textContent = "Your cart is ready when you are";
    shippingHelper.textContent = "Add a few Amara pieces to see delivery and checkout details.";
  } else if (shipping === 0) {
    shippingMessage.textContent = "Free shipping unlocked";
    shippingHelper.textContent = "Your order now qualifies for complimentary shipping.";
  } else {
    const amountLeft = FREE_SHIPPING_THRESHOLD - subtotal;
    shippingMessage.textContent = `Free shipping unlocks at ${AmaraStore.formatPrice(FREE_SHIPPING_THRESHOLD)}`;
    shippingHelper.textContent = `Add ${AmaraStore.formatPrice(amountLeft)} more to unlock complimentary shipping.`;
  }

  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "cart-item";
    row.innerHTML = `
      <img class="cart-item-image" src="${encodeURI(item.image)}" alt="${item.name}" />
      <div class="cart-item-copy">
        <p class="cart-item-category">${item.categoryLabel}</p>
        <h2>${item.name}</h2>
        <p>${item.description}</p>
        <div class="cart-item-meta">
          <span>Hand-dyed boutique finish</span>
          <span>Order conversation available on WhatsApp</span>
        </div>
      </div>
      <div class="cart-item-actions">
        <div class="cart-price-block">
          <span class="cart-price-label">Each</span>
          <strong>${AmaraStore.formatPrice(item.price)}</strong>
        </div>
        <div class="qty-stepper">
          <button type="button" data-change="-1">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-change="1">+</button>
        </div>
        <div class="cart-price-block">
          <span class="cart-price-label">Subtotal</span>
          <span class="line-total">${AmaraStore.formatPrice(item.lineTotal)}</span>
        </div>
        <button class="text-link danger-link" type="button" data-remove="true">Remove</button>
      </div>
    `;

    row.querySelectorAll("[data-change]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = Number(button.dataset.change);
        AmaraStore.updateCartQuantity(item.id, item.quantity + delta);
        renderCartPage();
      });
    });

    row.querySelector('[data-remove="true"]').addEventListener("click", () => {
      AmaraStore.updateCartQuantity(item.id, 0);
      renderCartPage();
    });

    cartList.appendChild(row);
  });

  updateRecommendations(items);
}

clearCartButton.addEventListener("click", () => {
  AmaraStore.clearCart();
  renderCartPage();
});

checkoutButton.addEventListener("click", (event) => {
  if (AmaraStore.getDetailedCart().length === 0) {
    event.preventDefault();
  }
});

emailOrderButton.addEventListener("click", (event) => {
  if (AmaraStore.getDetailedCart().length === 0) {
    event.preventDefault();
  }
});

renderCartPage();
