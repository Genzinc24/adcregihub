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
// Load events and tasks when page loads
window.addEventListener('load', async () => {
  console.log('Page loaded, loading persisted data...');
  
  try {
    const events = await getAllEvents();
    const tasks = await getAllTasks();
    
    console.log('Loaded events:', events);
    console.log('Loaded tasks:', tasks);
    
    // Render your calendar with loaded data
    renderCalendar(events, tasks);
  } catch (error) {
    console.error('Failed to load persisted data:', error);
  }
});

// When creating a new event, save to IndexedDB
async function handleAddEvent(eventData) {
  try {
    const eventId = await addEvent({
      title: eventData.title,
      date: eventData.date,
      time: eventData.time,
      description: eventData.description,
      createdAt: new Date().toISOString()
    });
    
    console.log('Event saved with ID:', eventId);
    
    // Refresh calendar display
    const events = await getAllEvents();
    renderCalendar(events);
  } catch (error) {
    console.error('Error saving event:', error);
    alert('Failed to save event');
  }
}

// When creating a new task, save to IndexedDB
async function handleAddTask(taskData) {
  try {
    const taskId = await addTask({
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      completed: false,
      createdAt: new Date().toISOString()
    });
    
    console.log('Task saved with ID:', taskId);
    
    // Refresh calendar display
    const tasks = await getAllTasks();
    renderCalendar(tasks);
  } catch (error) {
    console.error('Error saving task:', error);
    alert('Failed to save task');
  }
}

// When deleting an event
async function handleDeleteEvent(eventId) {
  try {
    await deleteEvent(eventId);
    console.log('Event deleted');
    
    const events = await getAllEvents();
    renderCalendar(events);
  } catch (error) {
    console.error('Error deleting event:', error);
    alert('Failed to delete event');
  }
}

// When deleting a task
async function handleDeleteTask(taskId) {
  try {
    await deleteTask(taskId);
    console.log('Task deleted');
    
    const tasks = await getAllTasks();
    renderCalendar(tasks);
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Failed to delete task');
  }
}

// When editing an event
async function handleEditEvent(eventId, updatedEventData) {
  try {
    await updateEvent(eventId, {
      title: updatedEventData.title,
      date: updatedEventData.date,
      time: updatedEventData.time,
      description: updatedEventData.description,
      updatedAt: new Date().toISOString()
 
    
    console.log('Event updated');
    const events = await getAllEvents();
    renderCalendar(events);
  } catch (error) {
    console.error('Error updating event:', error);
    alert('Failed to update event');
  }
}

// When editing a task
async function handleEditTask(taskId, updatedTaskData) {
  try {
    await updateTask(taskId, {
      title: updatedTaskData.title,
      description: updatedTaskData.description,
      dueDate: updatedTaskData.dueDate,
      completed: updatedTaskData.completed,
      updatedAt: new Date().toISOString()
    });
    
    console.log('Task updated');
    const tasks = await getAllTasks();
    renderCalendar(tasks);
  } catch (error) {
    console.error('Error updating task:', error);
    alert('Failed to update task');
 });
  let calendar; // Global calendar instance

// Initialize and render the full calendar when page loads
window.addEventListener('load', async () => {
  console.log('Initializing calendar...');
  
  // Get all events and tasks from IndexedDB
  const events = await getAllEvents();
  const tasks = await getAllTasks();
  
  // Convert to FullCalendar format
  const calendarEvents = convertToCalendarFormat(events, tasks);
  
  // Initialize FullCalendar
  initializeFullCalendar(calendarEvents);
});

// Convert events and tasks to FullCalendar format
function convertToCalendarFormat(events, tasks) {
  const calendarEvents = [];
  
  // Add events
  if(events && events.length > 0) {
    events.forEach(event => {
      calendarEvents.push({
        id: event.id,
        title: event.title || 'Untitled Event',
        start: event.date + 'T' + (event.time || '09:00'),
        description: event.description || '',
        backgroundColor: '#3498db', // Blue for events
        borderColor: '#2980b9',
        classNames: ['event-item']
      });
    });
  }
  
  // Add tasks
  if(tasks && tasks.length > 0) {
    tasks.forEach(task => {
      calendarEvents.push({
        id: 'task-' + task.id,
        title: (task.completed ? '✓ ' : '○ ') + (task.title || 'Untitled Task'),
        start: task.dueDate || new Date().toISOString().split('T')[0],
        description: task.description || '',
        backgroundColor: task.completed ? '#95a5a6' : '#e74c3c', // Red for tasks
        borderColor: task.completed ? '#7f8c8d' : '#c0392b',
        classNames: ['task-item']
      });
    });
  }
  
  return calendarEvents;
}

// Initialize FullCalendar
function initializeFullCalendar(calendarEvents) {
  const calendarEl = document.getElementById('calendar');
  
  if(!calendarEl) {
    console.error('Calendar element not found!');
    return;
  }
  
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth', // Month view by default
    headerToolbar: {
      left: 'prev,next today addEvent',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    height: 'auto',
    editable: true,
    selectable: true,
    selectConstraint: 'businessHours',
    eventColor: '#3498db',
    events: calendarEvents,
    
    // When user clicks on a date
    select: function(info) {
      openEventCreationModal(info.startStr);
    },
    
    // When user clicks on an event
    eventClick: function(info) {
      viewEventDetails(info.event);
    },
    
    // When user drags event to new date
    eventDrop: function(info) {
      handleEventDrop(info.event);
    },
    
    // Custom button to add event
    customButtons: {
      addEvent: {
        text: 'Add Event',
        click: function() {
          openEventCreationModal();
        }
      }
    }
  });
  
  calendar.render();
}

// View event/task details in a modal
function viewEventDetails(event) {
  const isTask = event.id.startsWith('task-');
  const title = isTask ? event.title.replace(/^[✓○] /, '') : event.title;
  
  console.log('Event Details:', {
    id: event.id,
    title: title,
    start: event.startStr,
    description: event.extendedProps.description,
    type: isTask ? 'Task' : 'Event'
  });
  
  // You can create a modal here to show full details
  alert(`${isTask ? 'Task' : 'Event'}: ${title}\nDate: ${event.startStr}\nDescription: ${event.extendedProps.description}`);
}

// Open modal to create new event
function openEventCreationModal(selectedDate = null) {
  console.log('Opening event creation modal for date:', selectedDate);
  // Create your modal/form here for adding new events
}

// Handle when user drags an event to a new date
async function handleEventDrop(event) {
  const isTask = event.id.startsWith('task-');
  const id = isTask ? parseInt(event.id.replace('task-', '')) : parseInt(event.id);
  
  if(isTask) {
    // Update task with new date
    const task = await getTaskById(id);
    if(task) {
      task.dueDate = event.startStr.split('T')[0];
      await updateTask(id, task);
      console.log('Task date updated');
    }
  } else {
    // Update event with new date
    const eventObj = await getEventById(id);
    if(eventObj) {
      const dateTime = event.startStr.split('T');
      eventObj.date = dateTime[0];
      eventObj.time = dateTime[1] || eventObj.time;
      await updateEvent(id, eventObj);
      console.log('Event date updated');
    }
  }
}

// Refresh calendar after adding/editing event or task
async function refreshCalendar() {
  const events = await getAllEvents();
  const tasks = await getAllTasks();
  const calendarEvents = convertToCalendarFormat(events, tasks);
  
  calendar.removeAllEvents();
  calendar.addEventSource(calendarEvents);
});
