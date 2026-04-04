(function () {
  const CART_KEY = "amara-cart-v1";
  const AMARA_EMAIL = "garimabang18@gmail.com";
  const AMARA_WHATSAPP = "918769081934";
  const AMARA_INSTAGRAM = "https://www.instagram.com/garima_bang_/";

  function getProducts() {
    return window.AMARA_PRODUCTS || [];
  }

  function findProduct(productId) {
    return getProducts().find((product) => product.id === Number(productId));
  }

  function findProductBySlug(slug) {
    return getProducts().find((product) => product.slug === slug);
  }

  function getRelatedProducts(product, limit = 3) {
    if (!product) {
      return [];
    }

    const sameCategory = getProducts().filter(
      (item) => item.id !== product.id && item.category === product.category
    );
    const fallback = getProducts().filter((item) => item.id !== product.id);

    return [...sameCategory, ...fallback].slice(0, limit);
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

  function normalizeCustomization(customization = {}) {
    return {
      wording: String(customization.wording || "").trim(),
      colorPreference: String(customization.colorPreference || "").trim(),
    };
  }

  function customizationSignature(productId, customization = {}) {
    const normalizedCustomization = normalizeCustomization(customization);
    return [
      Number(productId),
      normalizedCustomization.wording.toLowerCase(),
      normalizedCustomization.colorPreference.toLowerCase(),
    ].join("::");
  }

  function createCartKey(productId, customization = {}) {
    return customizationSignature(productId, customization);
  }

  function findCartEntryByKey(cartKey) {
    return readCart().find((item) => item.key === cartKey) || null;
  }

  function findCartEntriesByProduct(productId) {
    return readCart().filter((item) => item.id === Number(productId));
  }

  function findCartEntry(productId, customization = null) {
    if (customization) {
      const key = createCartKey(productId, customization);
      return findCartEntryByKey(key);
    }

    const entries = findCartEntriesByProduct(productId);
    return entries.length > 0 ? entries[entries.length - 1] : null;
  }

  function getCartCount() {
    return readCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  function getCartItemQuantity(productId) {
    return findCartEntriesByProduct(productId).reduce((sum, item) => sum + item.quantity, 0);
  }

  function getCartCustomization(productId) {
    const entry = findCartEntry(productId);
    return normalizeCustomization(entry?.customization);
  }

  function getCartVariant(productId, customization = {}) {
    const entry = findCartEntry(productId, customization);
    return entry
      ? {
          key: entry.key,
          quantity: entry.quantity,
          customization: normalizeCustomization(entry.customization),
        }
      : null;
  }

  function addToCart(productId, quantity = 1, customization = {}) {
    const product = findProduct(productId);
    const normalizedCustomization = normalizeCustomization(customization);
    const cartKey = createCartKey(productId, normalizedCustomization);

    if (!product || !product.purchasable || !normalizedCustomization.wording) {
      return;
    }

    const cart = readCart();
    const existing = cart.find((item) => item.key === cartKey);

    if (existing) {
      existing.quantity += quantity;
      existing.customization = normalizedCustomization;
    } else {
      cart.push({
        key: cartKey,
        id: product.id,
        quantity,
        customization: normalizedCustomization,
      });
    }

    writeCart(cart);
    syncCartCount();
  }

  function updateCartQuantity(cartKey, quantity) {
    const cart = readCart();
    const nextQuantity = Math.max(0, quantity);
    const index = cart.findIndex(
      (item) => item.key === cartKey || (item.key == null && item.id === Number(cartKey))
    );

    if (index === -1) {
      return;
    }

    if (nextQuantity === 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = nextQuantity;
      cart[index].customization = normalizeCustomization(cart[index].customization);
    }

    writeCart(cart);
    syncCartCount();
  }

  function updateCartCustomization(cartKey, customization = {}) {
    const cart = readCart();
    const index = cart.findIndex(
      (item) => item.key === cartKey || (item.key == null && item.id === Number(cartKey))
    );

    if (index === -1) {
      return false;
    }

    const normalizedCustomization = normalizeCustomization(customization);

    if (!normalizedCustomization.wording) {
      return false;
    }

    const nextKey = createCartKey(cart[index].id, normalizedCustomization);
    const duplicateIndex = cart.findIndex((item, itemIndex) => item.key === nextKey && itemIndex !== index);

    if (duplicateIndex !== -1) {
      cart[duplicateIndex].quantity += cart[index].quantity;
      cart[duplicateIndex].customization = normalizedCustomization;
      cart.splice(index, 1);
    } else {
      cart[index].key = nextKey;
      cart[index].customization = normalizedCustomization;
    }

    writeCart(cart);
    syncCartCount();
    return true;
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
          key: item.key || createCartKey(item.id, item.customization),
          quantity: item.quantity,
          customization: normalizeCustomization(item.customization),
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

  function buildCustomizationLines(customization = {}) {
    const normalizedCustomization = normalizeCustomization(customization);
    const lines = [];

    if (normalizedCustomization.wording) {
      lines.push(`Preferred wording: ${normalizedCustomization.wording}`);
    }

    if (normalizedCustomization.colorPreference) {
      lines.push(`Color preference: ${normalizedCustomization.colorPreference}`);
    }

    return lines;
  }

  function inquiryText(product, customization = {}) {
    return [
      `Hello Amara, I would like details about ${product.name}${product.price != null ? ` (${formatPrice(product.price)})` : ""}.`,
      ...buildCustomizationLines(customization),
      "Please share availability, customization options, and next steps for ordering.",
    ].join("\n");
  }

  function inquiryHref(product, customization = {}) {
    const fullText = encodeURIComponent(inquiryText(product, customization));
    return `https://wa.me/${AMARA_WHATSAPP}?text=${fullText}`;
  }

  function inquiryEmailHref(product, customization = {}) {
    const subject = encodeURIComponent(`Amara inquiry: ${product.name}`);
    const body = encodeURIComponent(inquiryText(product, customization));
    return `mailto:${AMARA_EMAIL}?subject=${subject}&body=${body}`;
  }

  function cartCheckoutText(cartItems) {
    const lines = cartItems.flatMap((item) => {
      const itemLines = [
        `- ${item.name} x ${item.quantity}${item.price != null ? ` (${formatPrice(item.price)})` : ""}`,
      ];
      buildCustomizationLines(item.customization).forEach((line) => {
        itemLines.push(`  ${line}`);
      });
      return itemLines;
    });

    return [
      "Hello Amara, I would like to place an order for these pieces:",
      "",
      ...lines,
      "",
      `Estimated subtotal: ${formatPrice(getCartSubtotal())}`,
      "",
      "Please share availability, delivery timeline, and payment details.",
    ].join("\n");
  }

  function cartWhatsAppHref(cartItems) {
    return `https://wa.me/${AMARA_WHATSAPP}?text=${encodeURIComponent(cartCheckoutText(cartItems))}`;
  }

  function cartEmailHref(cartItems) {
    const subject = encodeURIComponent("Amara order inquiry");
    const body = encodeURIComponent(cartCheckoutText(cartItems));
    return `mailto:${AMARA_EMAIL}?subject=${subject}&body=${body}`;
  }

  function productCardMarkup(product, options = {}) {
    const quantity = product.purchasable ? getCartItemQuantity(product.id) : 0;
    const detailLabel = product.purchasable ? "View Details" : "View Story";
    const actions = product.purchasable
      ? `
        ${
          quantity > 0
            ? `
        <div class="inline-qty inline-qty-summary">
          <span class="inline-qty-count">${quantity} in cart</span>
          <a class="inline-qty-link" href="./product.html?slug=${encodeURIComponent(product.slug)}">Edit custom details</a>
        </div>
        `
            : `
        <a class="button button-primary" href="./product.html?slug=${encodeURIComponent(product.slug)}">Customize & Add</a>
        `
        }
        <a class="button button-secondary" href="./product.html?slug=${encodeURIComponent(product.slug)}">${detailLabel}</a>
      `
      : `
        <a class="button button-primary" href="./product.html?slug=${encodeURIComponent(product.slug)}">${detailLabel}</a>
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
          <h3 class="product-title"><a href="./product.html?slug=${encodeURIComponent(product.slug)}">${product.name}</a></h3>
          <p class="product-description">${product.description}</p>
          <div class="product-actions">
            ${actions}
          </div>
        </div>
      </article>
    `;
  }

  function bindProductGrid(grid, list, modalController, options = {}) {
    function render() {
      grid.innerHTML = list.map((product) => productCardMarkup(product, options)).join("");

      grid.querySelectorAll('[data-action="add-cart"]').forEach((button) => {
        button.addEventListener("click", () => {
          addToCart(button.dataset.productId, 1, getCartCustomization(button.dataset.productId));
          render();
          if (typeof options.afterAdd === "function") {
            options.afterAdd(Number(button.dataset.productId));
          }
        });
      });

      if (modalController) {
        grid.querySelectorAll('[data-action="quick-view"]').forEach((button) => {
          button.addEventListener("click", () => {
            const product = findProduct(button.dataset.productId);
            if (product) {
              modalController.open(product);
            }
          });
        });
      }
    }

    render();
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
      modalInquire.href = inquiryHref(product, getCartCustomization(product.id));
      modalInquire.target = "_blank";
      modalInquire.rel = "noreferrer";

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
        const customization = getCartCustomization(activeProduct.id);
        if (!customization.wording) {
          modalAddCart.hidden = true;
          return;
        }
        addToCart(activeProduct.id, 1, customization);
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
    findProductBySlug,
    getRelatedProducts,
    formatPrice,
    readCart,
    getCartCustomization,
    addToCart,
    updateCartQuantity,
    updateCartCustomization,
    clearCart,
    getDetailedCart,
    getCartSubtotal,
    getCartItemQuantity,
    syncCartCount,
    getCartVariant,
    inquiryHref,
    inquiryEmailHref,
    inquiryText,
    cartCheckoutText,
    cartWhatsAppHref,
    cartEmailHref,
    bindProductGrid,
    createModalController,
    contact: {
      email: AMARA_EMAIL,
      whatsapp: AMARA_WHATSAPP,
      instagram: AMARA_INSTAGRAM,
    },
  };
})();
