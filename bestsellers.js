(function(){
  var LABEL = 'BestSeller';   // Blogger label used to mark best sellers
  var MAX = 8;                // how many products to show
  var TITLE = 'Best Sellers';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function bigImage(u){
    return (u || '').replace(/\/s\d+(-c)?\//, '/s500/').replace(/=s\d+(-c)?$/, '=s500');
  }

  function addCss(){
    if(document.getElementById('dh-bs-css')) return;
    var st = document.createElement('style');
    st.id = 'dh-bs-css';
    st.textContent =
      '#dh-bestsellers{max-width:1200px;margin:32px auto;padding:0 16px}' +
      '#dh-bestsellers h2{font-size:1.6rem;margin:0 0 18px;font-weight:700}' +
      '.dh-bs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}' +
      '.dh-bs-card{display:block;border:1px solid rgba(128,128,128,.25);border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;background:rgba(128,128,128,.04);transition:transform .2s,box-shadow .2s}' +
      '.dh-bs-card:hover{transform:translateY(-3px);box-shadow:0 8px 22px rgba(0,0,0,.12)}' +
      '.dh-bs-img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:rgba(128,128,128,.15)}' +
      '.dh-bs-body{padding:12px 14px 14px}' +
      '.dh-bs-name{font-weight:600;font-size:.98rem;line-height:1.35;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.dh-bs-btn{display:inline-block;background:#6d59ff;color:#fff;padding:6px 14px;border-radius:8px;font-size:.85rem;font-weight:600}';
    document.head.appendChild(st);
  }

  function run(){
    var box = document.getElementById('dh-bestsellers');
    if(!box) return;
    fetch('/feeds/posts/default/-/' + encodeURIComponent(LABEL) + '?alt=json&max-results=' + MAX)
      .then(function(r){ return r.json(); })
      .then(function(d){
        var list = (d.feed && d.feed.entry) || [];
        if(!list.length){ box.style.display = 'none'; return; }
        addCss();
        var html = '<h2>' + esc(TITLE) + '</h2><div class="dh-bs-grid">';
        list.forEach(function(e){
          var link = '';
          (e.link || []).forEach(function(l){ if(l.rel === 'alternate'){ link = l.href; } });
          var title = e.title && e.title.$t ? e.title.$t : '';
          var img = e['media$thumbnail'] ? bigImage(e['media$thumbnail'].url) : '';
          if(!img){
            var m = /<img[^>]+src="([^"]+)"/i.exec((e.content && e.content.$t) || '');
            if(m){ img = m[1]; }
          }
          html += '<a class="dh-bs-card" href="' + esc(link) + '">' +
            (img ? '<img class="dh-bs-img" loading="lazy" src="' + esc(img) + '" alt="' + esc(title) + '">' : '<div class="dh-bs-img"></div>') +
            '<div class="dh-bs-body"><p class="dh-bs-name">' + esc(title) + '</p><span class="dh-bs-btn">View Product</span></div></a>';
        });
        html += '</div>';
        box.innerHTML = html;
      })
      .catch(function(){ box.style.display = 'none'; });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
