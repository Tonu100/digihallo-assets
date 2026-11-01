(function(){
  // Step 3 will fill this with your Apps Script web app URL (it returns the customer's purchases).
  var DOWNLOADS_API = '';

  var box;

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  var G_LOGO = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';

  function addCss(){
    var st = document.createElement('style');
    st.textContent =
      '#dh-account{max-width:760px;margin:24px auto;padding:0 12px;font-family:inherit;color:inherit;line-height:1.5}' +
      '.dh-ac-card{border:1px solid rgba(128,128,128,.22);border-radius:16px;padding:24px;margin-bottom:20px;background:rgba(128,128,128,.03)}' +
      '.dh-ac-center{text-align:center;padding:44px 24px}' +
      '.dh-ac-card h2{margin:0 0 8px;font-size:1.35rem}' +
      '.dh-ac-card p{margin:0 0 16px;opacity:.8}' +
      '.dh-ac-google{display:inline-flex;align-items:center;gap:10px;background:#fff;color:#3c4043;border:1px solid #dadce0;border-radius:8px;padding:11px 20px;font-weight:600;font-size:15px;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(0,0,0,.08)}' +
      '.dh-ac-google:hover{box-shadow:0 2px 8px rgba(0,0,0,.15)}' +
      '.dh-ac-profile{display:flex;align-items:center;gap:16px;flex-wrap:wrap}' +
      '.dh-ac-profile img,.dh-ac-ini{width:64px;height:64px;border-radius:50%;object-fit:cover;flex:0 0 64px}' +
      '.dh-ac-ini{background:#6d59ff;color:#fff;font-weight:700;font-size:26px;display:flex;align-items:center;justify-content:center}' +
      '.dh-ac-info{flex:1;min-width:180px}' +
      '.dh-ac-name{font-weight:700;font-size:1.2rem;margin:0}' +
      '.dh-ac-mail,.dh-ac-since{margin:2px 0 0!important;opacity:.7;font-size:.9rem}' +
      '.dh-ac-out{background:transparent;border:1.5px solid #6d59ff;color:#6d59ff;border-radius:999px;padding:8px 18px;font-weight:600;cursor:pointer;font-family:inherit}' +
      '.dh-ac-out:hover{background:#6d59ff;color:#fff}' +
      '.dh-ac-item{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 0;border-top:1px solid rgba(128,128,128,.18)}' +
      '.dh-ac-item:first-of-type{border-top:0}' +
      '.dh-ac-item b{display:block}' +
      '.dh-ac-item small{opacity:.65}' +
      '.dh-ac-dl{display:inline-block;background:#6d59ff;color:#fff!important;text-decoration:none!important;border-radius:8px;padding:8px 18px;font-weight:600;font-size:14px}' +
      '.dh-ac-note{background:rgba(109,89,255,.08);border-radius:10px;padding:14px 16px;margin:0!important;opacity:1!important}';
    document.head.appendChild(st);
  }

  function signIn(){
    if(window.dhSignIn){ window.dhSignIn(); return; }
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(function(){});
  }

  function showLoggedOut(){
    box.innerHTML =
      '<div class="dh-ac-card dh-ac-center">' +
        '<h2>Sign in to your account</h2>' +
        '<p>Use your Google account to see your profile and your purchase history.</p>' +
        '<button type="button" class="dh-ac-google">' + G_LOGO + '<span>Continue with Google</span></button>' +
      '</div>';
    box.querySelector('.dh-ac-google').addEventListener('click', signIn);
  }

  function renderOrders(list){
    var el = document.getElementById('dh-ac-orders');
    if(!el){ return; }
    if(!list || !list.length){
      el.innerHTML = '<p class="dh-ac-note">No purchases found for this email yet. Please sign in with the same email address you used at checkout.</p>';
      return;
    }
    var html = '';
    list.forEach(function(o){
      var link = /^https:\/\//.test(o.link || '') ? o.link : '';
      html += '<div class="dh-ac-item"><div><b>' + esc(o.product) + '</b><small>' + esc(o.date || '') + '</small></div>' +
        (link ? '<a class="dh-ac-dl" href="' + esc(link) + '" target="_blank" rel="noopener">Download</a>' : '') + '</div>';
    });
    el.innerHTML = html;
  }

  function loadOrders(u){
    var el = document.getElementById('dh-ac-orders');
    if(!DOWNLOADS_API){
      el.innerHTML = '<p class="dh-ac-note">Your order history will appear here soon. Until then, your download link is always emailed to you right after purchase (please check your spam folder too).</p>';
      return;
    }
    el.innerHTML = '<p>Loading your purchases...</p>';
    u.getIdToken().then(function(t){
      return fetch(DOWNLOADS_API + '?idToken=' + encodeURIComponent(t));
    }).then(function(r){ return r.json(); }).then(function(d){
      renderOrders(d && d.orders);
    }).catch(function(){
      el.innerHTML = '<p class="dh-ac-note">Could not load your purchases right now. Please try again later.</p>';
    });
  }

  function showLoggedIn(u){
    var name = u.displayName || 'My Account';
    var since = '';
    if(u.metadata && u.metadata.creationTime){
      var d = new Date(u.metadata.creationTime);
      since = 'Member since ' + d.toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'});
    }
    var avatar = u.photoURL
      ? '<img src="' + esc(u.photoURL) + '" alt="" referrerpolicy="no-referrer">'
      : '<span class="dh-ac-ini">' + esc((name.trim().charAt(0) || 'U').toUpperCase()) + '</span>';
    box.innerHTML =
      '<div class="dh-ac-card"><div class="dh-ac-profile">' + avatar +
        '<div class="dh-ac-info"><p class="dh-ac-name">' + esc(name) + '</p>' +
        '<p class="dh-ac-mail">' + esc(u.email || '') + '</p>' +
        (since ? '<p class="dh-ac-since">' + esc(since) + '</p>' : '') + '</div>' +
        '<button type="button" class="dh-ac-out">Sign out</button></div></div>' +
      '<div class="dh-ac-card"><h2>My Downloads</h2><div id="dh-ac-orders"></div></div>';
    box.querySelector('.dh-ac-out').addEventListener('click', function(){ firebase.auth().signOut(); });
    loadOrders(u);
  }

  function start(){
    box = document.getElementById('dh-account');
    if(!box || typeof firebase === 'undefined' || !firebase.auth){ return; }
    addCss();
    box.innerHTML = '<div class="dh-ac-card dh-ac-center"><p>Loading...</p></div>';
    firebase.auth().onAuthStateChanged(function(u){
      if(u){ showLoggedIn(u); } else { showLoggedOut(); }
    });
  }

  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', start); }
  else { start(); }
})();
