// ===== Tara Palawan app =====
const $ = id => document.getElementById(id);
const $$ = s => Array.from(document.querySelectorAll(s));
const toast = $('toast');
let toastT;
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ---- cookie bar (GDPR) ----
try {
  if (!localStorage.getItem('tp_cookie') && $('cookieBar')) $('cookieBar').classList.remove('hidden');
  $('cookieOk')?.addEventListener('click', () => { localStorage.setItem('tp_cookie', '1'); $('cookieBar').classList.add('hidden'); });
  $('cookieNo')?.addEventListener('click', () => { localStorage.setItem('tp_cookie', '0'); $('cookieBar').classList.add('hidden'); });
} catch (e) {}

// ---- nav / progress / toTop / reveal ----
const menuBtn = $('menuBtn'), mobileMenu = $('mobileMenu'), nav = $('nav'), progress = $('progress'), toTop = $('toTop');
menuBtn?.addEventListener('click', () => { mobileMenu.classList.toggle('open'); menuBtn.classList.toggle('open'); });
mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mobileMenu.classList.remove('open'); menuBtn.classList.remove('open'); }));
window.addEventListener('scroll', () => {
  const y = scrollY;
  nav?.classList.toggle('scrolled', y > 10);
  const h = document.documentElement.scrollHeight - innerHeight;
  if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  toTop?.classList.toggle('show', y > 600);
}, { passive: true });
toTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
$$('.reveal').forEach(el => io.observe(el));

// ---- copy buttons ----
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  const code = b.dataset.copy;
  try { await navigator.clipboard.writeText(code); }
  catch (err) { const i = document.createElement('input'); i.value = code; document.body.appendChild(i); i.select(); document.execCommand('copy'); i.remove(); }
  showToast('Copied: ' + code);
});

// ---- currency converter ----
const RATES = { PHP: 1, USD: 0.017, EUR: 0.016 };
let cur = 'PHP';
function fmt(v) { const r = v * RATES[cur]; return cur === 'PHP' ? '₱' + Math.round(v).toLocaleString('en-PH') : (cur === 'USD' ? '$' : '€') + r.toLocaleString(undefined, { maximumFractionDigits: 0 }); }
function refreshPrices() { $$('[data-php]').forEach(el => el.textContent = fmt(+el.dataset.php)); }
$('curSel')?.addEventListener('change', e => { cur = e.target.value; refreshPrices(); updateFx(); calc(); });
function updateFx() { const a = parseFloat($('fxAmt')?.value) || 0; if ($('fxOut')) $('fxOut').textContent = cur === 'PHP' ? '$' + (a * RATES.USD).toFixed(0) : '₱' + Math.round(a / RATES[cur]).toLocaleString('en-PH'); }
$('fxAmt')?.addEventListener('input', updateFx); updateFx();

// ---- language (EN/TL demo) ----
$('langSel')?.addEventListener('change', e => showToast(e.target.value === 'tl' ? 'Maligayang pagdating! TL mode: key headings translated soon.' : 'Welcome back to English.'));

// ---- nav search autocomplete ----
const INDEX = ['El Nido Tour A', 'Coron Ultimate Lagoon', 'Coron Wreck Dive', 'Underground River', 'Port Barton Island Day', 'Balabac 3D2N', 'El Nido Town Hostel', 'Corong-Corong Bay Hotel', 'Lio Beach Resort', 'Coron Harbor Hotel', 'El Nido Night Market', 'Ka Lui PPS', 'Coron Harbor Food Row'];
$('navSearch')?.addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase(), box = $('navSuggest');
  if (!q) { box.classList.add('hidden'); return; }
  const hits = INDEX.filter(n => n.toLowerCase().includes(q)).slice(0, 6);
  box.innerHTML = hits.length ? hits.map(h => `<div data-goto="${h}">${h}</div>`).join('') : '<div>No matches — try “lagoon” or “Coron”.</div>';
  box.classList.remove('hidden');
  box.querySelectorAll('[data-goto]').forEach(d => d.addEventListener('click', () => {
    box.classList.add('hidden'); $('navSearch').value = d.dataset.goto;
    document.querySelector('#todo')?.scrollIntoView({ behavior: 'smooth' });
    showToast(d.dataset.goto + ' — see Tours section.');
  }));
});

// ---- date pickers: no past dates, sensible range ----
const todayISO = new Date().toISOString().slice(0, 10);
['sFrom', 'sTo', 'bkDate', 'trDate'].forEach(id => { const el = $(id); if (el) el.min = todayISO; });
$('sFrom')?.addEventListener('change', e => { if ($('sTo')) { $('sTo').min = e.target.value; if ($('sTo').value && $('sTo').value < e.target.value) $('sTo').value = e.target.value; } });
function prettyDate(iso) { if (!iso) return ''; try { return new Date(iso + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return iso; } }

// ---- hero search ----
$('heroSearch')?.addEventListener('submit', e => {
  e.preventDefault();
  const w = $('sWhere').value || 'Palawan';
  const from = $('sFrom').value, to = $('sTo').value;
  const when = from ? `${prettyDate(from)}${to && to !== from ? ' → ' + prettyDate(to) : ''}` : 'flexible dates';
  showToast(`Searching ${w} • ${when} • ${$('sPax').value} pax…`);
  document.querySelector('#todo')?.scrollIntoView({ behavior: 'smooth' });
});

// ---- weather + PHT time ----
function tickTime() { try { const t = new Date().toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' }); if ($('wxTime')) $('wxTime').textContent = t; } catch (e) {} }
tickTime(); setInterval(tickTime, 30000);
fetch('https://api.open-meteo.com/v1/forecast?latitude=11.2&longitude=119.4&current=temperature_2m&timezone=Asia%2FManila').then(r => r.json()).then(j => {
  const t = Math.round(j.current.temperature_2m);
  if ($('wxTemp')) $('wxTemp').textContent = t + '°C';
  if ($('wxBig')) $('wxBig').textContent = `El Nido ${t}°C right now — ${t > 32 ? 'hot & calm' : 'pleasant seas'}. Dry season Nov–May.`;
}).catch(() => {});

// ---- wishlist ----
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
let wish = store.get('tp_wish', []);
function paintWish() {
  if ($('wishCount')) $('wishCount').textContent = wish.length + ' saved';
  $$('.wish').forEach(b => {
    const name = b.closest('[data-name]')?.dataset.name;
    b.textContent = wish.includes(name) ? '♥ Saved' : '♡ Save';
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest('.wish'); if (!b) return;
  const name = b.closest('[data-name]')?.dataset.name; if (!name) return;
  wish = wish.includes(name) ? wish.filter(w => w !== name) : [...wish, name];
  store.set('tp_wish', wish); paintWish();
  showToast(wish.includes(name) ? name + ' saved to wishlist.' : name + ' removed.');
});
$('wishView')?.addEventListener('click', () => showToast(wish.length ? 'Saved: ' + wish.join(', ') : 'Wishlist is empty — tap ♡ Save.'));
paintWish();

// ---- tour filters ----
function filterTours() {
  const c = $('fCat').value, p = $('fPrice').value, d = $('fDur').value, r = +$('fRate').value;
  $$('#tourGrid .tour').forEach(t => {
    const ok = (c === 'all' || t.dataset.cat === c) &&
      (p === 'all' || (p === 'low' && +t.dataset.price < 1600) || (p === 'mid' && +t.dataset.price >= 1600 && +t.dataset.price <= 2200) || (p === 'high' && +t.dataset.price > 2200)) &&
      (d === 'all' || t.dataset.dur === d) && (+t.dataset.rate / 10 >= r);
    t.classList.toggle('hide', !ok);
  });
}
['fCat', 'fPrice', 'fDur', 'fRate'].forEach(id => $(id)?.addEventListener('change', filterTours));

// ---- hotel filters + map ----
function filterHotels() {
  const t = $('hType').value, p = $('hPrice').value, r = +$('hRate').value, acc = $('hAccess').checked;
  $$('#hotelGrid .hotel').forEach(h => {
    const ok = (t === 'all' || h.dataset.type === t) &&
      (p === 'all' || (p === 'low' && +h.dataset.price < 1500) || (p === 'mid' && +h.dataset.price >= 1500 && +h.dataset.price <= 4000) || (p === 'high' && +h.dataset.price > 4000)) &&
      (+h.dataset.rate / 10 >= r / 10) && (!acc || h.dataset.access === '1');
    h.classList.toggle('hide', !ok);
  });
}
['hType', 'hPrice', 'hRate'].forEach(id => $(id)?.addEventListener('change', filterHotels));
$('hAccess')?.addEventListener('change', filterHotels);
$('mapToggle')?.addEventListener('click', () => { $('hotelMap').classList.toggle('hidden'); $('mapToggle').textContent = $('hotelMap').classList.contains('hidden') ? 'Map view' : 'Hide map'; });

// ---- food diet filter ----
$$('#foodFilter .chip').forEach(c => c.addEventListener('click', () => {
  $$('#foodFilter .chip').forEach(x => x.classList.remove('active')); c.classList.add('active');
  const f = c.dataset.diet;
  $$('#foodGrid .resto').forEach(r => r.classList.toggle('hide', f !== 'all' && !r.dataset.diet.includes(f)));
}));

// ---- modals ----
function openModal(id) { $(id)?.classList.add('open'); }
function closeModals() { $$('.modal').forEach(m => m.classList.remove('open')); }
document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModals(); if (e.target.classList?.contains('modal')) closeModals(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });

// ---- booking engine: details, stepper, promo, breakdown ----
const PROMOS = { PALAWAN10: { pct: 10, label: '10% off' }, STAY15: { pct: 15, label: '15% off' }, FOODIE5: { flat: 500, min: 2000, label: '₱500 off' } };
const booking = { item: '', unit: 0, per: 'person', guests: 2, promo: '', pay: 'Card' };
function bookingTotal() {
  const sub = booking.unit * booking.guests;
  let disc = 0;
  const p = PROMOS[booking.promo];
  if (p) { disc = p.pct ? Math.round(sub * p.pct / 100) : (sub >= (p.min || 0) ? p.flat : 0); }
  return { sub, disc, total: Math.max(0, sub - disc) };
}
function renderBooking() {
  $('bookItem').textContent = booking.item;
  $('bookMeta').textContent = `₱${booking.unit.toLocaleString('en-PH')} per ${booking.per} × ${booking.guests} guest${booking.guests > 1 ? 's' : ''}`;
  $('bookUnit').textContent = fmt(booking.unit);
  $('bkGuests').value = booking.guests;
  const { sub, disc, total } = bookingTotal();
  $('bookBreak').innerHTML =
    `<div><span>Subtotal (${booking.guests} × ${fmt(booking.unit)})</span><strong>${fmt(sub)}</strong></div>` +
    (booking.promo ? `<div class="disc"><span>Promo ${booking.promo}</span><strong>−${fmt(disc)}</strong></div>` : `<div><span>Promo</span><strong class="muted">—</strong></div>`) +
    `<div class="grand"><span>Total (${booking.pay})</span><strong>${fmt(total)}</strong></div>`;
  $('bookAmt').textContent = fmt(total);
}
document.addEventListener('click', e => {
  const b = e.target.closest('.book'); if (!b) return;
  booking.item = b.dataset.item; booking.unit = +b.dataset.price;
  booking.per = b.closest('.hotel') ? 'night' : 'person';
  booking.guests = 2; booking.promo = ''; booking.pay = 'Card';
  $('bkPromo').value = ''; $('bkPromo').classList.remove('applied');
  $$('#bkPayRow .pay').forEach(p => p.classList.toggle('active', p.dataset.pay === 'Card'));
  $('bookTitle').textContent = 'Book: ' + booking.item;
  if ($('bkDate')) { $('bkDate').value = ''; $('bkDate').min = todayISO; }
  renderBooking(); openModal('bookModal');
});
$('gMinus')?.addEventListener('click', () => { booking.guests = Math.max(1, booking.guests - 1); renderBooking(); });
$('gPlus')?.addEventListener('click', () => { booking.guests = Math.min(20, booking.guests + 1); renderBooking(); });
$('bkApply')?.addEventListener('click', () => {
  const code = $('bkPromo').value.trim().toUpperCase();
  if (!code) { booking.promo = ''; renderBooking(); return; }
  const p = PROMOS[code];
  if (!p) { showToast(code + ' is not a valid code. Try PALAWAN10.'); return; }
  const { sub } = bookingTotal();
  if (p.min && sub < p.min) { showToast(code + ` needs a subtotal of ₱${p.min.toLocaleString()}.`); return; }
  booking.promo = code; $('bkPromo').classList.add('applied'); renderBooking();
  showToast(code + ' applied — ' + p.label + '!');
});
$('bkPromo')?.addEventListener('input', e => { if (!e.target.value) { booking.promo = ''; e.target.classList.remove('applied'); renderBooking(); } });
$$('#bkPayRow .pay').forEach(p => p.addEventListener('click', () => {
  $$('#bkPayRow .pay').forEach(x => x.classList.remove('active'));
  p.classList.add('active'); booking.pay = p.dataset.pay; renderBooking();
}));
$('bookForm')?.addEventListener('submit', e => {
  e.preventDefault();
  if ($('bkDate').value && $('bkDate').value < todayISO) { showToast('Pick a future date — past dates are not allowed.'); return; }
  const { total } = bookingTotal();
  const hist = store.get('tp_books', []);
  hist.push({ item: booking.item, date: $('bkDate').value || prettyDate(todayISO), guests: booking.guests, pay: booking.pay, promo: booking.promo, total });
  store.set('tp_books', hist); closeModals();
  showToast(`Booked ${booking.item} (${booking.guests} pax, ${booking.pay}) — ${fmt(total)}. Voucher sent!`);
});

// ---- transfer form ----
$('transferForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const d = $('trDate').value;
  if (d && d < todayISO) { showToast('Pick a future date for your transfer.'); return; }
  showToast('Transfer reserved: ' + $('trRoute').value + ' • ' + (d ? prettyDate(d) : 'flexible date'));
});

// ---- trip planner ----
const plan = { 'Day 1': [], 'Day 2': [], 'Day 3': [] };
function renderPlan() {
  let total = 0;
  $$('.day').forEach(d => {
    const day = d.dataset.day, box = d.querySelector('.drop');
    box.innerHTML = '';
    plan[day].forEach((it, i) => {
      total += it.cost;
      const el = document.createElement('div');
      el.className = 'trip-item'; el.draggable = true;
      el.innerHTML = `<span>${it.name} • ₱${it.cost.toLocaleString()}</span><button data-rm="${day}:${i}">✕</button>`;
      el.addEventListener('dragstart', ev => ev.dataTransfer.setData('text/plain', JSON.stringify({ from: day, i })));
      box.appendChild(el);
    });
  });
  if ($('planTotal')) $('planTotal').textContent = 'Total: ₱' + total.toLocaleString('en-PH');
}
document.addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  if (add) {
    const card = add.closest('.idea');
    plan[add.dataset.add].push({ name: card.dataset.name, cost: +card.dataset.cost });
    renderPlan(); return;
  }
  const rm = e.target.closest('[data-rm]');
  if (rm) { const [day, i] = rm.dataset.rm.split(':'); plan[day].splice(+i, 1); renderPlan(); }
});
$$('.idea').forEach(el => el.addEventListener('dragstart', ev => ev.dataTransfer.setData('text/plain', JSON.stringify({ idea: el.dataset.name, cost: el.dataset.cost }))));
$$('.day').forEach(d => {
  d.addEventListener('dragover', e => { e.preventDefault(); d.classList.add('over'); });
  d.addEventListener('dragleave', () => d.classList.remove('over'));
  d.addEventListener('drop', e => {
    e.preventDefault(); d.classList.remove('over');
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.idea) plan[d.dataset.day].push({ name: data.idea, cost: +data.cost });
      else if (data.from) { const [it] = plan[data.from].splice(data.i, 1); plan[d.dataset.day].push(it); }
      renderPlan();
    } catch (err) {}
  });
});
$('autoPlan')?.addEventListener('click', () => {
  plan['Day 1'] = [{ name: 'Tour A', cost: 1800 }]; plan['Day 2'] = [{ name: 'Nacpan sunset', cost: 300 }]; plan['Day 3'] = [{ name: 'Coron lagoons', cost: 2000 }];
  renderPlan(); showToast('3-day auto plan ready. Drag to rearrange.');
});
$('saveTrip')?.addEventListener('click', () => { store.set('tp_trip', plan); showToast('Trip saved on this device.'); });
(function restore() { const s = store.get('tp_trip', null); if (s) Object.assign(plan, s); renderPlan(); })();
$('shareTrip')?.addEventListener('click', async () => {
  const txt = Object.entries(plan).map(([d, items]) => d + ': ' + (items.map(i => i.name).join(', ') || '—')).join(' | ');
  try { await navigator.clipboard.writeText('My Palawan plan — ' + txt); showToast('Trip link copied — share it!'); }
  catch (e) { showToast(txt); }
});

// ---- budget calculator ----
let shownTotal = 0;
function animateTotal(to) {
  const el = $('bTotal'); if (!el) return;
  const from = shownTotal, start = performance.now();
  (function fr(t) { const k = Math.min(1, (t - start) / 500); el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(fr); else shownTotal = to; })(start);
}
function calc() {
  if (!$('bDays')) return;
  const days = +$('bDays').value || 0, hotel = +$('bHotel').value || 0, food = +$('bFood').value || 0, tours = +$('bTours').value || 0, trans = +$('bTrans').value || 0;
  const stay = days * hotel, eat = days * food, tour = tours * 1800, total = stay + eat + tour + trans;
  animateTotal(total);
  $('bBreak').innerHTML = `<div><span>Stay</span><strong>${fmt(stay)}</strong></div><div><span>Food</span><strong>${fmt(eat)}</strong></div><div><span>Tours</span><strong>${fmt(tour)}</strong></div><div><span>Transport</span><strong>${fmt(trans)}</strong></div>`;
  const set = (id, v) => $(id).style.width = (total ? (v / total) * 100 : 0) + '%';
  set('bBarStay', stay); set('bBarFood', eat); set('bBarTour', tour); set('bBarTrans', trans);
}
['bDays', 'bHotel', 'bFood', 'bTours', 'bTrans'].forEach(id => { $(id)?.addEventListener('input', calc); });
calc();

// ---- packing checklist ----
function paintPack() {
  const boxes = $$('#packList input');
  const done = boxes.filter(b => b.checked).length;
  if ($('packCount')) $('packCount').textContent = `(${done}/${boxes.length})`;
  if ($('packBar')) $('packBar').style.width = (boxes.length ? (done / boxes.length) * 100 : 0) + '%';
  boxes.forEach(b => b.closest('label').classList.toggle('done', b.checked));
  store.set('tp_pack', boxes.map(b => b.checked));
}
(function restorePack() { const s = store.get('tp_pack', []); $$('#packList input').forEach((b, i) => b.checked = !!s[i]); paintPack(); })();
document.addEventListener('change', e => { if (e.target.closest('#packList')) paintPack(); });

// ---- offline pack ----
$('offlineBtn')?.addEventListener('click', () => {
  store.set('tp_offline', { saved: Date.now(), note: 'Palawan essentials cached' });
  showToast('Offline pack saved — essentials available without internet.');
});

// ---- SOS ----
$('sosBtn')?.addEventListener('click', () => openModal('sosModal'));

// ---- phrases: tap to hear + copy ----
document.addEventListener('click', e => {
  const b = e.target.closest('[data-say]'); if (!b) return;
  const txt = b.dataset.say;
  try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(txt)); } catch (err) {}
});

// ---- map pins ----
const PINQ = { all: 'Palawan,+Philippines', see: 'El+Nido+Big+Lagoon', stay: 'hotels+El+Nido+Palawan', eat: 'restaurants+Coron+Palawan', atm: 'ATM+Puerto+Princesa', transit: 'El+Nido+Ferry+Port' };
$$('#pinFilter .chip').forEach(c => c.addEventListener('click', () => {
  $$('#pinFilter .chip').forEach(x => x.classList.remove('active')); c.classList.add('active');
  if ($('mainMap')) $('mainMap').src = `https://www.google.com/maps?q=${PINQ[c.dataset.pin]}&output=embed`;
}));

// ---- seed traveler testimonials on first visit ----
(function seedReviews() {
  if (store.get('tp_reviews', null) === null) {
    store.set('tp_reviews', [
      { place: 'El Nido Tour A', rate: '5', text: 'Big Lagoon at 7 AM was unreal — our guide timed every stop to dodge crowds. — Sofia, Spain' },
      { place: 'Coron Ultimate Lagoon', rate: '5', text: 'Kayangan Lake lived up to the hype, and the wreck snorkel was a bonus. — Daniel, Germany' },
      { place: 'Underground River', rate: '4', text: 'Book the earliest slot for shorter lines and better photos. — Priya, India' }
    ]);
  }
})();
function renderList(key, boxId, fmtFn) {
  const box = $(boxId); if (!box) return;
  const items = store.get(key, []);
  box.innerHTML = items.length ? items.map(fmtFn).join('') : '<p class="muted small">Be the first — post above.</p>';
}
renderList('tp_reviews', 'reviewList', r => `<div class="voucher"><span><strong>${r.place}</strong> • ${'★'.repeat(r.rate)}<br><small>${r.text}</small></span></div>`);
renderList('tp_qa', 'qaList', q => `<div class="voucher"><span><strong>Q:</strong> ${q.q}<br><small class="muted">Tip: ferries need buffer days; book Tour A early in peak.</small></span></div>`);
$('reviewForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const items = store.get('tp_reviews', []);
  items.unshift({ place: $('rvPlace').value, rate: $('rvRate').value, text: $('rvText').value });
  store.set('tp_reviews', items); e.target.reset();
  renderList('tp_reviews', 'reviewList', r => `<div class="voucher"><span><strong>${r.place}</strong> • ${'★'.repeat(r.rate)}<br><small>${r.text}</small></span></div>`);
  showToast('Salamat! Review posted.');
});
$('qaForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const items = store.get('tp_qa', []); items.unshift({ q: $('qaQ').value });
  store.set('tp_qa', items); e.target.reset();
  renderList('tp_qa', 'qaList', q => `<div class="voucher"><span><strong>Q:</strong> ${q.q}<br><small class="muted">Tip:ask operators for license + life vests.</small></span></div>`);
  showToast('Question posted — travelers will answer.');
});

// ---- promos ----
function renderPromos() {
  const list = store.get('tp_promos', []);
  if ($('promoCount')) $('promoCount').textContent = `(${list.length})`;
  const box = $('myPromos'); if (!box) return;
  box.innerHTML = list.length ? list.map(p => `<div class="voucher"><span><strong>${p.code}</strong> • ${p.name}<br><small>${p.date}</small></span><button class="btn ghost small" data-del="${p.id}">Remove</button></div>`).join('') : '<p class="muted small">Nothing claimed yet.</p>';
  box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { store.set('tp_promos', store.get('tp_promos', []).filter(p => String(p.id) !== b.dataset.del)); renderPromos(); }));
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-del]')) return;
  const cl = e.target.closest('.promo-claim');
  if (cl) { const card = cl.closest('.promo-card'); $('cCode').value = card.dataset.promo; $('modalTitle').textContent = 'Claim: ' + card.dataset.promo; openModal('promoModal'); }
  if (e.target.closest('#claimHeroBtn')) { $('cCode').value = 'PALAWAN10'; $('modalTitle').textContent = 'Claim: PALAWAN10'; openModal('promoModal'); }
  const del = e.target.closest('[data-del]');
  if (del) { store.set('tp_promos', store.get('tp_promos', []).filter(p => String(p.id) !== del.dataset.del)); renderPromos(); }
});
$('claimForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const list = store.get('tp_promos', []);
  list.push({ id: Date.now(), code: $('cCode').value, name: $('cName').value, date: new Date().toLocaleDateString('en-PH') });
  store.set('tp_promos', list); renderPromos(); closeModals(); e.target.reset();
  showToast('Promo claimed! Show it to the partner.');
});
$('clearPromos')?.addEventListener('click', () => { store.set('tp_promos', []); renderPromos(); });
$('partnerForm')?.addEventListener('submit', e => { e.preventDefault(); e.target.reset(); showToast('Promo request received — reply within 3 days.'); });
function tickPromo() {
  const now = new Date(), end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  let s = Math.max(0, Math.floor((end - now) / 1000));
  const el = $('promoTimer'); if (!el) return;
  el.textContent = `${Math.floor(s / 86400)}d ${String(Math.floor(s % 86400 / 3600)).padStart(2, '0')}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
tickPromo(); setInterval(tickPromo, 1000); renderPromos();

// ---- newsletter / alerts / contact / auth ----
$('newsForm')?.addEventListener('submit', e => { e.preventDefault(); e.target.reset(); showToast('Subscribed! Deals land monthly.'); });
$('dealAlert')?.addEventListener('submit', e => { e.preventDefault(); e.target.reset(); showToast('Deal alerts on — check your inbox.'); });
$('contactForm')?.addEventListener('submit', e => { e.preventDefault(); e.target.reset(); showToast('Message sent — reply within 24h.'); });
$('authBtn')?.addEventListener('click', () => openModal('authModal'));
$('authForm')?.addEventListener('submit', e => { e.preventDefault(); store.set('tp_user', $('aEmail').value); $('authBtn').textContent = $('aEmail').value.split('@')[0]; closeModals(); showToast('Signed in — wishlist & trips sync on this device.'); });
(function restoreUser() { const u = store.get('tp_user', ''); if (u && $('authBtn')) $('authBtn').textContent = u.split('@')[0]; })();

// ---- a11y panel ----
$('a11yBtn')?.addEventListener('click', () => $('a11yPanel').classList.toggle('hidden'));
$$('#a11yPanel [data-a11y]').forEach(b => b.addEventListener('click', () => {
  document.body.classList.remove('big', 'contrast');
  if (b.dataset.a11y === 'big') document.body.classList.add('big');
  if (b.dataset.a11y === 'contrast') document.body.classList.add('contrast');
  showToast('Accessibility: ' + b.textContent);
}));

// ---- AI chatbot (rule-based) ----
$('chatFab')?.addEventListener('click', () => $('chatPanel').classList.toggle('hidden'));
$('chatX')?.addEventListener('click', () => $('chatPanel').classList.add('hidden'));
$('chatForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const q = $('chatIn').value.trim(); if (!q) return;
  $('chatLog').insertAdjacentHTML('beforeend', `<p class="me">${q}</p>`);
  const l = q.toLowerCase(); let a = 'Great question! For that, check the Planner + Essentials sections — or ask about “7-day plan”, “budget”, “El Nido vs Coron”, “ferry”, “visa”.';
  if (/7.day|itinerary|plan/.test(l)) a = '7-day best: 3N El Nido (Tours A+C) → ferry → 3N Coron (lagoons+wrecks) + 1 buffer night. Open-jaw flights ENI in / USU out.';
  else if (/budget|cost|price/.test(l)) a = 'Mid-range ≈ ₱3,500/day. Try the Budget calculator in Planner — hostels ₱900, tours ₱1,400–2,200, vans ₱600–800.';
  else if (/coron.*nido|nido.*coron|which/.test(l)) a = 'El Nido = lagoons & beaches (first-timers). Coron = wrecks & lakes (divers). 7+ days? Do both via ferry.';
  else if (/ferry|boat/.test(l)) a = 'El Nido↔Coron fast ferry, 4–5h, ₱1,800–2,200. Book 2 days ahead in peak; keep a buffer day Dec–Feb.';
  else if (/visa|etravel|entry/.test(l)) a = 'Most passports get 30 days visa-free. Register free at etravel.gov.ph within 72h before arrival.';
  else if (/best time|when|weather|season/.test(l)) a = 'Nov–May is dry & calm. Peak Dec–Apr (book early). Jun–Oct is cheaper but rainy.';
  else if (/safe|sos|emergency|hospital/.test(l)) a = 'Tourist hubs are generally safe. Emergency 911. Hospitals in El Nido, Coron & PPS — see Safety section.';
  else if (/food|eat|halal|vegan/.test(l)) a = 'Try dampa grills, croc sisig & tamilok in PPS. Use the Food filters for halal / vegan / gluten-free.';
  $('chatIn').value = '';
  $('chatLog').insertAdjacentHTML('beforeend', `<p class="bot">${a}</p>`);
  $('chatLog').scrollTop = 99999;
});

// ---- destination video player ----
function stopVideo() { const f = $('videoFrame'); if (f) f.removeAttribute('src'); }
function playVideo(id, title) {
  const frame = $('videoFrame'); if (!frame || !id) return;
  frame.loading = 'eager';
  $('videoTitle').textContent = title || 'Destination guide';
  frame.src = `https://www.youtube.com/embed/${id}?rel=0&autoplay=1&playsinline=1`;
  $('videoLink').href = `https://youtu.be/${id}`;
  openModal('videoModal');
}
document.addEventListener('click', e => {
  const w = e.target.closest('.watch-btn');
  if (w) { playVideo(w.dataset.yt, w.dataset.title); return; }
  const t = e.target.closest('.card-top img.thumb');
  if (t) { const card = t.closest('.card-top').querySelector('.watch-btn'); if (card) playVideo(card.dataset.yt, card.dataset.title); }
});
document.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target.classList?.contains('modal')) setTimeout(() => { if (!$('videoModal')?.classList.contains('open')) stopVideo(); }, 350); });
addEventListener('keydown', e => { if (e.key === 'Escape') stopVideo(); });

// ---- PWA ----
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

// ---- DOT trust badges on all tours ----
$$('#tourGrid .tour .card-body').forEach(b => b.insertAdjacentHTML('afterbegin', '<span class="dot-badge">✓ DOT-accredited operator</span>'));

// ---- map place pins ----
Object.assign(PINQ, { elnido: 'El+Nido+Big+Lagoon', coron: 'Kayangan+Lake+Coron', pps: 'Puerto+Princesa+Underground+River', longbeach: 'Long+Beach+San+Vicente+Palawan', portbarton: 'Port+Barton+San+Vicente', balabac: 'Balabac+Palawan' });

// ---- season meter: highlight current month ----
(function seasonNow() {
  try {
    const m = +new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })).getMonth();
    const cells = $$('#seasonMeter .m');
    if (cells[m]) cells[m].classList.add('now');
    const dry = [0, 1, 2, 3, 4, 10, 11].includes(m);
    if ($('nowMonth')) $('nowMonth').textContent = dry ? 'This month: dry season — perfect for lagoons' : 'This month: habagat — expect rain, book flexible tours';
  } catch (e) {}
})();

// ---- fee tracker ----
function paintFees() {
  const boxes = $$('#feeList input'); if (!boxes.length) return;
  const done = boxes.filter(b => b.checked).length;
  if ($('feeCount')) $('feeCount').textContent = `(${done}/${boxes.length})`;
  boxes.forEach(b => b.closest('label').classList.toggle('done', b.checked));
  store.set('tp_fees', boxes.map(b => b.checked));
}
(function restoreFees() { const s = store.get('tp_fees', []); $$('#feeList input').forEach((b, i) => b.checked = !!s[i]); paintFees(); })();
document.addEventListener('change', e => { if (e.target.closest('#feeList')) { paintFees(); if (($('feeCount')?.textContent || '').includes('(3/3)')) showToast('All permits sorted — smooth sailing!'); } });

// ---- route planner ----
$$('#routeOpts .route').forEach(r => r.addEventListener('click', () => {
  $$('#routeOpts .route').forEach(x => x.classList.remove('active'));
  r.classList.add('active');
  if ($('routeOut')) $('routeOut').textContent = `${r.querySelector('strong').textContent} — about ${r.dataset.time}, ≈₱${(+r.dataset.cost).toLocaleString('en-PH')}. Book 2 days ahead in peak.`;
}));

// ---- 60-second quiz ----
const QUIZ = {
  adventure: [['Tour A', 1800], ['Coron lagoons', 2000], ['Underground River', 2200]],
  chill: [['Nacpan sunset', 300], ['Long Beach slow day', 300], ['Firefly cruise', 1200]],
  foodie: [['Dampa seafood crawl', 1500], ['Ka Lui dinner', 800], ['Port Barton lunch tour', 1400]],
  family: [['Underground River', 2200], ['Honda Bay easy day', 1600], ['Nacpan sunset', 300]]
};
$('quizBtn')?.addEventListener('click', () => openModal('quizModal'));
$$('#quizModal [data-quiz]').forEach(b => b.addEventListener('click', () => {
  const picks = QUIZ[b.dataset.quiz];
  ['Day 1', 'Day 2', 'Day 3'].forEach((d, i) => plan[d] = [{ name: picks[i][0], cost: picks[i][1] }]);
  renderPlan(); closeModals();
  document.querySelector('#planner')?.scrollIntoView({ behavior: 'smooth' });
  showToast(`Your ${b.dataset.quiz} 3-day plan is ready — tweak it below!`);
}));

// ---- offline area guides (real file download) ----
const AREA_GUIDE = {
  'El Nido': 'EL NIDO OFFLINE GUIDE\nTours: A(1800) B(1600) C(1800) D(1600) +200 eco-fee/10d\nHospital: El Nido Community Hospital, Buena Suerte\nCash: ATMs in town, none on islands\nFerry to Coron: 4-5h, P1800-2200, AM sailing\nEmergency: 911',
  'Port Barton': 'PORT BARTON OFFLINE GUIDE\nIsland tour: P1200-1500, turtles + German/Starfish Is\nCash ONLY: no ATMs — bring pesos\nPower cuts at night are normal\nVan: PPS 3-4h P400-500\nEmergency: 911'
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-offline]'); if (!b) return;
  const txt = AREA_GUIDE[b.dataset.offline] || 'Tara Palawan offline pack';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
  a.download = `tara-palawan-${b.dataset.offline.toLowerCase().replace(/ /g, '-')}-offline.txt`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  showToast(b.dataset.offline + ' offline guide downloaded.');
});

// ---- El Nido sunset countdown (Manila time) ----
function sunTick() {
  const el = $('sunCount'); if (!el) return;
  try {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const s = new Date(now); s.setHours(18, 5, 0, 0);
    let mins = Math.round((s - now) / 60000); if (mins < 0) mins += 1440;
    el.textContent = `${Math.floor(mins / 60)}h ${mins % 60}m`;
  } catch (e) { el.textContent = '6:05 PM'; }
}
sunTick(); setInterval(sunTick, 60000);

refreshPrices();
