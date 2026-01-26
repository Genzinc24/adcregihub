// Utilities
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// Hide loader when ready
window.addEventListener('load', ()=> setTimeout(()=> $('#loader')?.classList.add('hidden'), 350));

// Navigation tabs
const panes = $$('[data-pane]');
const links = $$('.nav-list a, .tile, .hero a, .footer a, .brand');
links.forEach(l=>{
  l.addEventListener('click', e=>{
    const tab = l.getAttribute('data-tab');
    if(!tab) return;
    e.preventDefault();
    showPane(tab);
  });
});
function showPane(id){
  panes.forEach(p=>p.hidden = !(p.id===id || (id==='home' && p.id==='home')));
  $$('.nav-list a').forEach(a=>a.classList.toggle('active', a.dataset.tab===id));
  if(id==='calendar' && window._calendar) window._calendar.updateSize();
  window.scrollTo({top:0, behavior:'smooth'});
}

// Mobile nav toggle
const nav = $('.nav');
$('.nav-toggle')?.addEventListener('click', ()=> nav.classList.toggle('open'));

// Footer year
$('#year') && ($('#year').textContent = new Date().getFullYear());

// Carousel
(function(){
  const root = $('#heroCarousel');
  if(!root) return;
  const slides = $$('.slide', root);
  const dots = $('.dots', root);
  let i=0, timer;
  function go(n){
    slides[i].classList.remove('is-active');
    dots.children[i]?.classList.remove('active');
    i = (n+slides.length)%slides.length;
    slides[i].classList.add('is-active');
    dots.children[i]?.classList.add('active');
  }
  function next(){ go(i+1); }
  function prev(){ go(i-1); }
  slides.forEach((_,idx)=>{
    const b=document.createElement('button');
    b.setAttribute('aria-label',`Go to slide ${idx+1}`);
    b.addEventListener('click',()=>{go(idx); reset();});
    dots.appendChild(b);
  });
  dots.firstChild?.classList.add('active');
  $('.next', root).addEventListener('click', ()=>{ next(); reset(); });
  $('.prev', root).addEventListener('click', ()=>{ prev(); reset(); });
  function reset(){ clearInterval(timer); timer=setInterval(next, 6000); }
  reset();
})();

// Persistence keys
const LS_KEY = 'regihub_events_v1';

// LocalStorage helpers
function lsLoad(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); }catch{return []} }
function lsSave(events){ localStorage.setItem(LS_KEY, JSON.stringify(events)); }

// IndexedDB primary
async function loadEvents(){
  const idbData = await idbGet('events');
  if(idbData && Array.isArray(idbData)) return idbData;
  return lsLoad();
}
async function saveEvents(events){
  try{ await idbSet('events', events); }catch{}
  try{ lsSave(events); }catch{}
  refreshTicker(events);
  refreshTasks(events);
  if (window._calendar) {
    window._calendar.removeAllEvents();
    window._calendar.addEventSource(events);
  }
}

// Build calendar
let calendar, calendarEl = document.getElementById('calendarEl');
async function initCalendar(){
  const initial = await loadEvents();
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' },
    selectable: true,
    navLinks: true,
    height: 'auto',
    events: initial,
    select: (info)=>{ openModal({ start: info.startStr, end: info.endStr, allDay: info.allDay }); },
    eventClick: (info)=>{
      const e = info.event;
      openModal({ id: e.id, title: e.title, start: e.startStr, end: e.endStr, allDay: e.allDay, extendedProps: e.extendedProps, backgroundColor: e.backgroundColor, borderColor: e.borderColor });
    }
  });
  calendar.render();
  window._calendar = calendar;
}

// Modal logic
const modal = document.getElementById('modal');
const form = document.getElementById('eventForm');
const fields = {
  title: document.getElementById('title'),
  type: document.getElementById('type'),
  category: document.getElementById('category'),
  start: document.getElementById('start'),
  end: document.getElementById('end'),
  desc: document.getElementById('desc'),
  color: document.getElementById('color'),
  allDay: document.getElementById('allDay')
};
let editingId = null;

function openModal(data={}){
  document.getElementById('modalTitle').textContent = data.id? 'Edit Item' : 'Add Event / Task';
  editingId = data.id || null;
  fields.title.value = data.title || '';
  fields.type.value = (data.extendedProps?.type) || 'event';
  fields.category.value = (data.extendedProps?.category) || 'General';
  fields.start.value = (data.start? data.start.replace('Z','') : '');
  fields.end.value = (data.end? data.end.replace('Z','') : '');
  fields.desc.value = (data.extendedProps?.desc) || '';
  fields.color.value = data.backgroundColor || '#0a4ed3';
  fields.allDay.checked = !!data.allDay;
  modal.showModal();
}
$('#btnAdd')?.addEventListener('click',()=> openModal());
$('#closeModal')?.addEventListener('click',()=> modal.close());

form?.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const item = {
    id: editingId || String(Date.now()),
    title: fields.type.value==='task'? `\uD83D\uDCDD ${fields.title.value}`: fields.title.value,
    start: fields.start.value,
    end: fields.end.value || undefined,
    allDay: fields.allDay.checked,
    backgroundColor: fields.color.value,
    borderColor: fields.color.value,
    extendedProps: { type: fields.type.value, category: fields.category.value, desc: fields.desc.value }
  };
  const events = await loadEvents();
  const idx = events.findIndex(e=>e.id===item.id);
  if(idx>=0) events[idx] = item; else events.push(item);
  await saveEvents(events);
  modal.close();
});

// Clear all
$('#btnClear')?.addEventListener('click', async ()=>{
  if(confirm('Remove all saved events and tasks on this device?')){
    await saveEvents([]);
  }
});

// Tasks side list
async function refreshTasks(events){
  events = events || await loadEvents();
  const list = document.getElementById('taskList');
  if(!list) return;
  list.innerHTML = '';
  const tasks = events.filter(e=> e.extendedProps?.type==='task');
  if(!tasks.length){
    const li = document.createElement('li');
    li.innerHTML = '<span class="muted">No tasks yet</span>';
    list.appendChild(li);
    return;
  }
  tasks.sort((a,b)=> new Date(a.start) - new Date(b.start));
  tasks.forEach(t=>{
    const li = document.createElement('li');
    const date = new Date(t.start);
    li.innerHTML = `<div><strong>${t.title.replace('\uD83D\uDCDD ','')}</strong><div class="meta">Due: ${date.toLocaleString()}</div></div>`;
    const del = document.createElement('button');
    del.className = 'icon';
    del.innerHTML = '<i class="fa fa-trash"></i>';
    del.addEventListener('click', async ()=>{
      const events = (await loadEvents()).filter(e=>e.id!==t.id);
      await saveEvents(events);
    });
    li.appendChild(del);
    list.appendChild(li);
  });
}

// Upcoming ticker
async function refreshTicker(events){
  events = events || await loadEvents();
  const marquee = document.getElementById('upcomingMarquee');
  if(!marquee) return;
  const upcoming = events
    .filter(e=> new Date(e.start) >= new Date(Date.now()-24*3600*1000))
    .sort((a,b)=> new Date(a.start) - new Date(b.start))
    .slice(0,8)
    .map(e=>{
      const d = new Date(e.start);
      const date = d.toLocaleDateString(undefined,{month:'short', day:'numeric'});
      const cat = e.extendedProps?.category || 'General';
      return `${date}: <strong>${e.title}</strong> <em>(${cat})</em>`;
    });
  marquee.innerHTML = upcoming.length? upcoming.join(' • ') : 'No upcoming items yet — add one from the Calendar tab.';
}

// Service worker (works for GitHub Pages subpaths)
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

// Init
window.addEventListener('DOMContentLoaded', async ()=>{
  await initCalendar();
  await refreshTasks();
  await refreshTicker();
});
