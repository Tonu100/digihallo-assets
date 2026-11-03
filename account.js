(function(){
  // Your Apps Script web app URL (it returns the signed-in customer's purchases).
  var DOWNLOADS_API = 'https://script.google.com/macros/s/AKfycbxGzg8c-6lSiPEybUSN-cMnotoQT45I8ZBteKa-RF_zbjltycZnVVpTYuiBLXpQM_uD/exec';
  var SUPPORT_EMAIL = 'mail.digihallo@gmail.com';

  var box;
  var user = null;
  var tab = 'downloads';
  var state = { status: 'loading', list: [], msg: '' };

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  var G_LOGO = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';

  var FAQ = [
    ['I paid, but my product is not listed.',
     'Wait a minute and refresh this page. Make sure you signed in with the same email you entered on the payment form. Still missing? Email us with your order details.'],
    ['I used a different email on the payment form.',
     'Sign out and sign in with the Google account for that email. If that email has no Google account, use the download link we emailed you.'],
    ['I did not receive the email.',
     'Check your Spam or Junk folder. You can also download from the My Downloads tab. If you entered a wrong email, contact us and we will help.'],
    ['Can I download again later?',
     'Yes. Your purchases stay in My Downloads every time you sign in.']
  ];

  function addCss(){
    var css = [
      '#dh-account{max-width:900px;margin:24px auto;padding:0 12px;font-family:inherit;color:inherit;line-height:1.55}',
      '.dh-ac-card{border:1px solid rgba(128,128,128,.22);border-radius:16px;padding:24px;margin-bottom:20px;background:rgba(128,128,128,.03)}',
      '.dh-ac-center{text-align:center;padding:40px 24px}',
      '.dh-ac-card h2{margin:0 0 8px;font-size:1.35rem}',
      '.dh-ac-card h3{margin:22px 0 8px;font-size:1.05rem}',
      '.dh-ac-card p{margin:0 0 14px;opacity:.82}',
      '.dh-ac-google{display:inline-flex;align-items:center;gap:10px;background:#fff;color:#3c4043;border:1px solid #dadce0;border-radius:8px;padding:11px 20px;font-weight:600;font-size:15px;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(0,0,0,.08)}',
      '.dh-ac-google:hover{box-shadow:0 2px 8px rgba(0,0,0,.15)}',
      '.dh-ac-fine{font-size:.85rem;opacity:.65;margin:14px 0 0!important}',
      '.dh-ac-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}',
      '.dh-ac-step{border:1px solid rgba(128,128,128,.22);border-radius:14px;padding:18px;background:rgba(128,128,128,.03)}',
      '.dh-ac-num{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#6d59ff;color:#fff;font-weight:700;margin-bottom:10px}',
      '.dh-ac-step b{display:block;margin-bottom:4px}',
      '.dh-ac-step span{opacity:.75;font-size:.92rem}',
      '.dh-ac-layout{display:grid;grid-template-columns:250px 1fr;gap:20px;align-items:start}',
      '.dh-ac-side{border:1px solid rgba(128,128,128,.22);border-radius:16px;padding:22px 18px;background:rgba(128,128,128,.03)}',
      '.dh-ac-profile{text-align:center}',
      '.dh-ac-profile img,.dh-ac-ini{width:72px;height:72px;border-radius:50%;object-fit:cover;margin:0 auto 10px;display:block}',
      '.dh-ac-ini{background:#6d59ff;color:#fff;font-weight:700;font-size:28px;display:flex;align-items:center;justify-content:center}',
      '.dh-ac-name{font-weight:700;font-size:1.1rem;margin:0}',
      '.dh-ac-mail,.dh-ac-since{margin:2px 0 0!important;opacity:.7;font-size:.88rem;word-break:break-all}',
      '.dh-ac-nav{display:flex;flex-direction:column;gap:6px;margin:18px 0}',
      '.dh-ac-nav button,.dh-ac-nav a{display:block;width:100%;text-align:left;background:transparent;border:0;color:inherit!important;text-decoration:none!important;border-radius:10px;padding:10px 14px;font-weight:600;font-size:14.5px;cursor:pointer;font-family:inherit;box-sizing:border-box}',
      '.dh-ac-nav button:hover,.dh-ac-nav a:hover{background:rgba(109,89,255,.1)}',
      '.dh-ac-nav button.on{background:#6d59ff;color:#fff!important}',
      '.dh-ac-out{width:100%;background:transparent;border:1.5px solid #6d59ff;color:#6d59ff;border-radius:999px;padding:8px 18px;font-weight:600;cursor:pointer;font-family:inherit}',
      '.dh-ac-out:hover{background:#6d59ff;color:#fff}',
      '.dh-ac-main{border:1px solid rgba(128,128,128,.22);border-radius:16px;padding:24px;background:rgba(128,128,128,.03);min-height:200px}',
      '.dh-ac-main h2{margin:0 0 8px;font-size:1.35rem}',
      '.dh-ac-main h3{margin:22px 0 8px;font-size:1.05rem}',
      '.dh-ac-main p{margin:0 0 14px;opacity:.82}',
      '.dh-ac-item{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 0;border-top:1px solid rgba(128,128,128,.18)}',
      '.dh-ac-list .dh-ac-item:first-child{border-top:0}',
      '.dh-ac-item b{display:block}',
      '.dh-ac-item small{opacity:.65}',
      '.dh-ac-dl{display:inline-block;background:#6d59ff;color:#fff!important;text-decoration:none!important;border-radius:8px;padding:8px 18px;font-weight:600;font-size:14px}',
      '.dh-ac-note{background:rgba(109,89,255,.08);border-radius:10px;padding:14px 16px;margin:0!important;opacity:1!important}',
      '.dh-ac-ol{margin:0 0 6px;padding-left:20px;opacity:.85}',
      '.dh-ac-ol li{margin-bottom:6px}',
      '.dh-ac details{border-top:1px solid rgba(128,128,128,.18);padding:12px 0}',
      '#dh-account details:first-of-type{border-top:0}',
      '#dh-account summary{cursor:pointer;font-weight:600}',
      '#dh-account details p{margin:8px 0 0}',
      '@media(max-width:720px){.dh-ac-steps{grid-template-columns:1fr}.dh-ac-layout{grid-template-columns:1fr}.dh-ac-nav{flex-direction:row;overflow-x:auto;margin:14px 0}.dh-ac-nav button,.dh-ac-nav a{white-space:nowrap;width:auto}}'
    ].join('');
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }

  function signIn(){
    if(window.dhSignIn){ window.dhSignIn(); return; }
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(function(){});
  }

  function note(t){ return '<p class="dh-ac-note">' + t + '</p>'; }

  function faqHtml(){
    return FAQ.map(function(f){
      return '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>';
    }).join('');
  }

  // ---------- logged out ----------
  function showLoggedOut(){
    user = null;
    box.innerHTML =
      '<div class="dh-ac-card dh-ac-center">' +
        '<h2>Access your downloads</h2>' +
        '<p>Sign in with the Google account that matches the email you entered on the payment form.</p>' +
        '<button type="button" class="dh-ac-google">' + G_LOGO + '<span>Continue with Google</span></button>' +
        '<p class="dh-ac-fine">Secure sign-in with Google. No Google account for that email? Use the download link we emailed you.</p>' +
      '</div>' +
      '<div class="dh-ac-steps">' +
        '<div class="dh-ac-step"><div class="dh-ac-num">1</div><b>Pay securely</b><span>Complete your payment and enter a valid email address.</span></div>' +
        '<div class="dh-ac-step"><div class="dh-ac-num">2</div><b>Sign in</b><span>Use Google with the same email you entered on the payment form.</span></div>' +
        '<div class="dh-ac-step"><div class="dh-ac-num">3</div><b>Download</b><span>Your purchases appear here, ready to download anytime.</span></div>' +
      '</div>' +
      '<div class="dh-ac-card"><h2>Need help?</h2>' + faqHtml() +
        '<p class="dh-ac-fine">Still stuck? Email <a href="mailto:' + SUPPORT_EMAIL + '">' + SUPPORT_EMAIL + '</a></p></div>';
  }

  // ---------- logged in ----------
  function downloadsPanel(){
    var h = '<h2>My Downloads</h2><p>Purchases made with <b>' + esc(user.email || '') + '</b> appear below.</p>';
    if(!DOWNLOADS_API){ return h + note('Downloads are temporarily unavailable. Please try again later or contact us.'); }
    if(state.status === 'loading'){ return h + '<p>Loading your purchases...</p>'; }
    if(state.status === 'error'){ return h + note(esc(state.msg)); }
    if(!state.list.length){
      return h + note('No purchases found for this email yet. If you just paid, please wait a minute and refresh this page. Used a different email on the payment form? Sign in with that email instead.');
    }
    var items = state.list.map(function(o){
      var link = /^https:\/\//.test(o.link || '') ? o.link : '';
      return '<div class="dh-ac-item"><div><b>' + esc(o.product) + '</b><small>' + esc(o.date || '') + '</small></div>' +
        (link ? '<a class="dh-ac-dl" href="' + esc(link) + '" target="_blank" rel="noopener">Download</a>' : '') + '</div>';
    }).join('');
    return h + '<div class="dh-ac-list">' + items + '</div>';
  }

  function helpPanel(){
    return '<h2>Help &amp; Support</h2>' +
      '<h3>How to download</h3>' +
      '<ol class="dh-ac-ol">' +
        '<li>Open the <b>My Downloads</b> tab.</li>' +
        '<li>Click <b>Download</b> next to your product.</li>' +
        '<li>Your files open in Google Drive, where you can download them.</li>' +
      '</ol>' +
      '<h3>Common questions</h3>' + faqHtml() +
      '<p class="dh-ac-fine">Still stuck? Email <a href="mailto:' + SUPPORT_EMAIL + '">' + SUPPORT_EMAIL + '</a></p>';
  }

  function draw(){
    if(!user){ return; }
    var name = user.displayName || 'My Account';
    var since = '';
    if(user.metadata && user.metadata.creationTime){
      var d = new Date(user.metadata.creationTime);
      since = 'Member since ' + d.toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'});
    }
    var avatar = user.photoURL
      ? '<img src="' + esc(user.photoURL) + '" alt="" referrerpolicy="no-referrer">'
      : '<span class="dh-ac-ini">' + esc((name.trim().charAt(0) || 'U').toUpperCase()) + '</span>';

    box.innerHTML =
      '<div class="dh-ac-layout">' +
        '<aside class="dh-ac-side">' +
          '<div class="dh-ac-profile">' + avatar +
            '<p class="dh-ac-name">' + esc(name) + '</p>' +
            '<p class="dh-ac-mail">' + esc(user.email || '') + '</p>' +
            (since ? '<p class="dh-ac-since">' + esc(since) + '</p>' : '') +
          '</div>' +
          '<nav class="dh-ac-nav">' +
            '<button type="button" data-tab="downloads" class="' + (tab === 'downloads' ? 'on' : '') + '">My Downloads</button>' +
            '<button type="button" data-tab="help" class="' + (tab === 'help' ? 'on' : '') + '">Help &amp; Support</button>' +
            '<a href="/">Continue shopping</a>' +
          '</nav>' +
          '<button type="button" class="dh-ac-out">Sign out</button>' +
        '</aside>' +
        '<section class="dh-ac-main">' + (tab === 'help' ? helpPanel() : downloadsPanel()) + '</section>' +
      '</div>';
  }

  function loadOrders(u){
    state = { status: 'loading', list: [], msg: '' };
    draw();
    if(!DOWNLOADS_API){ return; }
    u.getIdToken().then(function(t){
      return fetch(DOWNLOADS_API + '?idToken=' + encodeURIComponent(t));
    }).then(function(r){ return r.json(); }).then(function(d){
      if(!user || user.uid !== u.uid){ return; }
      if(d && d.error){
        state = { status: 'error', list: [], msg: 'We could not verify your sign-in. Please sign out, sign in again and retry.' };
      } else {
        state = { status: 'ok', list: (d && d.orders) || [], msg: '' };
      }
      draw();
    }).catch(function(){
      if(!user || user.uid !== u.uid){ return; }
      state = { status: 'error', list: [], msg: 'Could not load your purchases right now. Please try again later.' };
      draw();
    });
  }

  function showLoggedIn(u){
    user = u;
    tab = 'downloads';
    loadOrders(u);
  }

  function start(){
    box = document.getElementById('dh-account');
    if(!box || typeof firebase === 'undefined' || !firebase.auth){ return; }
    addCss();
    box.addEventListener('click', function(e){
      var t = e.target.closest ? e.target.closest('[data-tab],.dh-ac-out,.dh-ac-google') : null;
      if(!t){ return; }
      if(t.classList.contains('dh-ac-google')){ signIn(); return; }
      if(t.classList.contains('dh-ac-out')){ firebase.auth().signOut(); return; }
      var k = t.getAttribute('data-tab');
      if(k){ tab = k; draw(); }
    });
    box.innerHTML = '<div class="dh-ac-card dh-ac-center"><p>Loading...</p></div>';
    firebase.auth().onAuthStateChanged(function(u){
      if(u){ showLoggedIn(u); } else { showLoggedOut(); }
    });
  }

  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', start); }
  else { start(); }
})();
