// Simple IndexedDB wrapper for RegiHub
const DB_NAME = 'regihub_db_v1';
const STORE = 'regihub';
const EVENTS_KEY = 'calendar_events';
const TASKS_KEY = 'calendar_tasks';

function idbOpen(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = ()=>{
      const db = req.result;
      if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
}

async function idbGet(key){
  try{
    const db = await idbOpen();
    return await new Promise((resolve, reject)=>{
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const r = store.get(key);
      r.onsuccess = ()=> resolve(r.result || null);
      r.onerror = ()=> reject(r.error);
    });
  }catch{ return null }
}

async function idbSet(key, value){
  try{
    const db = await idbOpen();
    return await new Promise((resolve, reject)=>{
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const r = store.put(value, key);
      r.onsuccess = ()=> resolve(true);
      r.onerror = ()=> reject(r.error);
    });
  }catch{ return false }
}

// ===== CALENDAR EVENT FUNCTIONS =====
async function addEvent(event) {
  try {
    const events = await getAllEvents();
    event.id = Date.now(); // Use timestamp as ID
    events.push(event);
    await idbSet(EVENTS_KEY, events);
    console.log('Event added:', event.id);
    return event.id;
  } catch(error) {
    console.error('Error adding event:', error);
    return null;
  }
}

async function getAllEvents() {
  try {
    const events = await idbGet(EVENTS_KEY);
    return events || [];
  } catch(error) {
    console.error('Error getting events:', error);
    return [];
  }
}

async function getEventById(id) {
  try {
    const events = await getAllEvents();
    return events.find(e => e.id === id) || null;
  } catch(error) {
    console.error('Error getting event:', error);
    return null;
  }
}

async function updateEvent(id, updatedEvent) {
  try {
    const events = await getAllEvents();
    const index = events.findIndex(e => e.id === id);
    if(index !== -1) {
      updatedEvent.id = id;
      events[index] = updatedEvent;
      await idbSet(EVENTS_KEY, events);
      console.log('Event updated:', id);
      return true;
    }
    return false;
  } catch(error) {
    console.error('Error updating event:', error);
    return false;
  }
}

async function deleteEvent(id) {
  try {
    let events = await getAllEvents();
    events = events.filter(e => e.id !== id);
    await idbSet(EVENTS_KEY, events);
    console.log('Event deleted:', id);
    return true;
  } catch(error) {
    console.error('Error deleting event:', error);
    return false;
  }
}

async function getEventsByDate(date) {
  try {
    const events = await getAllEvents();
    return events.filter(e => e.date === date);
  } catch(error) {
    console.error('Error getting events by date:', error);
    return [];
  }
}

// ===== CALENDAR TASK FUNCTIONS =====
async function addTask(task) {
  try {
    const tasks = await getAllTasks();
    task.id = Date.now(); // Use timestamp as ID
    tasks.push(task);
    await idbSet(TASKS_KEY, tasks);
    console.log('Task added:', task.id);
    return task.id;
  } catch(error) {
    console.error('Error adding task:', error);
    return null;
  }
}

async function getAllTasks() {
  try {
    const tasks = await idbGet(TASKS_KEY);
    return tasks || [];
  } catch(error) {
    console.error('Error getting tasks:', error);
    return [];
  }
}

async function getTaskById(id) {
  try {
    const tasks = await getAllTasks();
    return tasks.find(t => t.id === id) || null;
  } catch(error) {
    console.error('Error getting task:', error);
    return null;
  }
}

async function updateTask(id, updatedTask) {
  try {
    const tasks = await getAllTasks();
    const index = tasks.findIndex(t => t.id === id);
    if(index !== -1) {
      updatedTask.id = id;
      tasks[index] = updatedTask;
      await idbSet(TASKS_KEY, tasks);
      console.log('Task updated:', id);
      return true;
    }
    return false;
  } catch(error) {
    console.error('Error updating task:', error);
    return false;
  }
}

async function deleteTask(id) {
  try {
    let tasks = await getAllTasks();
    tasks = tasks.filter(t => t.id !== id);
    await idbSet(TASKS_KEY, tasks);
    console.log('Task deleted:', id);
    return true;
  } catch(error) {
    console.error('Error deleting task:', error);
    return false;
  }
}

async function getTasksByDueDate(dueDate) {
  try {
    const tasks = await getAllTasks();
    return tasks.filter(t => t.dueDate === dueDate);
  } catch(error) {
    console.error('Error getting tasks by due date:', error);
    return [];
  }
}

async function clearAllData() {
  try {
    await idbSet(EVENTS_KEY, []);
    await idbSet(TASKS_KEY, []);
    console.log('All data cleared');
    return true;
  } catch(error) {
    console.error('Error clearing data:', error);
    return false;
  }
}
