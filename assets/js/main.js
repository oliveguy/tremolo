let login = document.querySelector('.login_modal');
login_modal_trigger.addEventListener('click',(e)=>{
    login.classList.toggle('show');
})
setTimeout(show_smooth(blur_bg),750)
function show_smooth(target){
    target.style.opacity = 1;
}