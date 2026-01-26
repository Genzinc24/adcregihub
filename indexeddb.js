// Simple IndexedDB wrapper for RegiHub
const DB_NAME = 'regihub_db_v1';
const STORE = 'regihub';
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
