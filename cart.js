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
const toastStack = document.querySelector("#toast-stack");

const SINGLE_ITEM_SHIPPING = 100;
const cartHero = document.querySelector(".page-hero-cart");
let toastTimer = null;

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function calculateShipping(itemCount) {
  if (itemCount === 0) {
    return 0;
  }

  return itemCount > 1 ? 0 : SINGLE_ITEM_SHIPPING;
}

function getCustomization(item) {
  return {
    wording: String(item?.customization?.wording || "").trim(),
    colorPreference: String(item?.customization?.colorPreference || "").trim(),
  };
}

function needsWording(item) {
  return AmaraStore.requiresCustomization(item);
}

function showToast(message, tone = "success") {
  if (!toastStack) {
    return;
  }

  toastStack.innerHTML = `<div class="toast toast-${tone}" role="status">${message}</div>`;
  toastStack.classList.add("is-visible");

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(() => {
    toastStack.classList.remove("is-visible");
    toastTimer = window.setTimeout(() => {
      toastStack.innerHTML = "";
    }, 220);
  }, 2200);
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
  const shipping = calculateShipping(itemCount);
  const total = subtotal + shipping;
  const hasMissingWording = items.some((item) => needsWording(item) && !getCustomization(item).wording);

  emptyCart.hidden = items.length > 0;
  cartList.innerHTML = "";
  if (cartHero) {
    cartHero.hidden = items.length > 0;
  }
  checkoutButton.classList.toggle("is-disabled", items.length === 0 || hasMissingWording);
  emailOrderButton.classList.toggle("is-disabled", items.length === 0 || hasMissingWording);

  summaryItems.textContent = String(itemCount);
  summarySubtotal.textContent = AmaraStore.formatPrice(subtotal);
  summaryShipping.textContent = shipping === 0 ? "Free" : AmaraStore.formatPrice(shipping);
  summaryTotal.textContent = AmaraStore.formatPrice(total);
  checkoutButton.href = items.length > 0 && !hasMissingWording ? AmaraStore.cartWhatsAppHref(items) : "#";
  emailOrderButton.href = items.length > 0 && !hasMissingWording ? AmaraStore.cartEmailHref(items) : "#";

  if (items.length === 0) {
    shippingMessage.textContent = "Your cart is ready when you are";
    shippingHelper.textContent = "Add a few Amara pieces to see delivery and checkout details.";
  } else if (hasMissingWording) {
    shippingMessage.textContent = "Add wording for every piece";
    shippingHelper.textContent = "Preferred wording is mandatory before checkout can continue.";
  } else if (shipping === 0) {
    shippingMessage.textContent = "Free delivery unlocked";
    shippingHelper.textContent = "Delivery is complimentary for 2 or more items.";
  } else {
    shippingMessage.textContent = `Delivery charge: ${AmaraStore.formatPrice(SINGLE_ITEM_SHIPPING)}`;
    shippingHelper.textContent = "Add one more item to unlock free delivery.";
  }

  items.forEach((item) => {
    const customization = getCustomization(item);
    const wordingRequired = needsWording(item);
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
        <div class="cart-customization">
          <div class="form-row">
            <label for="wording-${item.id}">${wordingRequired ? "Preferred wording" : "Preferred wording (optional)"}</label>
            <input id="wording-${item.id}" data-wording-input type="text" maxlength="24" value="${escapeAttribute(customization.wording)}" placeholder="${wordingRequired ? "Required" : "Optional"}" />
          </div>
          <div class="form-row">
            <label for="color-${item.id}">Colour preference</label>
            <input id="color-${item.id}" data-color-input type="text" maxlength="40" value="${escapeAttribute(customization.colorPreference)}" placeholder="Optional" />
          </div>
          <div class="cart-customization-actions">
            <button class="text-link" type="button" data-save-customization="true">Save details</button>
            <span class="cart-customization-feedback" data-customization-feedback></span>
          </div>
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
        AmaraStore.updateCartQuantity(item.key, item.quantity + delta);
        renderCartPage();
      });
    });

    row.querySelector('[data-remove="true"]').addEventListener("click", () => {
      AmaraStore.updateCartQuantity(item.key, 0);
      renderCartPage();
    });

    row.querySelector('[data-save-customization="true"]').addEventListener("click", () => {
      const wording = row.querySelector("[data-wording-input]").value.trim();
      const colorPreference = row.querySelector("[data-color-input]").value.trim();
      const feedback = row.querySelector("[data-customization-feedback]");
      const saved = AmaraStore.updateCartCustomization(item.key, { wording, colorPreference });

      if (!saved) {
        feedback.textContent = wordingRequired ? "Preferred wording is required." : "Could not save details.";
        feedback.classList.add("is-error");
        row.querySelector("[data-wording-input]").focus();
        showToast(wordingRequired ? "Preferred wording is required." : "Could not save details.", "error");
        return;
      }

      feedback.textContent = "Saved";
      feedback.classList.remove("is-error");
      showToast("Details saved to cart.");
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
  const items = AmaraStore.getDetailedCart();
  if (items.length === 0 || items.some((item) => needsWording(item) && !getCustomization(item).wording)) {
    event.preventDefault();
  }
});

emailOrderButton.addEventListener("click", (event) => {
  const items = AmaraStore.getDetailedCart();
  if (items.length === 0 || items.some((item) => needsWording(item) && !getCustomization(item).wording)) {
    event.preventDefault();
  }
});

renderCartPage();
