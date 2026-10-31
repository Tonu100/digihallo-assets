(function(){
  // Set this to your My Downloads page URL later (Step 3). Empty = link hidden.
  var MY_DOWNLOADS_URL = '';

  function ready(fn){
    if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn); }
    else { fn(); }
  }

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  ready(function(){
    if(typeof firebase === 'undefined' || !firebase.auth || typeof dhDB === 'undefined'){ return; }
    var host = document.querySelector('.search-wrap');
    if(!host){ return; }

    var auth = firebase.auth();

    var css = document.createElement('style');
    css.textContent =
      '.dh-acct{position:relative;display:inline-flex;align-items:center;margin:0 5px}' +
      '.dh-acct-btn{display:flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--main-menu-text-color,#111);cursor:pointer;overflow:hidden}' +
      '.dh-acct-btn:hover{opacity:.8}' +
      '.dh-acct-btn svg{width:22px;height:22px}' +
      '.dh-acct-btn img{width:30px;height:30px;border-radius:50%;object-fit:cover;display:block}' +
      '.dh-acct-ini{width:30px;height:30px;border-radius:50%;background:#6d59ff;color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center}' +
      '.dh-acct-menu{display:none;position:absolute;top:44px;right:0;min-width:220px;background:var(--submenu-bg-color,#fff);color:var(--sub-menu-text-color,#111);border:1px solid rgba(128,128,128,.25);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.15);padding:12px;z-index:99999;line-height:1.4;font-size:14px}' +
      '.dh-acct.open .dh-acct-menu{display:block}' +
      '.dh-acct-name{font-weight:700;margin:0 0 2px;word-break:break-word}' +
      '.dh-acct-mail{opacity:.75;font-size:12px;margin:0 0 10px;word-break:break-all}' +
      '.dh-acct-link{display:block;width:100%;text-align:left;background:none;border:0;border-top:1px solid rgba(128,128,128,.2);padding:9px 2px;color:inherit;font:inherit;cursor:pointer;text-decoration:none}' +
      '.dh-acct-link:hover{color:#6d59ff}';
    document.head.appendChild(css);

    var wrap = document.createElement('div');
    wrap.className = 'dh-acct';
    var first = host.querySelector('.oixli-loveit');
    if(first){ host.insertBefore(wrap, first); } else { host.insertBefore(wrap, host.firstChild); }

    var userIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>';

    function signIn(){
      var provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(function(e){
        if(e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')){
          auth.signInWithRedirect(provider);
        } else if(e && e.code === 'auth/unauthorized-domain'){
          alert('Sign-in is not set up for this domain yet.');
        } else if(e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request'){
          alert('Sign-in failed. Please try again.');
        }
      });
    }

    function saveUser(u){
      var ref = dhDB.collection('users').doc(u.uid);
      ref.get().then(function(doc){
        var data = {
          name: (u.displayName || '').slice(0, 100),
          email: u.email || '',
          photo: u.photoURL || '',
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };
        if(!doc.exists){ data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); }
        return ref.set(data, {merge: true});
      }).catch(function(){});
    }

    function render(u){
      wrap.classList.remove('open');
      if(!u){
        wrap.innerHTML = '<button type="button" class="dh-acct-btn" aria-label="Sign in" title="Sign in with Google">' + userIcon + '</button>';
        wrap.querySelector('.dh-acct-btn').addEventListener('click', signIn);
        return;
      }
      var name = u.displayName || 'My Account';
      var initial = name.trim().charAt(0).toUpperCase() || 'U';
      var avatar = u.photoURL
        ? '<img src="' + esc(u.photoURL) + '" alt="" referrerpolicy="no-referrer">'
        : '<span class="dh-acct-ini">' + esc(initial) + '</span>';
      wrap.innerHTML =
        '<button type="button" class="dh-acct-btn" aria-label="My account" title="My account">' + avatar + '</button>' +
        '<div class="dh-acct-menu">' +
          '<p class="dh-acct-name">' + esc(name) + '</p>' +
          '<p class="dh-acct-mail">' + esc(u.email || '') + '</p>' +
          (MY_DOWNLOADS_URL ? '<a class="dh-acct-link" href="' + esc(MY_DOWNLOADS_URL) + '">My Downloads</a>' : '') +
          '<button type="button" class="dh-acct-link" data-act="out">Sign out</button>' +
        '</div>';
      wrap.querySelector('.dh-acct-btn').addEventListener('click', function(e){
        e.stopPropagation();
        wrap.classList.toggle('open');
      });
      wrap.querySelector('[data-act="out"]').addEventListener('click', function(){ auth.signOut(); });
    }

    document.addEventListener('click', function(e){
      if(!wrap.contains(e.target)){ wrap.classList.remove('open'); }
    });

    auth.onAuthStateChanged(function(u){
      render(u);
      if(u){ saveUser(u); }
    });
  });
})();
