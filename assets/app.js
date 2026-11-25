/* Wizualizacja - Winny Zakątek (próbka). Ceny, liczba miejsc i zajęte terminy przykładowe, formularze niczego nie wysyłają. */
const B = document.body.dataset.base || '';
const PAGE = document.body.dataset.page || '';
const $ = id => document.getElementById(id);
const IMG = name => `${B}img/${name}.jpg`;

/* Rodzaje noclegu - cena za noc od niedzieli do czwartku (przykładowa) */
const UNITS = [
  {id:'a', name:'Domek w winnicy', tab:'Domek · do 4 os.', sub:'sypialnia + sofa, aneks kuchenny, łazienka', max:4, price:290, wk:50, img:'domek-drewniany-na-wynajem',
   feat:['Taras z widokiem na winorośl','Aneks kuchenny i łazienka','Miejsce na ognisko']},
  {id:'b', name:'Miejsce na kampera', tab:'Kamper · prąd i woda', sub:'kamper albo przyczepa, do 4 os.', max:4, price:90, wk:10, img:'miejsce-na-kampera',
   feat:['Podłączenie do prądu','Napełnianie wody, toaleta','Stół piknikowy i grill']},
  {id:'c', name:'Miejsce na namiot', tab:'Namiot · łąka', sub:'namiot do 4 osób', max:4, price:60, wk:10, img:'miejsce-na-namiot',
   feat:['Łąka przy winnicy','Woda i toaleta na terenie','Ognisko i altana']},
];
const TASTE = 45; // zł za osobę - przykładowo

/* Zajęte noce - przykładowe [przyjazd, wyjazd) */
const BUSY = {
  a:[['2027-04-30','2027-05-03'],['2027-05-27','2027-05-30'],['2027-06-18','2027-06-21'],['2027-07-02','2027-07-09'],['2027-07-16','2027-07-18'],['2027-07-23','2027-08-01'],['2027-08-13','2027-08-16'],['2027-08-20','2027-08-29'],['2027-09-10','2027-09-12']],
  b:[['2027-05-01','2027-05-03'],['2027-05-28','2027-05-30'],['2027-06-25','2027-06-28'],['2027-07-09','2027-07-12'],['2027-07-30','2027-08-02'],['2027-08-14','2027-08-16'],['2027-09-03','2027-09-05']],
  c:[['2027-05-28','2027-05-30'],['2027-06-11','2027-06-13'],['2027-07-16','2027-07-18'],['2027-08-06','2027-08-08'],['2027-08-13','2027-08-15']],
};
const SEASON_FROM = new Date(2027,4,1), SEASON_TO = new Date(2027,8,30); // ostatnia noc: 30.09.2027
const MIN_M = 2027*12+4, MAX_M = 2027*12+7; // lewy miesiąc kalendarza: maj - sierpień 2027
const MONTHS = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień'];
const MONTHS_GEN = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];

const d0 = s => { const [y,m,d] = String(s).split('-').map(Number); return new Date(y,m-1,d); };
const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const addDays = (d,n) => new Date(d.getFullYear(), d.getMonth(), d.getDate()+n);
const nightsBetween = (a,b) => Math.round((b-a)/864e5);
const fmt = d => `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
const zl = n => n.toLocaleString('pl-PL') + ' zł';
const nTxt = n => n === 1 ? 'noc' : ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100) ? 'noce' : 'nocy');
const osTxt = g => g === 1 ? 'osoba' : (g < 5 ? 'osoby' : 'osób');
const valid = d => d instanceof Date && !isNaN(d);
const U = id => UNITS.find(c => c.id === id);

/* Cennik przykładowy: noc z piątku i z soboty oraz długie weekendy (majówka, Boże Ciało) droższe */
const isLong = d => { const m = d.getMonth(), x = d.getDate(); return (m===3 && x===30) || (m===4 && (x<=2 || (x>=27 && x<=29))); };
const nightPrice = (u, d) => { const c = U(u); return c.price + (([5,6].includes(d.getDay()) || isLong(d)) ? c.wk : 0); };
const stayPrice = (u, a, b) => { let s = 0; for(let d = new Date(a); d < b; d = addDays(d,1)) s += nightPrice(u,d); return s; };
const isBusyNight = (u, d) => BUSY[u].some(([a,b]) => d >= d0(a) && d < d0(b));
const inSeason = d => d >= SEASON_FROM && d <= SEASON_TO;
function rangeFree(u, a, b){ for(let d = new Date(a); d < b; d = addDays(d,1)){ if(!inSeason(d) || isBusyNight(u,d)) return false; } return true; }

let unit = 'a', viewM = 2027*12+6, selIn = null, selOut = null;

function renderResults(a, b, g){
  const box = $('results'); if(!box) return;
  const n = nightsBetween(a,b);
  $('resultsHead').textContent = `${fmt(a)} - ${fmt(b)} · ${n} ${nTxt(n)} · ${g} ${osTxt(g)}`;
  box.innerHTML = UNITS.map(c => {
    const fits = g <= c.max, free = rangeFree(c.id,a,b), ok = fits && free, tot = ok ? stayPrice(c.id,a,b) : 0;
    const side = ok
      ? `<span class="avail free">Wolne w tym terminie</span><div class="total">${zl(tot)}</div><small>za ${n} ${nTxt(n)}, średnio ${zl(Math.round(tot/n))} / noc</small><button class="btn btn-honey" type="button" data-pick="${c.id}">Wybieram</button>`
      : `<span class="avail taken">${fits ? 'Zajęte w tym terminie' : `Za mało miejsc (do ${c.max} os.)`}</span><button class="btn btn-line" type="button" data-cal="${c.id}">Pokaż wolne dni</button>`;
    return `<article class="result ${ok ? '' : 'taken'}">
      <img src="${IMG(c.img)}" alt="${c.name}" loading="lazy" width="500" height="375">
      <div class="r-body"><span class="tag">do ${c.max} ${osTxt(c.max)}</span><h3>${c.name}</h3><div class="muted">${c.sub}</div><ul>${c.feat.map(f => `<li>${f}</li>`).join('')}</ul></div>
      <div class="r-side">${side}</div></article>`;
  }).join('');
  box.querySelectorAll('[data-pick]').forEach(btn => btn.onclick = () => {
    unit = btn.dataset.pick; selIn = a; selOut = b; showMonth(a); renderTabs(); renderCal(); $('kalendarz').scrollIntoView({behavior:'smooth'});
  });
  box.querySelectorAll('[data-cal]').forEach(btn => btn.onclick = () => {
    unit = btn.dataset.cal; selIn = null; selOut = null; renderTabs(); renderCal(); $('kalendarz').scrollIntoView({behavior:'smooth'});
  });
}
function showMonth(d){ viewM = Math.min(Math.max(d.getFullYear()*12 + d.getMonth(), MIN_M), MAX_M); }

function renderTabs(){
  const t = $('tabs'); if(!t) return;
  t.innerHTML = UNITS.map(c => `<button type="button" class="tab ${c.id===unit?'on':''}" data-tab="${c.id}">${c.tab}</button>`).join('');
  t.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => setUnit(b.dataset.tab));
  const on = t.querySelector('.tab.on'); if(on) t.scrollLeft = on.offsetLeft - t.offsetLeft - 8; // zakładka wybranego noclegu widoczna na telefonie
}
function monthHTML(idx){
  const y = Math.floor(idx/12), m = idx%12;
  const first = new Date(y,m,1), days = new Date(y,m+1,0).getDate(), offset = (first.getDay()+6)%7;
  const base = U(unit).price;
  let h = `<div class="month"><h4>${MONTHS[m]} ${y}</h4><div class="grid">`;
  ['pn','wt','śr','cz','pt','so','nd'].forEach(x => h += `<div class="dow">${x}</div>`);
  for(let i=0;i<offset;i++) h += `<div class="day empty"></div>`;
  for(let d=1; d<=days; d++){
    const dt = new Date(y,m,d);
    let cls = 'day', dis = false, lab = '';
    const canBeCheckout = (selIn && !selOut && dt > selIn && rangeFree(unit, selIn, dt)) || (selOut && key(dt)===key(selOut));
    if(!inSeason(dt)){ cls += ' off'; dis = !canBeCheckout; }
    else if(isBusyNight(unit,dt) && !canBeCheckout){ cls += ' busy'; dis = true; }
    else { const p = nightPrice(unit,dt); lab = `<small>${p}</small>`; if(p > base) cls += ' hot'; }
    if(selIn && key(dt)===key(selIn)) cls += ' start';
    if(selOut && key(dt)===key(selOut)) cls += ' end';
    if(selIn && selOut && dt > selIn && dt < selOut) cls += ' in-range';
    h += `<button type="button" class="${cls}" ${dis?'disabled':''} data-d="${key(dt)}" aria-label="${fmt(dt)}">${d}${lab}</button>`;
  }
  return h + `</div></div>`;
}
function renderCal(){
  if(!$('months')) return;
  $('months').innerHTML = monthHTML(viewM) + monthHTML(viewM+1);
  $('prev').disabled = viewM <= MIN_M;
  $('next').disabled = viewM >= MAX_M;
  document.querySelectorAll('#months .day[data-d]').forEach(b => b.addEventListener('click', () => clickDay(d0(b.dataset.d))));
  renderSummary();
}
function clickDay(d){
  if(!selIn || selOut || d <= selIn){ if(inSeason(d) && !isBusyNight(unit,d)){ selIn = d; selOut = null; } }
  else if(rangeFree(unit, selIn, d)){ selOut = d; }
  else if(inSeason(d) && !isBusyNight(unit,d)){ selIn = d; selOut = null; }
  renderCal();
}
function renderSummary(){
  const c = U(unit);
  $('sumCabin').textContent = c.name;
  $('sumIn').textContent = selIn ? fmt(selIn) : 'kliknij dzień w kalendarzu';
  $('sumOut').textContent = selOut ? fmt(selOut) : (selIn ? 'kliknij dzień wyjazdu' : '-');
  const n = selIn && selOut ? nightsBetween(selIn, selOut) : 0;
  $('sumNights').textContent = n ? `${n} ${nTxt(n)}` : '-';
  $('sumTotal').textContent = n ? zl(stayPrice(unit, selIn, selOut)) : '-';
  $('bookBtn').disabled = !n;
}
function setUnit(id){ unit = id; if(selIn && selOut && !rangeFree(id,selIn,selOut)) selOut = null; renderTabs(); renderCal(); }

/* wspólne okno formularza */
function modalSetup(onOpen){
  const modal = $('modal'); if(!modal) return () => {};
  const close = () => modal.classList.remove('on');
  $('mClose').onclick = close;
  modal.addEventListener('click', e => { if(e.target === modal) close(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
  modal.querySelector('form').addEventListener('submit', e => {
    e.preventDefault(); // wizualizacja - nic nie jest wysyłane
    $('mForm').style.display = 'none'; $('mOk').style.display = 'block';
  });
  return () => { $('mForm').style.display = ''; $('mOk').style.display = 'none'; onOpen && onOpen(); modal.classList.add('on'); };
}

if(PAGE === 'rezerwacja'){
  const P = new URLSearchParams(location.search);
  const DEF_IN = '2027-07-09', DEF_OUT = '2027-07-11';
  let a = d0(P.get('in') || DEF_IN), b = d0(P.get('out') || DEF_OUT), g = +(P.get('g') || 2);
  if(!valid(a) || !valid(b) || !(b > a) || !inSeason(a) || !inSeason(addDays(b,-1))){ a = d0(DEF_IN); b = d0(DEF_OUT); }
  if(!(g >= 1 && g <= 4)) g = 2;
  $('sIn').value = key(a); $('sOut').value = key(b); $('sGuests').value = String(g);
  renderResults(a,b,g);
  const wanted = U(P.get('typ'));
  if(wanted){ unit = wanted.id; if(rangeFree(unit,a,b) && g <= wanted.max){ selIn = a; selOut = b; } }
  else { const free = UNITS.find(c => rangeFree(c.id,a,b) && g <= c.max); if(free){ unit = free.id; selIn = a; selOut = b; } }
  showMonth(a); renderTabs(); renderCal();
  if(wanted) setTimeout(() => $('kalendarz').scrollIntoView(), 50);
  $('prev').onclick = () => { viewM--; renderCal(); };
  $('next').onclick = () => { viewM++; renderCal(); };
  $('searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const na = d0($('sIn').value), nb = d0($('sOut').value), ng = +$('sGuests').value;
    if(!valid(na) || !valid(nb) || !(nb > na)){ alert('Data wyjazdu musi być po dacie przyjazdu.'); return; }
    if(!inSeason(na) || !inSeason(addDays(nb,-1))){ alert('W próbce kalendarz obejmuje sezon od 1 maja do 1 października 2027.'); return; }
    history.replaceState(null, '', `?in=${key(na)}&out=${key(nb)}&g=${ng}`);
    renderResults(na,nb,ng);
    const free = UNITS.find(c => rangeFree(c.id,na,nb) && ng <= c.max);
    if(free){ unit = free.id; selIn = na; selOut = nb; } else { selIn = null; selOut = null; }
    showMonth(na); renderTabs(); renderCal();
    $('resultsHead').scrollIntoView({behavior:'smooth'});
  });

  const total = () => {
    const stay = stayPrice(unit, selIn, selOut), t = $('addTaste').checked ? TASTE * +$('tasteN').value : 0;
    $('mTotal').textContent = zl(stay + t) + (t ? ` (w tym degustacja ${zl(t)})` : '');
  };
  const open = modalSetup(() => {
    const c = U(unit), n = nightsBetween(selIn,selOut);
    $('mSummary').innerHTML = `<b>${c.name}</b><br>${fmt(selIn)} - ${fmt(selOut)} · ${n} ${nTxt(n)}<br>Nocleg: <b>${zl(stayPrice(unit,selIn,selOut))}</b>`;
    total();
  });
  $('addTaste').onchange = () => { $('tastePeople').hidden = !$('addTaste').checked; total(); };
  $('tasteN').onchange = total;
  $('bookBtn').onclick = open;
}

if(PAGE === 'degustacje'){
  const open = modalSetup();
  $('tasteBtn').onclick = open;
  $('tN').onchange = () => { $('tTotal').textContent = zl(TASTE * +$('tN').value); };
}

/* galeria z powiększeniem */
const gal = $('gallery');
if(gal){
  const items = [...gal.querySelectorAll('button')];
  const lb = $('lb'), lbImg = $('lbImg'); let lbI = 0;
  const show = i => { lbI = (i + items.length) % items.length; const im = items[lbI].querySelector('img'); lbImg.src = im.src; lbImg.alt = im.alt; lb.classList.add('on'); };
  items.forEach((b,i) => b.onclick = () => show(i));
  $('lbPrev').onclick = () => show(lbI-1);
  $('lbNext').onclick = () => show(lbI+1);
  $('lbClose').onclick = () => lb.classList.remove('on');
  lb.addEventListener('click', e => { if(e.target === lb) lb.classList.remove('on'); });
  document.addEventListener('keydown', e => {
    if(!lb.classList.contains('on')) return;
    if(e.key === 'Escape') lb.classList.remove('on');
    if(e.key === 'ArrowRight') show(lbI+1);
    if(e.key === 'ArrowLeft') show(lbI-1);
  });
}
