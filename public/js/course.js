let user_panel = document.querySelector('.user_panel');
user_panel_triger.addEventListener('click',()=>{
  user_panel.classList.toggle('show')
})
let aside = document.querySelectorAll('.module_list')[0]
aside.addEventListener('focus',function(){
  this.style.transition = "all .5s";
})
// MENU EXPAND
const topMenu = document.querySelectorAll('span.module_list');
topMenu.forEach((menu,index)=>{
  menu.addEventListener('click',function(){
    this.nextElementSibling.classList.toggle('on');
    this.childNodes[1].innerHTML = "-";
    topMenu.forEach(function(otherMenu, index2){
      if(index !== index2){
        otherMenu.nextElementSibling.classList.remove('on')
        otherMenu.childNodes[1].innerHTML = "+";
      }
    })
  })
})

// ASIDE PANEL OPERATION
const asidepanel = document.querySelector('.module_list')
close_aside.addEventListener('click',()=>{
  asidepanel.classList.remove('module_list');
  asidepanel.classList.add('aside_hidden');
  expand_aside.style.display="block";
  expand_aside.addEventListener('click',()=>{
    asidepanel.classList.remove('aside_hidden');
    asidepanel.classList.add('module_list');
    expand_aside.style.display="none";
  })
})