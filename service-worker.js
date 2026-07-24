const CACHE='minix-push-v1';
const APP_FILES=['./','./index.html','./dashboard.html','./config.js','./admin.html','./manifest.json'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_FILES).catch(()=>{})))});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(event.request)))});
self.addEventListener('push',event=>{
  let data={};try{data=event.data?event.data.json():{}}catch(e){data={body:event.data?event.data.text():'Minix daily report is ready.'}}
  const title=data.title||'📊 Minix Daily Report';
  const options={body:data.body||'Tap to view today’s report.',tag:data.tag||'minix-daily-report',renotify:true,requireInteraction:true,data:{url:data.url||'./dashboard.html',notification_id:data.notification_id||null},actions:[{action:'view',title:'View Report'},{action:'snooze',title:'Snooze 15 min'}]};
  options.icon=data.icon||'./icon.svg';if(data.badge)options.badge=data.badge;
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const d=event.notification.data||{};
  if(event.action==='snooze'){
    event.waitUntil(fetch('./api-notification-snooze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({notification_id:d.notification_id})}).catch(()=>{}));return;
  }
  const url=new URL(d.url||'./dashboard.html',self.location.origin).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if(c.url.includes('dashboard')&&'focus'in c){c.navigate(url);return c.focus()}}return clients.openWindow(url)}));
});
