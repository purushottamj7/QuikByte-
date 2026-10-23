(function(){
  var $app=document.getElementById('app'), $bar=document.getElementById('bar'), $toast=document.getElementById('toast');

  /* Sample menu. "load" is how much kitchen capacity one item uses. */
  var MENU=[
    {id:'chai',name:'Masala chai',price:15,cat:'Drinks',tag:'quick',load:1,icon:'cup'},
    {id:'sand',name:'Veg sandwich',price:40,cat:'Quick bites',tag:'quick',load:2,icon:'sandwich'},
    {id:'samosa',name:'Samosa (2 pcs)',price:30,cat:'Quick bites',tag:'quick',load:1,icon:'samosa'},
    {id:'pizza',name:'Cheese pizza slice',price:70,cat:'Meals',tag:'offpeak',load:4,icon:'slice'},
    {id:'rice',name:'Veg fried rice',price:80,cat:'Meals',tag:'offpeak',load:3,icon:'bowl'},
    {id:'coffee',name:'Cold coffee',price:35,cat:'Drinks',tag:'quick',load:1,icon:'glass',soldOut:true}
  ];
  var CATS=['All','Quick bites','Drinks','Meals'];
  var MAX_ITEMS=6, HOLD_MS=120000;

  /* Pickup slots: 5-minute windows, each with a kitchen capacity. Recess starts at 10:30. */
  var SLOTS=[
    {id:'s1025',t:'10:25',m:625,cap:15,used:15,peak:true},
    {id:'s1030',t:'10:30',m:630,cap:15,used:15,peak:true},
    {id:'s1035',t:'10:35',m:635,cap:15,used:11,peak:true},
    {id:'s1040',t:'10:40',m:640,cap:15,used:4,peak:true},
    {id:'s1045',t:'10:45',m:645,cap:15,used:2,peak:false},
    {id:'s1050',t:'10:50',m:650,cap:15,used:0,peak:false},
    {id:'s1055',t:'10:55',m:655,cap:15,used:0,peak:false}
  ];
  var STATUS=['Placed','Preparing','Ready','Collected'];
  var STATUS_PILL=['grey','amber','green','green'];

  var state={screen:'menu',cat:'All',cart:{},held:null,notice:'',waitlist:{},order:null,nextId:142};
  var timers=[], toastTimer=null;

  var ICONS={
    cup:'<path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 3v2"/><path d="M12 3v2"/>',
    sandwich:'<path d="M4 9l8-4 8 4-8 4-8-4z"/><path d="M4 13l8 4 8-4"/><path d="M4 17l8 4 8-4"/>',
    samosa:'<path d="M12 4l9 15H3L12 4z"/><path d="M9 14h6"/>',
    slice:'<path d="M12 21L4 7a14 14 0 0 1 16 0L12 21z"/><circle cx="12" cy="10" r="1"/><circle cx="10" cy="13" r=".8"/><circle cx="14" cy="13" r=".8"/>',
    glass:'<path d="M7 4h10l-1 16H8L7 4z"/><path d="M7.5 9h9"/>',
    bowl:'<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1 1-1 1-2"/><path d="M12 7c0-1 1-1 1-2"/>',
    plus:'<path d="M12 5v14"/><path d="M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    check:'<path d="M5 12l5 5 9-10"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    arrowL:'<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
    arrowR:'<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>'
  };
  function icon(n,size,sw){
    size=size||20; sw=sw||2;
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+sw+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[n]+'</svg>';
  }

  function fmt(m){return Math.floor(m/60)+':'+String(m%60).padStart(2,'0');}
  function mmss(ms){var s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
  function clockNow(){return new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});}
  function slotById(id){return SLOTS.filter(function(s){return s.id===id;})[0];}
  function itemById(id){return MENU.filter(function(m){return m.id===id;})[0];}
  function lines(){return MENU.filter(function(m){return state.cart[m.id];}).map(function(m){return {m:m,q:state.cart[m.id]};});}
  function count(){return lines().reduce(function(a,l){return a+l.q;},0);}
  function total(){return lines().reduce(function(a,l){return a+l.m.price*l.q;},0);}
  function load(){return lines().reduce(function(a,l){return a+l.m.load*l.q;},0);}
  function hasOff(){return lines().some(function(l){return l.m.tag==='offpeak';});}
  function summary(ls){return ls.map(function(l){return l.q+' × '+l.m.name;}).join(', ');}

  function newToken(){
    var a='ABCDEFGHJKMNPQRSTUVWXYZ23456789', s='', r=[];
    try{var u=new Uint32Array(8);crypto.getRandomValues(u);r=Array.prototype.slice.call(u);}
    catch(e){for(var k=0;k<8;k++)r.push(Math.floor(Math.random()*1e9));}
    r.forEach(function(v,i){s+=a[v%a.length];if(i===3)s+='-';});
    return s;
  }

  function toast(kind,title,detail){
    $toast.className='toast '+kind;
    $toast.innerHTML='<b>'+title+'</b>'+(detail?'<span>'+detail+'</span>':'');
    $toast.hidden=false;
    clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){$toast.hidden=true;},3600);
  }

  /* ---------- Views ---------- */
  function itemRow(m){
    var q=state.cart[m.id]||0;
    var thumbCls=m.soldOut?'off':(m.tag==='offpeak'?'warm':'');
    var tag=m.soldOut?'<span class="pill grey">Sold out</span>':(m.tag==='offpeak'?'<span class="pill amber">Off-peak slots only</span>':'<span class="pill green">Quick</span>');
    var ctl;
    if(m.soldOut){
      ctl='<button class="sq" disabled aria-label="'+m.name+' is sold out">'+icon('plus',18,2.4)+'</button>';
    }else if(q>0){
      ctl='<div class="qty"><button class="sq" data-act="dec" data-id="'+m.id+'" aria-label="Remove one '+m.name+'">'+icon('minus',18,2.4)+'</button>'+
          '<output aria-label="'+m.name+' quantity">'+q+'</output>'+
          '<button class="sq add" data-act="inc" data-id="'+m.id+'" aria-label="Add one '+m.name+'">'+icon('plus',18,2.4)+'</button></div>';
    }else{
      ctl='<button class="sq add" data-act="inc" data-id="'+m.id+'" aria-label="Add '+m.name+'">'+icon('plus',18,2.4)+'</button>';
    }
    return '<div class="item'+(m.soldOut?' out':'')+'"><div class="thumb '+thumbCls+'">'+icon(m.icon,28,1.8)+'</div>'+
      '<div class="meta"><div class="name">'+m.name+'</div><div class="row"><span class="price">₹'+m.price+'</span>'+tag+'</div></div>'+ctl+'</div>';
  }

  function menuView(){
    var items=MENU.filter(function(m){return state.cat==='All'||m.cat===state.cat;});
    var n=count();
    var html='<header class="top"><div><div class="brand">Encave</div><div class="sub">Order before you leave class</div></div><span class="pill green">Recess 10:30</span></header>'+
      '<div class="tabs" role="group" aria-label="Menu categories">'+CATS.map(function(c){return '<button class="tab" data-act="tab" data-id="'+c+'" aria-pressed="'+(state.cat===c)+'">'+c+'</button>';}).join('')+'</div>'+
      '<div class="note">'+icon('info',18,2)+'<span>Up to '+MAX_ITEMS+' items per order during recess.</span></div>'+
      '<div class="list">'+items.map(itemRow).join('')+'</div>';
    var bar=n>0
      ? '<button class="btn" data-act="toSlots"><span>'+n+' item'+(n>1?'s':'')+' · ₹'+total()+'</span><span class="r">Choose pickup time '+icon('arrowR',20,2.2)+'</span></button>'
      : '<button class="btn center" disabled>Add items to start your order</button>';
    return {html:html,bar:bar};
  }

  function slotRow(s,ld,off){
    var rem=s.cap-s.used, pct=Math.round(s.used/s.cap*100);
    var isHeld=state.held&&state.held.id===s.id;
    var meterCls=pct>=100?'red':(rem<8?'amber':'');
    var meter='<span class="meter '+meterCls+'" aria-hidden="true"><i style="width:'+pct+'%"></i></span>';
    if(rem<=0){
      var on=!!state.waitlist[s.id];
      return '<div class="slot full"><span class="l"><span class="time">'+s.t+'</span><span class="pill red">Full</span></span>'+
        '<button class="wl" data-act="waitlist" data-id="'+s.id+'" aria-pressed="'+on+'">'+(on?'On waitlist · #3':'Join waitlist')+'</button>'+meter+'</div>';
    }
    var disabled=false, pill;
    if(rem<ld){disabled=true;pill='<span class="pill grey">Order too big for this slot</span>';}
    else if(s.peak&&off){disabled=true;pill='<span class="pill grey">Quick items only</span>';}
    else if(rem<8){pill='<span class="pill amber">Filling up</span>';}
    else{pill='<span class="pill green">Plenty of space</span>';}
    var radio=isHeld?'<span class="radio on">'+icon('check',14,3)+'</span>':'<span class="radio"></span>';
    return '<button class="slot'+(isHeld?' sel':'')+'" data-act="pick" data-id="'+s.id+'" aria-pressed="'+(!!isHeld)+'"'+(disabled?' disabled':'')+'>'+
      '<span class="l"><span class="time">'+s.t+'</span>'+pill+'</span>'+radio+meter+'</button>';
  }

  function slotView(){
    var ld=load(), off=hasOff(), h=state.held, hs=h?slotById(h.id):null;
    var banner='';
    if(h){
      var left=h.until-Date.now();
      banner='<div class="hold" role="status"><div class="hh"><span class="hl">'+icon('clock',20,2)+hs.t+' is held for you</span><span id="holdText">'+mmss(left)+' left</span></div>'+
        '<div class="track"><i id="holdBar" style="width:'+Math.max(0,Math.min(100,left/HOLD_MS*100))+'%"></i></div></div>';
    }else if(state.notice){
      banner='<div class="notice" role="status">'+state.notice+'</div>';
    }else{
      banner='<div class="note">'+icon('info',18,2)+'<span>Pick a time and we hold your spot for 2 minutes.</span></div>';
    }
    var offNote=off?'<div class="note">'+icon('info',18,2)+'<span>Your cart has an off-peak item, so the busy slots (10:25 to 10:40) are unavailable.</span></div>':'';
    var html='<div class="head"><button class="back" data-act="back" aria-label="Back to menu">'+icon('arrowL',20,2.2)+'</button><h1 class="title">Pick a pickup time</h1></div>'+
      '<div class="sum"><div><small>Your order</small>'+summary(lines())+'</div><strong>₹'+total()+'</strong></div>'+
      banner+offNote+
      '<div class="list">'+SLOTS.map(function(s){return slotRow(s,ld,off);}).join('')+'</div>';
    var bar='<div class="barmeta"><span>'+(hs?'Ready around '+hs.t:'No time picked yet')+'</span><span>Pay at pickup</span></div>'+
      '<button class="btn center" data-act="confirm"'+(h?'':' disabled')+'>Confirm order · ₹'+total()+'</button>';
    return {html:html,bar:bar};
  }

  function trackView(){
    var o=state.order, st=o.status, slot=slotById(o.slotId);
    var steps='';
    STATUS.forEach(function(label,i){
      var done=(i<st)||st===3, cur=(i===st&&st<3);
      steps+='<div class="step'+(done?' done':'')+(cur?' cur':'')+'"><span class="dot">'+(done?icon('check',14,3):'')+'</span>'+label+'</div>';
      if(i<3)steps+='<div class="line'+((i<st)||st===3?' on':'')+'"></div>';
    });
    var main;
    if(st===3){
      main='<section class="done-card"><span class="tick">'+icon('check',34,3)+'</span><h2>Collected</h2><p>Order #'+o.id+' was collected at '+o.collectedAt+'. Enjoy your meal.</p></section>'+
        '<button class="btn center" data-act="newOrder">Start a new order</button>';
    }else{
      var night = st===2
        ? '<section class="night"><div class="k">Ready now</div><div class="big">Collect</div><p>Show your QR code at the pickup shelf. We hold it for 10 minutes.</p></section>'
        : '<section class="night"><div class="k">Leave class by</div><div class="big">'+fmt(slot.m-4)+'</div><p>Your order will be ready around '+slot.t+'. We will alert you when it is.</p></section>';
      main=night+
        '<section class="qrcard'+(st===2?' ready':'')+'"><div class="qrbox" id="qr" role="img" aria-label="QR code for order #'+o.id+'"></div>'+
        '<div class="qrtxt"><strong>Show this at the pickup shelf</strong><span>Or type the code: <b class="code">'+o.token+'</b></span></div></section>'+
        '<div class="note">'+icon('info',18,2)+'<span>Collect within 10 minutes of it being ready, or the order expires.</span></div>';
    }
    var html='<header class="top"><div><h1 class="title">Order #'+o.id+'</h1><div class="sub">'+summary(o.lines)+'</div></div><span class="pill '+STATUS_PILL[st]+'" aria-live="polite">'+STATUS[st]+'</span></header>'+
      '<div class="stepbar">'+steps+'</div>'+main+
      '<section class="demo"><h3>Demo controls</h3><div class="sub">Stand-ins for the cafe side, which this demo does not connect to.</div>'+
      '<div class="btns"><button class="sec" data-act="next"'+(st>=2?' disabled':'')+'>Kitchen: next status</button>'+
      '<button class="sec" data-act="scan">Kiosk: scan QR</button></div></section>';
    return {html:html,bar:''};
  }

  /* ---------- Rendering ---------- */
  function makeQR(el,text){
    el.innerHTML='';
    try{
      if(window.QRCode){
        new QRCode(el,{text:text,width:168,height:168,colorDark:'#14211B',colorLight:'#FFFFFF',correctLevel:QRCode.CorrectLevel.M});
        return;
      }
    }catch(e){}
    el.innerHTML='<div class="fallback">'+text+'</div>';
  }

  function render(){
    var ae=document.activeElement, key=null;
    if(ae&&ae.dataset&&ae.dataset.act){key=[ae.dataset.act,ae.dataset.id||''];}
    var v=state.screen==='menu'?menuView():(state.screen==='slots'?slotView():trackView());
    $app.innerHTML=v.html;
    $bar.innerHTML=v.bar?'<div class="bar-in">'+v.bar+'</div>':'';
    $bar.hidden=!v.bar;
    if(state.screen==='tracking'&&state.order.status<3){makeQR(document.getElementById('qr'),state.order.token);}
    if(key){
      var sel='[data-act="'+key[0]+'"]'+(key[1]?'[data-id="'+key[1]+'"]':'');
      var el=$app.querySelector(sel)||$bar.querySelector(sel);
      if(el&&!el.disabled)el.focus();
    }
  }
  function go(screen){state.screen=screen;render();window.scrollTo(0,0);}

  /* ---------- Order flow ---------- */
  function advance(to){
    var o=state.order;
    if(!o||o.status>=to||to>2)return;
    o.status=to;
    if(to===2){
      toast('ok','Order #'+o.id+' is ready','Show your QR code at the pickup shelf.');
      try{if(navigator.vibrate)navigator.vibrate(200);}catch(e){}
    }
    if(state.screen==='tracking')render();
  }
  function clearTimers(){timers.forEach(clearTimeout);timers=[];}

  var actions={
    tab:function(id){state.cat=id;render();},
    inc:function(id){
      if(count()>=MAX_ITEMS){toast('warn','Order limit reached','Up to '+MAX_ITEMS+' items per order during recess.');return;}
      state.cart[id]=(state.cart[id]||0)+1;render();
    },
    dec:function(id){
      var q=(state.cart[id]||0)-1;
      if(q<=0)delete state.cart[id];else state.cart[id]=q;
      render();
    },
    toSlots:function(){state.held=null;state.notice='';go('slots');},
    back:function(){state.held=null;state.notice='';go('menu');},
    pick:function(id){state.held={id:id,until:Date.now()+HOLD_MS};state.notice='';render();},
    waitlist:function(id){
      var on=!state.waitlist[id];
      state.waitlist[id]=on;
      var s=slotById(id);
      if(on)toast('ok','You are on the waitlist','You are 3rd in line for '+s.t+'. We will alert you if space opens.');
      render();
    },
    confirm:function(){
      if(!state.held)return;
      var slot=slotById(state.held.id), ld=load();
      if(slot.cap-slot.used<ld){state.held=null;state.notice='That slot just filled up. Pick another time.';render();return;}
      slot.used+=ld;
      state.order={id:state.nextId++,lines:lines(),total:total(),slotId:slot.id,token:newToken(),status:0,collectedAt:null};
      state.cart={};state.held=null;state.notice='';
      clearTimers();
      timers.push(setTimeout(function(){advance(1);},4000));
      timers.push(setTimeout(function(){advance(2);},16000));
      go('tracking');
    },
    next:function(){if(state.order&&state.order.status<2)advance(state.order.status+1);},
    scan:function(){
      var o=state.order;if(!o)return;
      if(o.status===3){toast('err','Kiosk: already collected','Order #'+o.id+' was collected at '+o.collectedAt+'. Do not hand over again.');}
      else if(o.status===2){o.status=3;o.collectedAt=clockNow();clearTimers();toast('ok','Kiosk: order valid','Hand over order #'+o.id+'.');render();}
      else{toast('warn','Kiosk: not ready yet','Order #'+o.id+' is still being prepared.');}
    },
    newOrder:function(){clearTimers();state.order=null;state.cat='All';go('menu');}
  };

  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-act]');
    if(!b||b.disabled)return;
    var fn=actions[b.dataset.act];
    if(fn)fn(b.dataset.id);
  });

  /* Hold countdown: update the text and bar in place, release the slot when time is up. */
  setInterval(function(){
    if(!state.held)return;
    var left=state.held.until-Date.now();
    if(left<=0){
      state.held=null;state.notice='Your hold ran out. Pick a pickup time again.';
      if(state.screen==='slots')render();
      return;
    }
    var t=document.getElementById('holdText'), b=document.getElementById('holdBar');
    if(t)t.textContent=mmss(left)+' left';
    if(b)b.style.width=(left/HOLD_MS*100)+'%';
  },500);

  render();
})();
