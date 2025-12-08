(function(){
  // Lightweight, non-blocking enhancements only
  document.addEventListener('DOMContentLoaded', () => {
    const imgs = document.querySelectorAll('.card img');
    imgs.forEach(img => {
      if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
      if(img.complete) img.classList.add('loaded');
      else img.addEventListener('load', ()=> img.classList.add('loaded'));
    });

    const prefetchLinks = () => {
      document.querySelectorAll('.card a').forEach(a=>{
        const href = a.getAttribute('href');
        if(!href) return;
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      });
    };

    if('requestIdleCallback' in window){
      requestIdleCallback(prefetchLinks, {timeout:2000});
    } else {
      setTimeout(prefetchLinks, 2000);
    }
  });
})();
