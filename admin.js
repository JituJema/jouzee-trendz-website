// admin.js — JOUZEE TRENDZ admin panel logic
let currentProducts = [];
let pendingImageBase64 = null;
let pendingImageExt = null;

function getToken(){ return sessionStorage.getItem('jt_admin_token'); }
function setToken(t){ sessionStorage.setItem('jt_admin_token', t); }
function clearToken(){ sessionStorage.removeItem('jt_admin_token'); }

function showStatus(msg, ok){
  const el = document.getElementById('statusMsg');
  el.innerHTML = `<div class="status-msg ${ok ? 'status-ok' : 'status-err'}">${msg}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 5000);
}

async function login(){
  const password = document.getElementById('adminPassword').value;
  const msgEl = document.getElementById('loginMsg');
  msgEl.textContent = 'Inaingia...';
  try{
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const j = await r.json();
    if(!r.ok){ msgEl.textContent = j.error || 'Imeshindwa'; return; }
    setToken(j.token);
    enterAdmin();
  }catch(e){ msgEl.textContent = 'Server error'; }
}

function enterAdmin(){
  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
  document.getElementById('logoutBtn').classList.remove('hidden');
  refreshProducts();
}

async function refreshProducts(){
  const res = await fetch('data/products.json?_=' + Date.now(), { cache: 'no-store' });
  currentProducts = await res.json();
  renderTable();
}

function renderTable(){
  const body = document.getElementById('productsTableBody');
  body.innerHTML = '';
  currentProducts.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.image}" alt=""></td>
      <td>${p.name}<br><small style="color:#8A8478;">${p.name_sw || ''}</small></td>
      <td>TZS ${Number(p.price).toLocaleString('en-US')}</td>
      <td class="admin-actions">
        <button class="edit-btn" title="Edit">✏️</button>
        <button class="del-btn" title="Delete">🗑️</button>
      </td>`;
    tr.querySelector('.edit-btn').onclick = () => openForm(p);
    tr.querySelector('.del-btn').onclick = () => deleteProduct(p.id);
    body.appendChild(tr);
  });
}

function openForm(product){
  document.getElementById('productForm').classList.remove('hidden');
  document.getElementById('formTitle').textContent = product ? 'Hariri Bidhaa' : 'Bidhaa Mpya';
  document.getElementById('pId').value = product ? product.id : 'p' + Date.now();
  document.getElementById('pNameSw').value = product ? (product.name_sw || '') : '';
  document.getElementById('pNameEn').value = product ? (product.name || '') : '';
  document.getElementById('pDescSw').value = product ? (product.desc_sw || '') : '';
  document.getElementById('pDescEn').value = product ? (product.desc || '') : '';
  document.getElementById('pPrice').value = product ? product.price : '';
  const preview = document.getElementById('pImagePreview');
  if(product && product.image){ preview.src = product.image; preview.classList.remove('hidden'); }
  else { preview.classList.add('hidden'); }
  pendingImageBase64 = null; pendingImageExt = null;
  document.getElementById('pImage').value = '';
}

function closeForm(){
  document.getElementById('productForm').classList.add('hidden');
}

function handleImageSelect(e){
  const file = e.target.files[0];
  if(!file) return;
  pendingImageExt = file.name.split('.').pop();
  const reader = new FileReader();
  reader.onload = () => {
    pendingImageBase64 = reader.result.split(',')[1];
    const preview = document.getElementById('pImagePreview');
    preview.src = reader.result;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

async function saveProduct(){
  const product = {
    id: document.getElementById('pId').value,
    name: document.getElementById('pNameEn').value.trim(),
    name_sw: document.getElementById('pNameSw').value.trim(),
    desc: document.getElementById('pDescEn').value.trim(),
    desc_sw: document.getElementById('pDescSw').value.trim(),
    price: Number(document.getElementById('pPrice').value) || 0,
    image: document.getElementById('pImagePreview').src.includes('base64') ? '' : document.getElementById('pImagePreview').src
  };
  if(!product.name || !product.price){
    showStatus('Jaza jina na bei / Fill name and price', false);
    return;
  }
  showStatus('Inahifadhi... / Saving...', true);
  try{
    const r = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify({
        action: 'save', product,
        imageBase64: pendingImageBase64, imageExt: pendingImageExt
      })
    });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error);
    showStatus('Imehifadhiwa! Tovuti itasasishwa ndani ya sekunde 60. / Saved! Site will update within 60s.', true);
    closeForm();
    setTimeout(refreshProducts, 1500);
  }catch(e){ showStatus(e.message || 'Imeshindwa', false); }
}

async function deleteProduct(id){
  if(!confirm('Una uhakika unataka kufuta bidhaa hii? / Delete this product?')) return;
  showStatus('Inafuta... / Deleting...', true);
  try{
    const r = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify({ action: 'delete', productId: id })
    });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error);
    showStatus('Imefutwa! / Deleted!', true);
    setTimeout(refreshProducts, 1500);
  }catch(e){ showStatus(e.message || 'Imeshindwa', false); }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginBtn').onclick = login;
  document.getElementById('newProductBtn').onclick = () => openForm(null);
  document.getElementById('cancelFormBtn').onclick = closeForm;
  document.getElementById('saveProductBtn').onclick = saveProduct;
  document.getElementById('pImage').addEventListener('change', handleImageSelect);
  document.getElementById('logoutBtn').onclick = () => {
    clearToken();
    document.getElementById('loginBox').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
  };
  if(getToken()) enterAdmin();
});
