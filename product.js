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
  const detailWording = document.querySelector("#detail-wording");
  const detailColor = document.querySelector("#detail-color");
  const detailSaveCustomization = document.querySelector("#detail-save-customization");
  const detailFeedback = document.querySelector("#detail-feedback");
  const customizationRequired = AmaraStore.requiresCustomization(product);

  function readCustomizationInput() {
    return {
      wording: detailWording.value.trim(),
      colorPreference: detailColor.value.trim(),
    };
  }

  function updateInquiryLinks() {
    const customization = readCustomizationInput();
    const hasWording = Boolean(customization.wording) || !customizationRequired;

    detailWhatsApp.href = hasWording ? AmaraStore.inquiryHref(product, customization) : "#";
    detailEmail.href = hasWording ? AmaraStore.inquiryEmailHref(product, customization) : "#";
    detailWhatsApp.classList.toggle("is-disabled", !hasWording);
    detailEmail.classList.toggle("is-disabled", !hasWording);
  }

  function showFeedback(message = "", isError = false) {
    detailFeedback.textContent = message;
    detailFeedback.classList.toggle("is-error", Boolean(message && isError));
    detailFeedback.classList.toggle("is-success", Boolean(message && !isError));
  }

  function renderDetailCartControls() {
    if (!product.purchasable) {
      detailCartControls.innerHTML = '<button class="button button-ghost is-disabled" type="button" disabled>Editorial Feature</button>';
      return;
    }

    const customization = readCustomizationInput();
    const exactVariant = customization.wording
      ? AmaraStore.getCartVariant(product.id, customization)
      : null;
    const latestVariant = AmaraStore.getLatestCartVariant(product.id);
    const totalQuantity = AmaraStore.getCartItemQuantity(product.id);
    const variant = exactVariant || (!customization.wording && !customization.colorPreference ? latestVariant : null);
    const quantity = variant ? variant.quantity : 0;

    const summaryMarkup =
      totalQuantity > 0
        ? `
      <div class="detail-qty detail-qty-summary" data-product-id="${product.id}">
        <div class="detail-qty-copy">
          <strong>${exactVariant ? quantity : totalQuantity}</strong>
          <span>${exactVariant ? "this version in cart" : "total in cart"}</span>
        </div>
        <a class="button button-secondary" href="./cart.html">Review Cart</a>
      </div>
    `
        : "";

    detailCartControls.innerHTML = `
      ${summaryMarkup}
      <button class="button button-primary" id="detail-add-cart" type="button">Add to Cart</button>
    `;

    detailCartControls.querySelector("#detail-add-cart").addEventListener("click", () => {
      const customization = readCustomizationInput();

      if (customizationRequired && !customization.wording) {
        showFeedback("Preferred wording is required before adding this piece.", true);
        detailWording.focus();
        return;
      }

      AmaraStore.addToCart(product.id, 1, customization);
      showFeedback("Customisation saved to cart.");
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
  const existingCustomization = AmaraStore.getCartCustomization(product.id);
  detailWording.value = existingCustomization.wording;
  detailColor.value = existingCustomization.colorPreference;
  detailWording.required = customizationRequired;
  detailWording.placeholder = customizationRequired
    ? "Name, initials, or short phrase"
    : "Optional name, initials, or short phrase";
  detailWording.previousElementSibling.textContent = customizationRequired
    ? "Preferred wording"
    : "Preferred wording (optional)";
  detailSaveCustomization.textContent = customizationRequired
    ? "Save personalisation"
    : "Save preferences";
  updateInquiryLinks();
  renderDetailCartControls();

  [detailWording, detailColor].forEach((field) => {
    field.addEventListener("input", () => {
      updateInquiryLinks();
      renderDetailCartControls();
      if (field === detailWording && detailWording.value.trim()) {
        showFeedback("");
      }
    });
  });

  detailSaveCustomization.addEventListener("click", () => {
    const customization = readCustomizationInput();

    if (customizationRequired && !customization.wording) {
      showFeedback("Preferred wording is required before saving.", true);
      detailWording.focus();
      return;
    }

    if (AmaraStore.getCartItemQuantity(product.id) > 0) {
      const variant = AmaraStore.getCartVariant(product.id, customization);
      if (variant) {
        AmaraStore.updateCartCustomization(variant.key, customization);
        showFeedback("Personalisation updated in cart.");
      } else {
        showFeedback("Details saved for this version. Add it to cart when ready.");
      }
    } else {
      showFeedback("Details saved for your inquiry. Add the piece to cart when ready.");
    }

    updateInquiryLinks();
    renderDetailCartControls();
  });

  [detailWhatsApp, detailEmail].forEach((link) => {
    link.addEventListener("click", (event) => {
      if (customizationRequired && !detailWording.value.trim()) {
        event.preventDefault();
        showFeedback("Preferred wording is required before ordering.", true);
        detailWording.focus();
      }
    });
  });

  const relatedProducts = AmaraStore.getRelatedProducts(product, 3);
  relatedSection.hidden = relatedProducts.length === 0;

  if (relatedProducts.length > 0) {
    AmaraStore.bindProductGrid(relatedGrid, relatedProducts, null);
  }
}
