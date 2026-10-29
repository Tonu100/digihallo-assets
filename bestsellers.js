(function(){
  var LABEL = 'BestSeller';   // Blogger label that marks best sellers
  var MAX = 8;                // how many products to show
  var TITLE = 'Best Sellers';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function bigImage(u){
    return (u || '').replace(/\/s\d+(-c)?\//, '/s680/').replace(/=s\d+(-c)?$/, '=s680');
  }

  function find(re, text){
    var m = re.exec(text || '');
    return m ? m[1].trim() : '';
  }

  function run(){
    var box = document.getElementById('dh-bestsellers');
    if(!box) return;
    // The ads section the gadget sits in sets line-height:0, so reset it here
    box.style.cssText = 'display:block;float:left;width:100%;line-height:1.5;clear:both;';

    fetch('/feeds/posts/default/-/' + encodeURIComponent(LABEL) + '?alt=json&max-results=' + MAX)
      .then(function(r){ return r.json(); })
      .then(function(d){
        var list = (d.feed && d.feed.entry) || [];
        if(!list.length){ box.style.display = 'none'; return; }

        var cards = '';
        list.forEach(function(e){
          var link = '';
          (e.link || []).forEach(function(l){ if(l.rel === 'alternate'){ link = l.href; } });
          var title = e.title && e.title.$t ? e.title.$t : '';
          var html = (e.content && e.content.$t) || '';
          var idm = /post-(\d+)/.exec((e.id && e.id.$t) || '');
          var id = idm ? idm[1] : '';

          var img = e['media$thumbnail'] ? bigImage(e['media$thumbnail'].url) : '';
          if(!img){
            var m = /<img[^>]+src="([^"]+)"/i.exec(html);
            if(m){ img = m[1]; }
          }

          // Price and sale label are written in the post as #price=(...) #sale=(...)
          var price = find(/#price=\(([^)]*)\)/i, html);
          var sale = find(/#sale=\(([^)]*)\)/i, html);

          cards +=
            '<article class="blog-post hentry product piki-l post-filter" data-id="' + esc(id) + '">' +
              '<button aria-label="Save it" class="oixli-mylove like"></button>' +
              '<button aria-label="Remove it" class="oixli-mylove unlike"></button>' +
              '<div class="post-filter-image">' +
                '<a class="post-filter-inner image-nos" href="' + esc(link) + '">' +
                  '<span class="post-filter-link">' +
                    (img ? '<img class="snip-thumbnail lazy-img" src="' + esc(img) + '" alt="' + esc(title) + '">' : '') +
                  '</span>' +
                '</a>' +
                '<div class="super-category">' +
                  '<h2 class="entry-title vcard"><a href="' + esc(link) + '" title="' + esc(title) + '">' + esc(title) + '</a></h2>' +
                  ((price || sale) ?
                    '<div class="product-info">' +
                      (price ? '<span class="entry-price">' + esc(price) + '</span>' : '') +
                      (sale ? '<span class="entry-sale">' + esc(sale) + '</span>' : '') +
                    '</div>' : '') +
                '</div>' +
              '</div>' +
            '</article>';
        });

        box.innerHTML =
          '<div class="blog-posts hfeed container index-posts-wrap">' +
            '<div class="widget-title"><h3>' + esc(TITLE) + '</h3></div>' +
            '<div class="grid-posts">' + cards + '</div>' +
          '</div>';
      })
      .catch(function(){ box.style.display = 'none'; });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
