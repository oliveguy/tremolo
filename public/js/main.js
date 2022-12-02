// LOGIN MODAL
let login = document.querySelector('.login_modal');
login_modal_trigger.addEventListener('click',(e)=>{
    login.classList.toggle('show');
})
// SHIRINK HEADER
window.addEventListener('wheel',(e)=>{
  let headerpanel = document.querySelector('div.header_wrapper');
  if(e.deltaY>0){
    headerpanel.classList.add('small'); 
    headerpanel.classList.remove('large'); 
  } else{ 
    headerpanel.classList.add('large'); 
    headerpanel.classList.remove('small'); 
  }
})
// APPEAR SMOOTH
let topTitle = document.querySelectorAll('.hidden_title');
setTimeout(()=>{
  topTitle[0].classList.remove('hidden_title')
  topTitle[0].classList.add('show_title')
},250)
for(i=1; i<topTitle.length; i++){
  (function(x){
    setTimeout(function(){
      topTitle[x].classList.remove('hidden_title')
      topTitle[x].classList.add('show_title')
    }, 250*x);
  })(i);
}

// COURSE APPEAR
const courseItems = document.querySelectorAll('.courseItems');
const coursePics = document.querySelectorAll('img.courseInfo');
const showElement = function(){
  for(const elements of courseItems){
    if(!elements.classList.contains('show_course')){
        if (window.innerHeight > elements.getBoundingClientRect().top+200){
          elements.classList.add('show_course');
        }
      }
    }
  for(const pics of coursePics){
    if(!pics.classList.contains('show_pic')){
        if (window.innerHeight > pics.getBoundingClientRect().top+300){
          pics.classList.add('show_pic');
        }
      }
    }
  }
window.addEventListener('load', showElement);
window.addEventListener('scroll',showElement);
// INSTRUCTOR
