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

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.dh-reviews-wrap').forEach(function(wrap){
      var postId = wrap.getAttribute('data-postid');
      if(!postId || typeof dhDB === 'undefined') return;

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

      function escapeHtml(s){
        return (s||'').replace(/[&<>"]/g, function(c){
          var map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'};
          return map[c];
        });
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
          html += '<div class="dh-rv-avatar" style="background:' + color + '">' + initial + '</div>';
          html += '<div class="dh-rv-item-body">';
          html += '<div class="dh-rv-item-top"><h5>' + escapeHtml(r.name) + '</h5><span class="dh-rv-date">' + dateStr + '</span></div>';
          html += '<span class="dh-stars-static">' + renderStarsStatic(r.rating) + '</span>';
          html += '<p>' + escapeHtml(r.text) + '</p>';
          if(r.imageUrl){ html += '<img class="dh-rv-photo" src="' + r.imageUrl + '"/>'; }
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
        dhDB.collection('reviews').where('postId','==',postId).get().then(function(snap){
          if(snap.empty){
            listEl.innerHTML = '<div class="dh-rv-empty">No reviews yet. Be the first to review this product!</div>';
            wrap.querySelector('[data-role="dh-avg-text"]').textContent = 'No reviews yet';
            updateBadge(0, 0);
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
          allItems = items;
          visibleCount = PAGE_SIZE;
          renderList();
        }).catch(function(){
          listEl.innerHTML = '<div class="dh-rv-empty">Could not load reviews right now.</div>';
        });
      }

      function uploadToCloudinary(file, callback){
        var url = 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/image/upload';
        var formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        fetch(url, { method: 'POST', body: formData })
          .then(function(res){ return res.json(); })
          .then(function(data){ callback(data.secure_url || null); })
          .catch(function(){ callback(null); });
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
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        function saveReview(imageUrl){
          dhDB.collection('reviews').add({
            postId: postId,
            name: name,
            rating: selectedRating,
            text: text,
            imageUrl: imageUrl || null,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          }).then(function(){
            msgEl.className = 'dh-rv-msg ok';
            msgEl.textContent = 'Thank you! Your review has been posted.';
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
            saveReview(url);
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
