// IndexedDB Configuration
const DB_NAME = 'CalendarDB';
const DB_VERSION = 1;
const EVENTS_STORE = 'events';
const TASKS_STORE = 'tasks';

// Initialize IndexedDB Database
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('Database failed to open:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      console.log('Database opened successfully');
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create Events Object Store
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        const eventStore = db.createObjectStore(EVENTS_STORE, { keyPath: 'id', autoIncrement: true });
        eventStore.createIndex('date', 'date', { unique: false });
        console.log('Events store created');
      }
      
      // Create Tasks Object Store
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        const taskStore = db.createObjectStore(TASKS_STORE, { keyPath: 'id', autoIncrement: true });
        taskStore.createIndex('dueDate', 'dueDate', { unique: false });
        console.log('Tasks store created');
      }
    };
  });
}

// ADD EVENT
async function addEvent(event) {
  try {
    const db = await initDB();
    const transaction = db.transaction([EVENTS_STORE], 'readwrite');
    const store = transaction.objectStore(EVENTS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.add(event);
      request.onsuccess = () => {
        console.log('Event added with ID:', request.result);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
}

// GET ALL EVENTS
async function getAllEvents() {
  try {
    const db = await initDB();
    const transaction = db.transaction([EVENTS_STORE], 'readonly');
    const store = transaction.objectStore(EVENTS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        console.log('Events retrieved:', request.result);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
}

// GET EVENT BY ID
async function getEventById(id) {
  try {
    const db = await initDB();
    const transaction = db.transaction([EVENTS_STORE], 'readonly');
    const store = transaction.objectStore(EVENTS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
}

// UPDATE EVENT
async function updateEvent(id, updatedEvent) {
  try {
    const db = await initDB();
    const transaction = db.transaction([EVENTS_STORE], 'readwrite');
    const store = transaction.objectStore(EVENTS_STORE);
    
    updatedEvent.id = id;
    
    return new Promise((resolve, reject) => {
      const request = store.put(updatedEvent);
      request.onsuccess = () => {
        console.log('Event updated:', id);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

// DELETE EVENT
async function deleteEvent(id) {
  try {
    const db = await initDB();
    const transaction = db.transaction([EVENTS_STORE], 'readwrite');
    const store = transaction.objectStore(EVENTS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('Event deleted:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

// GET EVENTS BY DATE
async function getEventsByDate(date) {
  try {
    const db = await initDB();
    const transaction = db.transaction([EVENTS_STORE], 'readonly');
    const store = transaction.objectStore(EVENTS_STORE);
    const index = store.index('date');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(date);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting events by date:', error);
    throw error;
  }
}

// ADD TASK
async function addTask(task) {
  try {
    const db = await initDB();
    const transaction = db.transaction([TASKS_STORE], 'readwrite');
    const store = transaction.objectStore(TASKS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.add(task);
      request.onsuccess = () => {
        console.log('Task added with ID:', request.result);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
}

// GET ALL TASKS
async function getAllTasks() {
  try {
    const db = await initDB();
    const transaction = db.transaction([TASKS_STORE], 'readonly');
    const store = transaction.objectStore(TASKS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        console.log('Tasks retrieved:', request.result);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
}

// GET TASK BY ID
async function getTaskById(id) {
  try {
    const db = await initDB();
    const transaction = db.transaction([TASKS_STORE], 'readonly');
    const store = transaction.objectStore(TASKS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
}

// UPDATE TASK
async function updateTask(id, updatedTask) {
  try {
    const db = await initDB();
    const transaction = db.transaction([TASKS_STORE], 'readwrite');
    const store = transaction.objectStore(TASKS_STORE);
    
    updatedTask.id = id;
    
    return new Promise((resolve, reject) => {
      const request = store.put(updatedTask);
      request.onsuccess = () => {
        console.log('Task updated:', id);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

// DELETE TASK
async function deleteTask(id) {
  try {
    const db = await initDB();
    const transaction = db.transaction([TASKS_STORE], 'readwrite');
    const store = transaction.objectStore(TASKS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('Task deleted:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// GET TASKS BY DUE DATE
async function getTasksByDueDate(dueDate) {
  try {
    const db = await initDB();
    const transaction = db.transaction([TASKS_STORE], 'readonly');
    const store = transaction.objectStore(TASKS_STORE);
    const index = store.index('dueDate');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(dueDate);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting tasks by due date:', error);
    throw error;
  }
}

// CLEAR ALL DATA (for testing/reset)
async function clearAllData() {
  try {
    const db = await initDB();
    const transaction = db.transaction([EVENTS_STORE, TASKS_STORE], 'readwrite');
    
    return new Promise((resolve, reject) => {
      const eventsClear = transaction.objectStore(EVENTS_STORE).clear();
      const tasksClear = transaction.objectStore(TASKS_STORE).clear();
      
      transaction.oncomplete = () => {
        console.log('All data cleared');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}
