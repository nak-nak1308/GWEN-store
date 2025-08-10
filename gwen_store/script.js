/* script.js
   Handles:
   - hamburger nav
   - rendering product lists (featured + shop)
   - product page loader (via ?id=)
   - cart (localStorage)
   - checkout simulation
   - contact form stub

   Notes:
   - Uses event delegation for add-to-cart / qty buttons to avoid duplicate listeners.
   - Keeps your original functions & markup assumptions.
*/

(function(){
  // small helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const containerized = () => typeof PRODUCTS !== 'undefined' && PRODUCTS instanceof Array;

  // NAV hamburger (shared) - unchanged
  function initHamburger(){
    const btns = $$('#btnHamb, #btnHamb2, #btnHamb3, #btnHamb4, #btnHamb5');
    btns.forEach(b=>{
      b && b.addEventListener('click', ()=> {
        const nav = document.getElementById('mainNav');
        if(!nav) return;
        const showing = nav.style.display === 'flex';
        nav.style.display = showing ? '' : 'flex';
        nav.style.flexDirection = 'column';
        nav.style.gap = '10px';
        nav.style.background = 'white';
        nav.style.padding = '14px';
        nav.style.position = 'absolute';
        nav.style.top = '64px';
        nav.style.right = '20px';
        nav.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)';
        nav.style.borderRadius = '12px';
      });
    });
  }

  // CART storage
  const CART_KEY = 'gwen_cart_v1';
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

  function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function cartCount(){ return cart.reduce((s,i)=>s+(i.qty||0),0); }

  // Refresh cart UI - updates all #cartItems elements (drawer + popup) and cart count badges
  function refreshCartUI(){
    $$('#cartCount').forEach(el => el.textContent = cartCount());

    const allItemsEls = document.querySelectorAll('#cartItems'); // may be multiple in your DOM
    const itemsHtml = cart.length === 0 ? '<div>No items yet.</div>' :
      cart.map(it => `
        <div class="cart-row" style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #f6f6f6">
          <img src="${it.image}" style="width:54px;height:40px;object-fit:cover;border-radius:6px" />
          <div style="flex:1">
            <strong>${it.name}</strong>
            <div style="color:var(--muted)">${it.qty} × $${it.price}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="qty-btn" data-id="${it.id}" data-op="+" style="padding:6px;border-radius:6px">+</button>
            <button class="qty-btn" data-id="${it.id}" data-op="-" style="padding:6px;border-radius:6px">−</button>
          </div>
        </div>
      `).join('');

    allItemsEls.forEach(itemsEl => itemsEl.innerHTML = itemsHtml);
  }

  // cart open/close and checkout (popup version handled here)
  function initCartButtons(){
    // Open cart popup buttons (if any exist)
    $$('#cartBtn').forEach(b => {
      b && b.addEventListener('click', ()=> {
        const popup = $('#cartPopup');
        if(!popup) return;
        popup.setAttribute('aria-hidden','false');
        refreshCartUI();
      });
    });

    // Close any popup close buttons (there may be multiple elements with id="closeCart" in your markup)
    document.querySelectorAll('#closeCart').forEach(closeBtn => {
      closeBtn && closeBtn.addEventListener('click', ()=> {
        const popup = $('#cartPopup');
        popup && popup.setAttribute('aria-hidden','true');
        // also close drawer in case
        const drawer = $('#cartDrawer'); drawer && drawer.classList.remove('open');
      });
    });

document.getElementById('checkoutBtn').addEventListener('click', function () {
  const cart = JSON.parse(localStorage.getItem('gwen_cart_v1')) || [];
  let totalPrice = 0;

  cart.forEach(item => {
    totalPrice += item.price * (item.qty || 1);
  });

  localStorage.setItem('checkoutCart', JSON.stringify(cart));
  localStorage.setItem('checkoutTotal', totalPrice.toFixed(2));

  window.location.href = 'checkout.html';
});

  }

  // Add to cart util
  function addToCart(productId, qty = 1){
    if(!containerized()) return;
    const p = PRODUCTS.find(x => x.id === productId);
    if(!p) return;
    const existing = cart.find(c=>c.id===p.id);
    if(existing) existing.qty = Math.max(1, (existing.qty || 0) + qty);
    else cart.push({ id: p.id, name: p.name, price: p.price, image: (p.images && p.images[0]) || '', qty });
    saveCart();
    refreshCartUI();

    // small inline feedback on the active element (if it's a button)
    const btn = document.activeElement;
    if(btn && btn.classList && btn.classList.contains('btn')) {
      const original = btn.dataset.orig || btn.textContent;
      btn.textContent = 'Added';
      setTimeout(()=> btn.textContent = original, 900);
    } else {
      // fallback log
      console.log(p.name + ' added to cart');
    }
  }

  // Render product card (used in multiple places) - unchanged
  function productCardHTML(p){
    return `
      <article class="product-card" data-id="${p.id}">
        <a class="product-image" href="product.html?id=${p.id}" aria-label="${p.name}">
          <img src="${p.images[0]}" data-alt="${p.images[1] || p.images[0]}" alt="${p.name}">
        </a>
        <div class="product-meta">
          <div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">$${p.price}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn small add-now" data-id="${p.id}" data-orig="Add">Add</button>
            <a class="ghost" href="product.html?id=${p.id}">View</a>
          </div>
        </div>
      </article>
    `;
  }

  // populate featured on home
  function renderFeatured(){
    const el = $('#featuredGrid');
    if(!el || !containerized()) return;
    // pick first 6 as featured
    el.innerHTML = PRODUCTS.slice(0,6).map(productCardHTML).join('');
    attachProductGridEvents(el);

    // bind scroll buttons once
    const left = document.getElementById('scrollLeft');
    const right = document.getElementById('scrollRight');
    if(left && !left.dataset.bound){
      left.addEventListener('click', () => {
        el.scrollBy({ left: -300, behavior: 'smooth' });
      });
      left.dataset.bound = 'true';
    }
    if(right && !right.dataset.bound){
      right.addEventListener('click', () => {
        el.scrollBy({ left: 300, behavior: 'smooth' });
      });
      right.dataset.bound = 'true';
    }
  }

  // populate shop grid
  function renderShopGrid(list){
    const el = $('#shopGrid');
    if(!el || !containerized()) return;
    el.innerHTML = (list || PRODUCTS).map(productCardHTML).join('');
    attachProductGridEvents(el);
  }

  // attach hover swap inside a grid container (do NOT attach add-to-cart here - use delegation)
  function attachProductGridEvents(container){
    if(!container) return;
    container.querySelectorAll('.product-image img').forEach(img=>{
      const alt = img.dataset.alt;
      const orig = img.src;
      // Remove previous listeners by cloning to avoid duplication (safe)
      img.removeEventListener && img.removeEventListener('mouseenter', null);
      img.addEventListener('mouseenter', ()=> { if(alt) img.src = alt; });
      img.addEventListener('mouseleave', ()=> { img.src = orig; });
    });
  }

  // product page loader (product.html)
  function loadProductPage(){
    const productPageEl = $('#productPage');
    if(!productPageEl || !containerized()) return;
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || PRODUCTS[0].id;
    const product = PRODUCTS.find(p=>p.id===id) || PRODUCTS[0];

    productPageEl.innerHTML = `
      <div class="product-view">
        <div>
          <div class="gallery"><img id="mainPhoto" src="${product.images[0]}" alt="${product.name}"></div>
          <div class="variant-row">
            ${product.images.map(i=>`<div class="variant-thumb" data-src="${i}"><img src="${i}" alt=""></div>`).join('')}
          </div>
        </div>
        <aside class="product-info">
          <h1>${product.name}</h1>
          <div style="color:var(--muted)">$${product.price}</div>
          <p style="margin-top:14px">${product.desc}</p>
          <div style="margin-top:18px;display:flex;gap:10px;align-items:center">
            <label for="qty">Qty</label>
            <input id="qty" type="number" min="1" value="1" style="width:64px;padding:6px;border-radius:8px;border:1px solid #eee">
          </div>
          <div style="margin-top:18px">
            <button class="btn" id="addCartBtn" data-id="${product.id}">Add to cart</button>
            <a class="btn ghost" href="shop.html" style="margin-left:8px">Back to shop</a>
          </div>
        </aside>
      </div>
    `;

    // variant click
    productPageEl.querySelectorAll('.variant-thumb').forEach(t=>{
      t.addEventListener('click', ()=> {
        const src = t.dataset.src;
        const main = document.getElementById('mainPhoto');
        if(main) main.src = src;
      });
    });

    // guard attaching addCartBtn listener only once (some pages may call loadProductPage multiple times)
    const addCartBtn = document.getElementById('addCartBtn');
    if(addCartBtn && !addCartBtn.dataset.bound){
      addCartBtn.addEventListener('click', ()=>{
        const qty = parseInt(document.getElementById('qty').value,10) || 1;
        addToCart(addCartBtn.dataset.id, qty);
      });
      addCartBtn.dataset.bound = 'true';
    }
  }

  // search + sort on shop page
  function initShopFilters(){
    const search = $('#searchInput');
    const sort = $('#sortSelect');
    if(search){
      search.addEventListener('input', ()=> {
        const q = search.value.trim().toLowerCase();
        const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || (p.tags||[]).join(' ').includes(q));
        renderShopGrid(filtered);
      });
    }
    if(sort){
      sort.addEventListener('change', ()=> {
        const v = sort.value;
        let arr = [...PRODUCTS];
        if(v === 'price-asc') arr.sort((a,b)=>a.price-b.price);
        if(v === 'price-desc') arr.sort((a,b)=>b.price-a.price);
        renderShopGrid(arr);
      });
    }
  }

  // product list on index (featured) and shop
  function initProductLists(){
    if($('#featuredGrid')) renderFeatured();
    if($('#shopGrid')) renderShopGrid();
  }

  // contact form
  function initContactForm(){
    const btn = $('#sendContact');
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      const name = $('#c_name').value.trim();
      const email = $('#c_email').value.trim();
      const msg = $('#c_msg').value.trim();
      const fb = $('#contactFeedback');
      if(!name || !email || !msg){ fb.textContent = 'Please fill all fields.'; return; }
      // stub — simulate sending
      fb.textContent = 'Message sent — thank you!';
      btn.disabled = true;
      setTimeout(()=> { btn.disabled = false; $('#c_name').value=''; $('#c_email').value=''; $('#c_msg').value=''; }, 1200);
    });
  }

  // static add buttons (kept for backward compatibility; we won't attach listeners here)
  function initStaticAddButtons(){
    // no-op. we use delegated click handling for add-now to avoid duplicate handlers.
  }

  // Global delegated click handler (handles add-to-cart, qty buttons, checkout)
  function initDelegatedHandlers(){
    document.addEventListener('click', function(e){
      // Add-now buttons inside product cards (and any .add-now)
      const addNow = e.target.closest('.add-now');
      if(addNow){
        e.preventDefault();
        const id = addNow.dataset.id;
        if(id) addToCart(id, 1);
        return;
      }

      // Add from product page (#addCartBtn)
      // Delegated handling skipped to avoid duplicate add events because loadProductPage attaches its own listener.
      // (Direct listener on #addCartBtn is preferred and prevents double-add.)
      // return;

      // Qty buttons inside cart rows
      const qtyBtn = e.target.closest('.qty-btn');
      if(qtyBtn){
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
        const id = qtyBtn.dataset.id;
        const op = qtyBtn.dataset.op;
        const found = cart.find(c => c.id === id);
        if(!found) return;
        if(op === '+') found.qty++;
        else found.qty = Math.max(0, found.qty - 1);
        cart = cart.filter(c => c.qty > 0);
        saveCart(); refreshCartUI();
        return;
      }

      // Checkout button (works for both drawer & popup) - simulate order then clear cart
      const checkoutBtn = e.target.closest('#checkoutBtn, .checkout-btn');
      if(checkoutBtn){
        e.preventDefault();
        if(cart.length === 0){ alert('Cart is empty'); return; }
        const order = {
          id: 'ORD-' + Math.random().toString(36).slice(2,9).toUpperCase(),
          date: new Date().toISOString(),
          items: cart
        };
        // clear cart
        cart = []; saveCart(); refreshCartUI();
        alert('Order placed — ' + order.id + '\n(This is a simulated checkout.)');
        // close any open cart UIs
        const popup = $('#cartPopup'); popup && popup.setAttribute('aria-hidden','true');
        const drawer = $('#cartDrawer'); drawer && drawer.classList.remove('open');
        return;
      }
    });
  }

  // initial render + events
  function init(){
    // init UI features
    initHamburger();
    initCartButtons();
    initDelegatedHandlers();
    renderYears();
    refreshCartUI();
    initProductLists();
    initShopFilters();
    initContactForm();
    initStaticAddButtons();
    loadProductPage(); // safe to call on pages without #productPage

    // --- menu / cart drawer toggles (mutually exclusive) ---
    const menuToggle = document.getElementById('menuToggle');
    const cartToggle = document.getElementById('cartToggle');
    const sideMenu = document.getElementById('sideMenu');
    const cartDrawer = document.getElementById('cartDrawer');

    if(menuToggle){
      menuToggle.addEventListener('click', () => {
        // close cart drawer if open
        if(cartDrawer) cartDrawer.classList.remove('open');
        // toggle menu
        if(sideMenu) sideMenu.classList.toggle('open');
      });
    }

    if(cartToggle){
      cartToggle.addEventListener('click', () => {
        // close menu if open
        if(sideMenu) sideMenu.classList.remove('open');
        // toggle cart drawer
        if(cartDrawer){
          cartDrawer.classList.toggle('open');
          // ensure cart UI up-to-date when opening drawer
          if(cartDrawer.classList.contains('open')) refreshCartUI();
        }
      });
    }

    // close buttons for side menu (may be multiple)
    document.querySelectorAll('#closeMenu').forEach(btn => {
      btn && btn.addEventListener('click', ()=> sideMenu && sideMenu.classList.remove('open'));
    });

    // close buttons for cart drawer/popup handled earlier via initCartButtons (closeCart)
    // Click outside to close (works for both)
    document.addEventListener('click', (ev) => {
      const clickInsideMenu = sideMenu && (sideMenu.contains(ev.target) || (menuToggle && menuToggle.contains(ev.target)));
      const clickInsideCart = cartDrawer && (cartDrawer.contains(ev.target) || (cartToggle && cartToggle.contains(ev.target)));
      if(!clickInsideMenu && sideMenu) sideMenu.classList.remove('open');
      if(!clickInsideCart && cartDrawer) cartDrawer.classList.remove('open');
    });

    // Escape to close
    document.addEventListener('keydown', (ev) => {
      if(ev.key === 'Escape'){
        if(sideMenu) sideMenu.classList.remove('open');
        if(cartDrawer) cartDrawer.classList.remove('open');
        const popup = $('#cartPopup'); popup && popup.setAttribute('aria-hidden','true');
      }
    });
  }

  function renderYears(){
    const y = new Date().getFullYear();
    $$('#year, #year_shop, #year_about, #year_contact, #year_product').forEach(el=> el && (el.textContent = y));
  }

  // run when DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else init();
document.addEventListener('DOMContentLoaded', () => {
    const featuredGrid = document.getElementById('featuredGrid');
    const scrollLeftBtn = document.getElementById('scrollLeft');
    const scrollRightBtn = document.getElementById('scrollRight');

    function updateButtons() {
        scrollLeftBtn.style.display = featuredGrid.scrollLeft <= 0 ? 'none' : 'block';
        scrollRightBtn.style.display =
            featuredGrid.scrollLeft + featuredGrid.clientWidth >= featuredGrid.scrollWidth - 1
                ? 'none'
                : 'block';
    }

    scrollRightBtn.addEventListener('click', () => {
        featuredGrid.scrollBy({ left: featuredGrid.clientWidth, behavior: 'smooth' });
        setTimeout(updateButtons, 300);
    });

    scrollLeftBtn.addEventListener('click', () => {
        featuredGrid.scrollBy({ left: -featuredGrid.clientWidth, behavior: 'smooth' });
        setTimeout(updateButtons, 300);
    });

    featuredGrid.addEventListener('scroll', updateButtons);

    // Run once when the page loads
    updateButtons();
});

document.querySelectorAll('.about-card').forEach(card => {
  card.addEventListener('click', () => {
    // Remove flipped state from all cards
    document.querySelectorAll('.about-card').forEach(c => {
      if (c !== card) c.classList.remove('flipped');
    });

    // Toggle the clicked card
    card.classList.toggle('flipped');
  });
});


})();
