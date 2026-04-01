const cartList = document.querySelector("#cart-list");
const emptyCart = document.querySelector("#empty-cart");
const summaryItems = document.querySelector("#summary-items");
const summarySubtotal = document.querySelector("#summary-subtotal");
const summaryTotal = document.querySelector("#summary-total");
const clearCartButton = document.querySelector("#clear-cart");
const checkoutButton = document.querySelector("#checkout-button");

function renderCartPage() {
  const items = AmaraStore.getDetailedCart();
  const subtotal = AmaraStore.getCartSubtotal();

  emptyCart.hidden = items.length > 0;
  cartList.innerHTML = "";

  summaryItems.textContent = String(items.reduce((sum, item) => sum + item.quantity, 0));
  summarySubtotal.textContent = AmaraStore.formatPrice(subtotal);
  summaryTotal.textContent = AmaraStore.formatPrice(subtotal);

  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "cart-item";
    row.innerHTML = `
      <img class="cart-item-image" src="${encodeURI(item.image)}" alt="${item.name}" />
      <div class="cart-item-copy">
        <p class="cart-item-category">${item.categoryLabel}</p>
        <h2>${item.name}</h2>
        <p>${item.description}</p>
      </div>
      <div class="cart-item-actions">
        <strong>${AmaraStore.formatPrice(item.price)}</strong>
        <div class="qty-stepper">
          <button type="button" data-change="-1">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-change="1">+</button>
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
}

clearCartButton.addEventListener("click", () => {
  AmaraStore.clearCart();
  renderCartPage();
});

checkoutButton.addEventListener("click", () => {
  checkoutButton.textContent = "Placeholder Checkout Ready";
});

renderCartPage();
