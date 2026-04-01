(function () {
  const CART_KEY = "amara-cart-v1";

  function getProducts() {
    return window.AMARA_PRODUCTS || [];
  }

  function findProduct(productId) {
    return getProducts().find((product) => product.id === Number(productId));
  }

  function formatPrice(price) {
    if (price == null) {
      return "Editorial";
    }

    return `$${price}`;
  }

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function getCartCount() {
    return readCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  function addToCart(productId, quantity = 1) {
    const product = findProduct(productId);

    if (!product || !product.purchasable) {
      return;
    }

    const cart = readCart();
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ id: product.id, quantity });
    }

    writeCart(cart);
    syncCartCount();
  }

  function updateCartQuantity(productId, quantity) {
    const cart = readCart();
    const nextQuantity = Math.max(0, quantity);
    const index = cart.findIndex((item) => item.id === Number(productId));

    if (index === -1) {
      return;
    }

    if (nextQuantity === 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = nextQuantity;
    }

    writeCart(cart);
    syncCartCount();
  }

  function clearCart() {
    writeCart([]);
    syncCartCount();
  }

  function getDetailedCart() {
    return readCart()
      .map((item) => {
        const product = findProduct(item.id);
        if (!product) {
          return null;
        }

        return {
          ...product,
          quantity: item.quantity,
          lineTotal: product.price == null ? null : product.price * item.quantity,
        };
      })
      .filter(Boolean);
  }

  function getCartSubtotal() {
    return getDetailedCart().reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  }

  function syncCartCount() {
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = String(getCartCount());
    });
  }

  function setActiveNav() {
    const currentPage = document.body.dataset.page;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === currentPage) {
        link.classList.add("is-active");
      }
    });
  }

  function inquiryText(product) {
    return `Hello Amara, I would like details about ${product.name}${product.price != null ? ` (${formatPrice(product.price)})` : ""}. Please share availability, customization options, and next steps for ordering.`;
  }

  function inquiryHref(product) {
    const subject = encodeURIComponent(`Amara inquiry: ${product.name}`);
    const body = encodeURIComponent(inquiryText(product));
    return `mailto:hello@amara-placeholder.com?subject=${subject}&body=${body}`;
  }

  function productCardMarkup(product, options = {}) {
    const actions = product.purchasable
      ? `
        <button class="button button-primary" data-action="add-cart" data-product-id="${product.id}" type="button">Add to Cart</button>
        <button class="button button-secondary" data-action="quick-view" data-product-id="${product.id}" type="button">Quick View</button>
      `
      : `
        <button class="button button-primary" data-action="quick-view" data-product-id="${product.id}" type="button">View Story</button>
        <a class="button button-secondary" href="./contact.html">Ask About Custom Sets</a>
      `;

    const label = options.showCategory === false ? "" : `<p class="product-category">${product.categoryLabel}</p>`;

    return `
      <article class="product-card">
        <div class="product-visual">
          <img src="${encodeURI(product.image)}" alt="${product.name}" loading="lazy" />
          <span class="product-tag">${product.tag}</span>
        </div>
        <div class="product-body">
          <div class="product-meta">
            ${label}
            <span class="product-price">${formatPrice(product.price)}</span>
          </div>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-description">${product.description}</p>
          <div class="product-actions">
            ${actions}
          </div>
        </div>
      </article>
    `;
  }

  function bindProductGrid(grid, list, modalController, options = {}) {
    grid.innerHTML = list.map((product) => productCardMarkup(product, options)).join("");

    grid.querySelectorAll('[data-action="add-cart"]').forEach((button) => {
      button.addEventListener("click", () => {
        addToCart(button.dataset.productId, 1);
        button.textContent = "Added";
      });
    });

    grid.querySelectorAll('[data-action="quick-view"]').forEach((button) => {
      button.addEventListener("click", () => {
        const product = findProduct(button.dataset.productId);
        if (product && modalController) {
          modalController.open(product);
        }
      });
    });
  }

  function createModalController() {
    const modal = document.querySelector("#product-modal");
    if (!modal) {
      return null;
    }

    const modalImage = modal.querySelector("#modal-image");
    const modalCategory = modal.querySelector("#modal-category");
    const modalName = modal.querySelector("#modal-name");
    const modalPrice = modal.querySelector("#modal-price");
    const modalDescription = modal.querySelector("#modal-description");
    const modalAddCart = modal.querySelector("#modal-add-cart");
    const modalInquire = modal.querySelector("#modal-inquire");
    const modalMessage = modal.querySelector("#modal-message");
    let activeProduct = null;

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
      activeProduct = null;
    }

    function open(product) {
      activeProduct = product;
      modalImage.src = encodeURI(product.image);
      modalImage.alt = product.name;
      modalCategory.textContent = product.categoryLabel;
      modalName.textContent = product.name;
      modalPrice.textContent = formatPrice(product.price);
      modalDescription.textContent = product.description;
      modalMessage.textContent = inquiryText(product);
      modalInquire.href = inquiryHref(product);

      if (product.purchasable) {
        modalAddCart.hidden = false;
        modalAddCart.textContent = "Add to Cart";
      } else {
        modalAddCart.hidden = true;
      }

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-locked");
    }

    modal.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", close);
    });

    if (modalAddCart) {
      modalAddCart.addEventListener("click", () => {
        if (!activeProduct) {
          return;
        }
        addToCart(activeProduct.id, 1);
        modalAddCart.textContent = "Added";
      });
    }

    return { open, close };
  }

  syncCartCount();
  setActiveNav();

  window.AmaraStore = {
    getProducts,
    findProduct,
    formatPrice,
    readCart,
    addToCart,
    updateCartQuantity,
    clearCart,
    getDetailedCart,
    getCartSubtotal,
    syncCartCount,
    inquiryHref,
    inquiryText,
    bindProductGrid,
    createModalController,
  };
})();
