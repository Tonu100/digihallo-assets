(function(){
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.dh-reviews-wrap').forEach(function(wrap){
      var postId = wrap.getAttribute('data-postid');
      if(!postId || typeof dhDB === 'undefined') return;

      var selectedRating = 0;
      var starsInput = wrap.querySelectorAll('[data-role="dh-input-stars"] span');
      starsInput.forEach(function(st){
        st.addEventListener('click', function(){
          selectedRating = parseInt(st.getAttribute('data-val'));
          starsInput.forEach(function(s2){
            s2.classList.toggle('active', parseInt(s2.getAttribute('data-val')) <= selectedRating);
          });
        });
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

      function loadReviews(){
        var listEl = wrap.querySelector('[data-role="dh-rv-list"]');
        dhDB.collection('reviews').where('postId','==',postId).get().then(function(snap){
          if(snap.empty){
            listEl.innerHTML = '<div class="dh-rv-empty">No reviews yet. Be the first to review this product!</div>';
            wrap.querySelector('[data-role="dh-avg-text"]').textContent = 'No reviews yet';
            return;
          }
          var items = [];
          var total = 0;
          snap.forEach(function(doc){ items.push(doc.data()); total += doc.data().rating; });
          items.sort(function(a,b){ return (b.timestamp && a.timestamp) ? (b.timestamp.seconds - a.timestamp.seconds) : 0; });
          var avg = total / items.length;
          wrap.querySelector('[data-role="dh-avg-stars"]').textContent = renderStarsStatic(avg);
          wrap.querySelector('[data-role="dh-avg-text"]').textContent = avg.toFixed(1) + ' out of 5 (' + items.length + ' review' + (items.length>1?'s':'') + ')';
          var html = '';
          items.forEach(function(r){
            html += '<div class="dh-rv-item"><span class="dh-stars-static">' + renderStarsStatic(r.rating) + '</span><h5>' + escapeHtml(r.name) + '</h5><p>' + escapeHtml(r.text) + '</p></div>';
          });
          listEl.innerHTML = html;
        }).catch(function(){
          listEl.innerHTML = '<div class="dh-rv-empty">Could not load reviews right now.</div>';
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
        btn.disabled = true;
        btn.textContent = 'Submitting...';
        dhDB.collection('reviews').add({
          postId: postId,
          name: name,
          rating: selectedRating,
          text: text,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function(){
          msgEl.className = 'dh-rv-msg ok';
          msgEl.textContent = 'Thank you! Your review has been posted.';
          msgEl.style.display = 'block';
          wrap.querySelector('[data-role="dh-rv-name"]').value = '';
          wrap.querySelector('[data-role="dh-rv-text"]').value = '';
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
      });

      loadReviews();
    });
  });
})();
