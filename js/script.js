/* Lightweight non-blocking image enhancement script */
(function(){
  function markImagesLoaded(){
    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
      if(img.complete) img.classList.add('loaded');
      else img.addEventListener('load', ()=> img.classList.add('loaded'), {once:true});
    });
  }
  /* Mark images loaded immediately if DOM ready, else wait for load event */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', markImagesLoaded);
  } else {
    markImagesLoaded();
  }
})();
