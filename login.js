(function(){
  // Page that shows the customer dashboard (create it in Blogger with this permalink)
  var ACCOUNT_URL = '/p/my-account.html';

  function ready(fn){
    if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn); }
    else { fn(); }
  }

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  var ICON_USER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
  var ICON_DL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></svg>';
  var ICON_OUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';

  ready(function(){
    if(typeof firebase === 'undefined' || !firebase.auth || typeof dhDB === 'undefined'){ return; }
    var host = document.querySelector('.search-wrap');
    if(!host){ return; }

    var auth = firebase.auth();

    var css = document.createElement('style');
    css.textContent =
      '.dh-acct{position:relative;display:inline-flex;align-items:center;margin:0 6px}' +
      '.dh-signin{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #6d59ff;background:transparent;color:#6d59ff;font-family:inherit;font-weight:600;font-size:13px;line-height:1;cursor:pointer;transition:background .2s,color .2s}' +
      '.dh-signin:hover{background:#6d59ff;color:#fff}' +
      '.dh-signin svg{width:16px;height:16px}' +
      '.dh-avatar-btn{width:36px;height:36px;border-radius:50%;padding:2px;border:2px solid #6d59ff;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:box-shadow .2s}' +
      '.dh-avatar-btn:hover{box-shadow:0 0 0 3px rgba(109,89,255,.25)}' +
      '.dh-avatar-btn img,.dh-ini{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}' +
      '.dh-ini{background:#6d59ff;color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center}' +
      '.dh-acct-menu{display:none;position:fixed;top:60px;right:12px;width:272px;background:var(--submenu-bg-color,#fff);color:var(--sub-menu-text-color,#1e293b);border:1px solid rgba(128,128,128,.22);border-radius:14px;box-shadow:0 14px 34px rgba(0,0,0,.16);overflow:hidden;z-index:99999;line-height:1.4;font-size:14px;text-align:left}' +
      '.dh-acct-menu.open{display:block}' +
      '.dh-menu-head{display:flex;align-items:center;gap:12px;padding:16px;border-bottom:1px solid rgba(128,128,128,.18);background:rgba(109,89,255,.06)}' +
      '.dh-menu-head .dh-ini,.dh-menu-head img{width:44px;height:44px;flex:0 0 44px;border-radius:50%;object-fit:cover}' +
      '.dh-menu-name{font-weight:700;margin:0;word-break:break-word}' +
      '.dh-menu-mail{opacity:.7;font-size:12px;margin:2px 0 0;word-break:break-all}' +
      '.dh-menu-item{display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;background:none;border:0;color:inherit;font-family:inherit;font-size:14px;cursor:pointer;text-decoration:none;text-align:left;transition:background .15s}' +
      '.dh-menu-item:hover{background:rgba(109,89,255,.08);color:#6d59ff}' +
      '.dh-menu-item svg{width:18px;height:18px;flex:0 0 18px}' +
      '.dh-menu-sep{border-top:1px solid rgba(128,128,128,.18)}' +
      '@media(max-width:640px){.dh-signin{width:34px;padding:0}.dh-signin span{display:none}}';
    document.head.appendChild(css);

    var wrap = document.createElement('div');
    wrap.className = 'dh-acct';
    var first = host.querySelector('.oixli-loveit');
    if(first){ host.insertBefore(wrap, first); } else { host.insertBefore(wrap, host.firstChild); }

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
    window.dhSignIn = signIn;

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

    function avatarHtml(u, name){
      if(u.photoURL){ return '<img src="' + esc(u.photoURL) + '" alt="" referrerpolicy="no-referrer">'; }
      return '<span class="dh-ini">' + esc((name.trim().charAt(0) || 'U').toUpperCase()) + '</span>';
    }

    var menuEl = null;

    function closeMenu(){ if(menuEl){ menuEl.classList.remove('open'); } }

    function placeMenu(btn){
      var r = btn.getBoundingClientRect();
      menuEl.style.top = Math.round(r.bottom + 10) + 'px';
      menuEl.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px';
    }

    function render(u){
      if(menuEl && menuEl.parentNode){ menuEl.parentNode.removeChild(menuEl); }
      menuEl = null;
      if(!u){
        wrap.innerHTML = '<button type="button" class="dh-signin" aria-label="Sign in" title="Sign in with Google">' + ICON_USER + '<span>Sign in</span></button>';
        wrap.querySelector('.dh-signin').addEventListener('click', signIn);
        return;
      }
      var name = u.displayName || 'My Account';
      wrap.innerHTML = '<button type="button" class="dh-avatar-btn" aria-label="My account" title="My account">' + avatarHtml(u, name) + '</button>';

      menuEl = document.createElement('div');
      menuEl.className = 'dh-acct-menu';
      menuEl.innerHTML =
        '<div class="dh-menu-head">' + avatarHtml(u, name) +
          '<div><p class="dh-menu-name">' + esc(name) + '</p><p class="dh-menu-mail">' + esc(u.email || '') + '</p></div></div>' +
        '<a class="dh-menu-item" href="' + esc(ACCOUNT_URL) + '">' + ICON_DL + '<span>My Account &amp; Downloads</span></a>' +
        '<button type="button" class="dh-menu-item dh-menu-sep" data-act="out">' + ICON_OUT + '<span>Sign out</span></button>';
      document.body.appendChild(menuEl);

      var btn = wrap.querySelector('.dh-avatar-btn');
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        placeMenu(btn);
        menuEl.classList.toggle('open');
      });
      menuEl.querySelector('[data-act="out"]').addEventListener('click', function(){
        closeMenu();
        auth.signOut();
      });
    }

    document.addEventListener('click', function(e){
      if(menuEl && !menuEl.contains(e.target) && !wrap.contains(e.target)){ closeMenu(); }
    });
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, {passive: true});

    auth.onAuthStateChanged(function(u){
      render(u);
      if(u){ saveUser(u); }
    });
  });
})();
