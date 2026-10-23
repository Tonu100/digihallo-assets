(function(){
  var CLOUD_NAME = 'gwfnrs6k';
  var UPLOAD_PRESET = 'digihallo_reviews';
  var AVATAR_COLORS = ['#6d59ff','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6','#8b5cf6'];

  function colorForName(name){
    var sum = 0;
    for(var i=0;i<name.length;i++){ sum += name.charCodeAt(i); }
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
  }

  function formatDate(ts){
    if(!ts || !ts.seconds) return '';
    var d = new Date(ts.seconds * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, function(c){
      var map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
      return map[c];
    });
  }

  // Shrink the photo before upload (max 1000px, JPEG 75%)
  function compressImage(file, cb){
    if(!file.type || file.type.indexOf('image/') !== 0){ cb(file); return; }
    var reader = new FileReader();
    reader.onload = function(e){
      var img = new Image();
      img.onload = function(){
        var MAX = 1000, w = img.width, h = img.height;
        if(w > MAX || h > MAX){
          if(w >= h){ h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(function(blob){ cb(blob || file); }, 'image/jpeg', 0.75);
      };
      img.onerror = function(){ cb(file); };
      img.src = e.target.result;
    };
    reader.onerror = function(){ cb(file); };
    reader.readAsDataURL(file);
  }

  // Cloudinary serves a smaller, optimized copy
  function optimizedUrl(u){
    if(u && u.indexOf('https://res.cloudinary.com/') === 0){
      return u.replace('/upload/', '/upload/w_600,q_auto,f_auto/');
    }
    return '';
  }

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.dh-reviews-wrap').forEach(function(wrap){
      var postId = wrap.getAttribute('data-postid');
      if(!postId || typeof dhDB === 'undefined') return;

      var productName = (wrap.getAttribute('data-title') || document.title || '').trim().slice(0, 190);
      var productUrl = (wrap.getAttribute('data-url') || location.href.split('#')[0].split('?')[0]).slice(0, 290);

      var selectedRating = 0;
      var selectedFile = null;
      var starsInput = wrap.querySelectorAll('[data-role="dh-input-stars"] span');
      starsInput.forEach(function(st){
        st.addEventListener('click', function(){
          selectedRating = parseInt(st.getAttribute('data-val'));
          starsInput.forEach(function(s2){
            s2.classList.toggle('active', parseInt(s2.getAttribute('data-val')) <= selectedRating);
          });
        });
      });

      // Hidden spam trap field (real people never see or fill it)
      var hp = document.createElement('input');
      hp.type = 'text';
      hp.tabIndex = -1;
      hp.autocomplete = 'off';
      hp.setAttribute('aria-hidden', 'true');
      hp.style.cssText = 'position:absolute!important;left:-9999px!important;opacity:0!important;width:1px!important;height:1px!important;';
      var formBox = wrap.querySelector('.dh-rv-form');
      if(formBox){ formBox.appendChild(hp); }

      var photoInput = wrap.querySelector('[data-role="dh-rv-photo"]');
      var photoPreview = wrap.querySelector('[data-role="dh-rv-photo-preview"]');
      photoInput.addEventListener('change', function(){
        if(this.files && this.files[0]){
          selectedFile = this.files[0];
          var reader = new FileReader();
          reader.onload = function(e){
            photoPreview.src = e.target.result;
            photoPreview.style.display = 'block';
          };
          reader.readAsDataURL(selectedFile);
        }
      });

      function renderStarsStatic(n){
        n = Math.round(n);
        var out = '';
        for(var i=1;i<=5;i++){ out += (i<=n) ? String.fromCharCode(9733) : String.fromCharCode(9734); }
        return out;
      }

      function updateBadge(avg, count){
        var badge = document.querySelector('.dh-rv-badge[data-postid="' + postId + '"]');
        if(!badge) return;
        if(count === 0){
          badge.style.display = 'none';
          return;
        }
        badge.style.display = 'flex';
        badge.querySelector('.dh-rv-badge-text').textContent = avg.toFixed(1) + ' (' + count + ')';
      }

      // Adds star-rating data for Google (only real, approved reviews)
      function injectSchema(avg, count){
        var old = document.getElementById('dh-product-schema');
        if(old){ old.parentNode.removeChild(old); }
        if(!count) return;
        var og = document.querySelector('meta[property="og:image"]');
        var desc = document.querySelector('meta[name="description"]');
        var data = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          'name': productName,
          'url': productUrl,
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': avg.toFixed(1),
            'reviewCount': count,
            'bestRating': '5',
            'worstRating': '1'
          }
        };
        if(og && og.content){ data.image = og.content; }
        if(desc && desc.content){ data.description = desc.content; }
        var s = document.createElement('script');
        s.type = 'application/ld+json';
        s.id = 'dh-product-schema';
        s.text = JSON.stringify(data);
        document.head.appendChild(s);
      }

      var PAGE_SIZE = 5;
      var visibleCount = PAGE_SIZE;
      var allItems = [];

      function renderList(){
        var listEl = wrap.querySelector('[data-role="dh-rv-list"]');
        var html = '';
        var toShow = allItems.slice(0, visibleCount);
        toShow.forEach(function(r){
          var initial = (r.name || '?').trim().charAt(0).toUpperCase();
          var color = colorForName(r.name || '?');
          var dateStr = formatDate(r.timestamp);
          html += '<div class="dh-rv-item">';
          html += '<div class="dh-rv-avatar" style="background:' + color + '">' + escapeHtml(initial) + '</div>';
          html += '<div class="dh-rv-item-body">';
          html += '<div class="dh-rv-item-top"><h5>' + escapeHtml(r.name) + '</h5><span class="dh-rv-date">' + dateStr + '</span></div>';
          html += '<span class="dh-stars-static">' + renderStarsStatic(r.rating) + '</span>';
          html += '<p>' + escapeHtml(r.text) + '</p>';
          var img = optimizedUrl(r.imageUrl);
          if(img){ html += '<img class="dh-rv-photo" loading="lazy" src="' + escapeHtml(img) + '" alt="Customer photo"/>'; }
          if(r.reply){
            html += '<div style="margin-top:10px;padding:10px 12px;background:#f5f3ff;border-left:3px solid #6d59ff;border-radius:6px;font-size:.9rem;color:#334155">';
            html += '<strong style="color:#6d59ff">Reply from Digihallo</strong><br>' + escapeHtml(r.reply) + '</div>';
          }
          html += '</div></div>';
        });
        if(allItems.length > visibleCount){
          html += '<button class="dh-rv-seemore" data-role="dh-rv-seemore">See More Reviews</button>';
        }
        listEl.innerHTML = html;
        var moreBtn = listEl.querySelector('[data-role="dh-rv-seemore"]');
        if(moreBtn){
          moreBtn.addEventListener('click', function(){
            visibleCount += PAGE_SIZE;
            renderList();
          });
        }
      }

      function loadReviews(){
        var listEl = wrap.querySelector('[data-role="dh-rv-list"]');
        // Only approved reviews are readable by the public
        dhDB.collection('reviews')
          .where('postId','==',postId)
          .where('status','==','approved')
          .get().then(function(snap){
          if(snap.empty){
            listEl.innerHTML = '<div class="dh-rv-empty">No reviews yet. Be the first to review this product!</div>';
            wrap.querySelector('[data-role="dh-avg-text"]').textContent = 'No reviews yet';
            updateBadge(0, 0);
            injectSchema(0, 0);
            return;
          }
          var items = [];
          var total = 0;
          snap.forEach(function(doc){ items.push(doc.data()); total += doc.data().rating; });
          items.sort(function(a,b){ return (b.timestamp && a.timestamp) ? (b.timestamp.seconds - a.timestamp.seconds) : 0; });
          var avg = total / items.length;
          wrap.querySelector('[data-role="dh-avg-stars"]').textContent = renderStarsStatic(avg);
          wrap.querySelector('[data-role="dh-avg-text"]').textContent = avg.toFixed(1) + ' out of 5 (' + items.length + ' review' + (items.length>1?'s':'') + ')';
          updateBadge(avg, items.length);
          injectSchema(avg, items.length);
          allItems = items;
          visibleCount = PAGE_SIZE;
          renderList();
        }).catch(function(){
          listEl.innerHTML = '<div class="dh-rv-empty">Could not load reviews right now.</div>';
        });
      }

      function uploadToCloudinary(file, callback){
        var url = 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/image/upload';
        compressImage(file, function(small){
          var formData = new FormData();
          formData.append('file', small, 'review.jpg');
          formData.append('upload_preset', UPLOAD_PRESET);
          fetch(url, { method: 'POST', body: formData })
            .then(function(res){ return res.json(); })
            .then(function(data){ callback(data.secure_url || null); })
            .catch(function(){ callback(null); });
        });
      }

      var submitBtn = wrap.querySelector('[data-role="dh-rv-submit"]');
      submitBtn.addEventListener('click', function(){
        var btn = this;
        var msgEl = wrap.querySelector('[data-role="dh-rv-msg"]');
        var name = wrap.querySelector('[data-role="dh-rv-name"]').value.trim();
        var text = wrap.querySelector('[data-role="dh-rv-text"]').value.trim();
        msgEl.style.display = 'none';
        if(!name || !text || selectedRating === 0){
          msgEl.className = 'dh-rv-msg err';
          msgEl.textContent = 'Please add your name, a rating, and a review.';
          msgEl.style.display = 'block';
          return;
        }

        // Spam trap filled -> pretend success, save nothing
        if(hp.value){
          msgEl.className = 'dh-rv-msg ok';
          msgEl.textContent = 'Thank you! Your review has been posted.';
          msgEl.style.display = 'block';
          return;
        }

        // 30 second wait between reviews from the same browser
        try {
          var last = parseInt(localStorage.getItem('dh_rv_last') || '0', 10);
          if(Date.now() - last < 30000){
            msgEl.className = 'dh-rv-msg err';
            msgEl.textContent = 'Please wait a few seconds before sending another review.';
            msgEl.style.display = 'block';
            return;
          }
        } catch(e) {}

        btn.disabled = true;
        btn.textContent = 'Submitting...';

        function saveReview(imageUrl, photoFailed){
          dhDB.collection('reviews').add({
            postId: postId,
            productName: productName,
            productUrl: productUrl,
            name: name,
            rating: selectedRating,
            text: text,
            imageUrl: imageUrl || null,
            status: 'approved',
            reply: '',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          }).then(function(){
            try { localStorage.setItem('dh_rv_last', String(Date.now())); } catch(e) {}
            msgEl.className = 'dh-rv-msg ok';
            msgEl.textContent = photoFailed
              ? 'Your review has been posted, but the photo could not be uploaded.'
              : 'Thank you! Your review has been posted.';
            msgEl.style.display = 'block';
            wrap.querySelector('[data-role="dh-rv-name"]').value = '';
            wrap.querySelector('[data-role="dh-rv-text"]').value = '';
            photoPreview.style.display = 'none';
            photoInput.value = '';
            selectedFile = null;
            selectedRating = 0;
            starsInput.forEach(function(s2){ s2.classList.remove('active'); });
            loadReviews();
          }).catch(function(){
            msgEl.className = 'dh-rv-msg err';
            msgEl.textContent = 'Something went wrong. Please try again.';
            msgEl.style.display = 'block';
          }).finally(function(){
            btn.disabled = false;
            btn.textContent = 'Submit Review';
          });
        }

        if(selectedFile){
          btn.textContent = 'Uploading photo...';
          uploadToCloudinary(selectedFile, function(url){
            btn.textContent = 'Submitting...';
            saveReview(url, !url);
          });
        } else {
          saveReview(null);
        }
      });

      loadReviews();
    });

    document.querySelectorAll('.dh-rv-badge').forEach(function(badge){
      badge.addEventListener('click', function(){
        var section = document.getElementById('dh-reviews-section');
        if(section){ section.scrollIntoView({behavior:'smooth', block:'start'}); }
      });
    });
  });
})();
