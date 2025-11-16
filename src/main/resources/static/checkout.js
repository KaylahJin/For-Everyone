// checkout.js — Step 1: Order, Step 2: Address, Step 3: Payment
const API_BASE = 'http://localhost:8080';

const $ = (sel, p = document) => p.querySelector(sel);
const $$ = (sel, p = document) => Array.from(p.querySelectorAll(sel));
const $id = (id) => document.getElementById(id);
const THB = (n) => `฿${Number(n || 0).toFixed(2)}`;

function getUserId() {
  const id = Number(localStorage.getItem('userId'));
  if (!id) {
    alert('Please log in first!');
    window.location.href = 'login.html';
    return null;
  }
  return id;
}
function badgeKey(uid){ return `cartCount_${uid}`; }
function updateCartBadge(uid, n){
  const badge = $id('cartBadge');
  if (!badge) return;
  const val = Math.max(0, Number(n)||0);
  badge.textContent = val > 0 ? String(val) : '';
  badge.style.display = val > 0 ? 'inline-block' : 'none';
}

/* ---------- accordion & step gating ---------- */
const stepEls = $$('.Step');
const detailEls = stepEls.map(s => s.nextElementSibling);
const state = { step1Done:false, step2Done:false };

function goToStep(n){
  stepEls.forEach((s,i)=>{
    s.classList.toggle('active', i === n-1);
    detailEls[i]?.classList.toggle('active', i === n-1);
  });
}
function canOpen(i){
  if (i===0) return true;                         // Step 1 always openable
  if (i===1) return state.step1Done;              // Step 2 after Step 1
  if (i===2) return state.step1Done && state.step2Done; // Step 3 after Step 2
  return false;
}
function bindAccordion(){
  stepEls.forEach((step, i)=>{
    const tryOpen = () => {
      if (!canOpen(i)) {
        if (i===1) alert('Please confirm your order (Step 1) first.');
        if (i===2) alert('Please complete shipping address (Step 2) first.');
        return;
      }
      goToStep(i+1);
    };
    step.setAttribute('role','button');
    step.setAttribute('tabindex','0');
    step.addEventListener('click', tryOpen);
    step.addEventListener('keydown', e=>{
      if (e.key==='Enter' || e.key===' ') { e.preventDefault(); tryOpen(); }
    });
  });
}

/* ---------- Step 1: Order Summary ---------- */
const listBox   = $id('cartList');
const subEl     = $id('subTotal');
const shipEl    = $id('shipping');
const discEl    = $id('discount');
const totalEl   = $id('grandTotal');

async function loadCartSummary(){
  const uid = getUserId(); if (!uid) return;
  const res = await fetch(`${API_BASE}/api/cart/${uid}`);
  if (!res.ok) { alert(await res.text()); return; }
  const items = await res.json();

  listBox.innerHTML = '';
  let subtotal = 0;
  items.forEach(it=>{
    const line = Number(it.price) * Number(it.quantity);
    subtotal += line;
    const row = document.createElement('div');
    row.className = 'Order-Item';
    row.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:8px 0;';
    row.innerHTML = `
      <div>
        <div style="font-weight:600">${it.title}</div>
        <div style="opacity:.7">${it.quantity} × ${THB(it.price)}</div>
      </div>
      <div>${THB(line)}</div>
    `;
    listBox.appendChild(row);
  });

  const shipping = subtotal > 0 ? 40 : 0;

  // ✅ Use the same rule as cart page
  const discount = subtotal >= 300 ? 40 : 0;

  const total = subtotal + shipping - discount;


  subEl.textContent   = THB(subtotal);
  shipEl.textContent  = THB(shipping);
  discEl.textContent  = `-${THB(discount).slice(1)}`;
  totalEl.textContent = THB(total);
}

// Step 1 → Step 2
$('#step1NextBtn')?.addEventListener('click', ()=>{
  state.step1Done = true;
  goToStep(2);
});

/* ---------- Step 2: Address (save & go next) ---------- */
const addressForm = $id('addressForm');

addressForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  // basic validation
  const need = (id, label) => ($id(id)?.value.trim() ? '' : `Please fill in ${label}\n`);
  let msg = '';
  msg += need('fname','First name');
  msg += need('lname','Last name');
  msg += need('telephone','Phone number');
  msg += need('address1','Address');
  msg += need('province','Province');
  msg += need('district','District');
  msg += need('postcode','Postal code');

  const phone = $id('telephone')?.value.trim();
  if (phone && !/^\d{9,10}$/.test(phone)) msg += 'Invalid phone number (9–10 digits)\n';
  const pc = $id('postcode')?.value.trim();
  if (pc && !/^\d{5}$/.test(pc)) msg += 'Postal code must be 5 digits\n';

  if (msg){ alert('Please check your address:\n' + msg); return; }

  const uid = getUserId(); if (!uid) return;

  const payload = {
    userId: uid,
    name: $id('fname').value.trim(),
    surname: $id('lname').value.trim(),
    telephone: $id('telephone').value.trim(),
    address1: $id('address1').value.trim(),
    address2: $id('address2').value.trim(),
    province: $id('province').value.trim(),
    district: $id('district').value.trim(),
    postcode: $id('postcode').value.trim()
  };

  const btn = $('#step2ConfirmBtn');
  btn?.setAttribute('disabled','true');

  try{
    // save address (optional but typical)
    const res = await fetch(`${API_BASE}/api/addresses`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
    const saved = await res.json();
    localStorage.setItem('checkout_address_id', String(saved.id));

    state.step2Done = true;
    goToStep(3);
  }catch(err){
    alert('Failed to save address: ' + err.message);
  }finally{
    btn?.removeAttribute('disabled');
  }
});

/* ---------- Step 3: Payment (place order) ---------- */
const paymentForm = $id('paymentForm');
const fileInput   = $id('slip');
const fileName    = $id('file-name');
const successMessage = $id('successMessage');
const backHomeBtn    = $id('backHomeBtn');

fileInput?.addEventListener('change', ()=>{
  fileName.textContent = fileInput.files.length ? fileInput.files[0].name : 'No file selected';
});

paymentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!state.step1Done) return alert('Please confirm your order (Step 1) first.');
  if (!state.step2Done) return alert('Please complete shipping address (Step 2) first.');

  const uid = getUserId(); if (!uid) return;
  const addressId = Number(localStorage.getItem('checkout_address_id'));
  if (!addressId) return alert('Missing shipping address.');

  const amount = $id('amount').value.trim();
  const date   = $id('date').value.trim();
  const time   = $id('time').value.trim();
  const file   = $id('slip').files[0];
  const bankEl = $$('input[name="bank"]').find(r => r.checked);
  if (!bankEl) return alert('Please select a bank.');
  const bank = bankEl.value.toUpperCase();

  if (!amount || !date || !time || !file)
    return alert('Please complete all payment details.');

  try {
    // ✅ 1. First make sure an order exists
    const orderRes = await fetch(`${API_BASE}/api/orders/checkout/${uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId })
    });
    if (!orderRes.ok) throw new Error(await orderRes.text());
    const order = await orderRes.json();

    // ✅ 2. Upload payment slip (multipart/form-data)
    const formData = new FormData();
    formData.append('orderId', order.id);
    formData.append('bankName', bank);
    formData.append('accountNumber', '1234567890'); // can make dynamic later
    formData.append('amount', amount);
    formData.append('transferDate', date);
    formData.append('transferTime', time);
    formData.append('file', file);

    const payRes = await fetch(`${API_BASE}/api/payments/upload/summary`, {
      method: 'POST',
      body: formData
    });

    if (!payRes.ok) throw new Error(await payRes.text());
    const result = await payRes.json();

    console.log('✅ Payment success:', result);

    // ✅ Reset cart badge and show thank-you
    localStorage.setItem(badgeKey(uid), '0');
    updateCartBadge(uid, 0);
    $$('.content, footer').forEach(el => el.style.display = 'none');
    successMessage.style.display = 'flex';

  } catch (err) {
    alert('Payment failed: ' + err.message);
  }
});


backHomeBtn?.addEventListener('click', () => window.location.href = 'index.html');

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  const uid = getUserId(); if (!uid) return;
  bindAccordion();
  goToStep(1);
  loadCartSummary();
  updateCartBadge(uid, Number(localStorage.getItem(badgeKey(uid)) || 0));
});
