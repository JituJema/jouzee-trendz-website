// ===== JOUZEE TRENDZ — shared frontend logic =====
const WHATSAPP_NUMBER = "255654701189"; // 0654701189 in intl format

/* ---------- Language toggle ---------- */
function initLang(){
  const saved = localStorage.getItem('jt_lang') || 'sw';
  document.body.classList.add('lang-' + saved);
  const btn = document.getElementById('langToggle');
  if(btn){
    btn.textContent = saved === 'sw' ? 'EN' : 'SW';
    btn.addEventListener('click', () => {
      const cur = document.body.classList.contains('lang-sw') ? 'sw' : 'en';
      const next = cur === 'sw' ? 'en' : 'sw';
      document.body.classList.remove('lang-' + cur);
      document.body.classList.add('lang-' + next);
      localStorage.setItem('jt_lang', next);
      btn.textContent = next === 'sw' ? 'EN' : 'SW';
    });
  }
}

/* ---------- Mobile nav ---------- */
function initNav(){
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if(toggle && links){
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
}

/* ---------- Generic WhatsApp form (contact / booking) ---------- */
function initWhatsAppForm(formId, title){
  const form = document.getElementById(formId);
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    let msg = `*${title} - JOUZEE TRENDZ*\n\n`;
    for(const [key, val] of data.entries()){
      if(val && val.trim()) msg += `${key}: ${val}\n`;
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLang();
  initNav();
  initCartUI();
  initWhatsAppForm('contactForm', 'UJUMBE MPYA / NEW MESSAGE');
  initWhatsAppForm('bookingForm', 'BOOKING MPYA / NEW BOOKING');
});

/* ---------- Cart (localStorage per device, used at checkout time) ---------- */
const Cart = {
  key: 'jt_cart',
  get(){ try{ return JSON.parse(localStorage.getItem(this.key)) || []; }catch(e){ return []; } },
  save(items){ localStorage.setItem(this.key, JSON.stringify(items)); Cart.renderCount(); },
  add(product, qty){
    const items = this.get();
    const existing = items.find(i => i.id === product.id);
    if(existing){ existing.qty += qty; }
    else{ items.push({ id: product.id, name: product.name, name_sw: product.name_sw, price: product.price, image: product.image, qty }); }
    this.save(items);
  },
  remove(id){ this.save(this.get().filter(i => i.id !== id)); },
  clear(){ this.save([]); },
  total(){ return this.get().reduce((s,i) => s + i.price * i.qty, 0); },
  count(){ return this.get().reduce((s,i) => s + i.qty, 0); },
  renderCount(){
    const el = document.getElementById('cartCount');
    if(el) el.textContent = Cart.count();
  }
};

function fmtTZS(n){ return "TZS " + Number(n).toLocaleString('en-US'); }

/* ---------- Load products (from data/products.json) ---------- */
async function loadProducts(){
  try{
    const res = await fetch('data/products.json', { cache: 'no-store' });
    return await res.json();
  }catch(e){ console.error('Failed to load products', e); return []; }
}

function isSw(){ return document.body.classList.contains('lang-sw'); }

function renderProductCard(p){
  const name = isSw() && p.name_sw ? p.name_sw : p.name;
  const desc = isSw() && p.desc_sw ? p.desc_sw : p.desc;
  const div = document.createElement('div');
  div.className = 'product-card';
  div.innerHTML = `
    <div class="img-wrap"><img src="${p.image}" alt="${name}"></div>
    <div class="product-body">
      <h3>${name}</h3>
      <p class="desc">${desc || ''}</p>
      <div class="product-price">${fmtTZS(p.price)}</div>
      <div class="product-actions">
        <div class="qty-box">
          <button type="button" class="qty-minus">-</button>
          <span class="qty-val">1</span>
          <button type="button" class="qty-plus">+</button>
        </div>
        <button type="button" class="btn btn-gold add-cart-btn">
          <span class="lang-sw">Ongeza Kartini</span><span class="lang-en">Add to Cart</span>
        </button>
      </div>
    </div>`;
  const qtyVal = div.querySelector('.qty-val');
  div.querySelector('.qty-minus').onclick = () => { qtyVal.textContent = Math.max(1, +qtyVal.textContent - 1); };
  div.querySelector('.qty-plus').onclick = () => { qtyVal.textContent = +qtyVal.textContent + 1; };
  div.querySelector('.add-cart-btn').onclick = () => {
    Cart.add(p, +qtyVal.textContent);
    openCart();
  };
  return div;
}

/* ---------- Cart drawer UI ---------- */
function openCart(){
  document.getElementById('cartOverlay')?.classList.add('open');
  document.getElementById('cartDrawer')?.classList.add('open');
  renderCartDrawer();
}
function closeCart(){
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartDrawer')?.classList.remove('open');
}

function renderCartDrawer(){
  const wrap = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if(!wrap) return;
  const items = Cart.get();
  wrap.innerHTML = '';
  if(items.length === 0){
    wrap.innerHTML = '<p style="color:#8A8478;text-align:center;padding:20px 0;">' +
      (isSw() ? 'Kartini yako iko tupu.' : 'Your cart is empty.') + '</p>';
  }
  items.forEach(i => {
    const name = isSw() && i.name_sw ? i.name_sw : i.name;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${i.image}" alt="${name}">
      <div class="cart-item-info">
        <h4>${name}</h4>
        <div class="row">
          <span>${i.qty} x ${fmtTZS(i.price)}</span>
          <button class="remove-item">✕</button>
        </div>
      </div>`;
    row.querySelector('.remove-item').onclick = () => { Cart.remove(i.id); renderCartDrawer(); };
    wrap.appendChild(row);
  });
  if(totalEl) totalEl.textContent = fmtTZS(Cart.total());
}

/* ---------- Checkout -> WhatsApp ---------- */
function initCartUI(){
  Cart.renderCount();
  document.getElementById('cartToggle')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

  const form = document.getElementById('checkoutForm');
  if(form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const items = Cart.get();
      if(items.length === 0){
        alert(isSw() ? 'Kartini yako iko tupu.' : 'Your cart is empty.');
        return;
      }
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const location = document.getElementById('custLocation').value.trim();
      if(!name || !phone || !location){
        alert(isSw() ? 'Tafadhali jaza taarifa zote.' : 'Please fill in all fields.');
        return;
      }
      let msg = `*ORDER MPYA - JOUZEE TRENDZ*\n\n`;
      msg += `Jina: ${name}\nSimu: ${phone}\nLocation: ${location}\n\n`;
      msg += `*Bidhaa:*\n`;
      items.forEach(i => {
        msg += `- ${i.name} x${i.qty} = ${fmtTZS(i.price * i.qty)}\n`;
      });
      msg += `\n*Jumla: ${fmtTZS(Cart.total())}*\n`;
      msg += `\nMalipo: Airtel Money`;
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      Cart.clear();
      closeCart();
      form.reset();
    });
  }
}
