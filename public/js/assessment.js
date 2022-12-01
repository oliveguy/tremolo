test.addEventListener('submit',(e)=>{
  e.preventDefault();
  window.scrollTo({top:0, left:0, behavior:'smooth'});
  // Getting user answers
  selected = document.querySelectorAll('input:checked');
  for(i=0;i<selected.length;i++){
    userAnswers.push(document.querySelectorAll('input:checked')[i].value);
  }
  for(i=0;i<Answers.length;i++){
    if(Answers[i] == userAnswers[i]){
      answerCount++;
    }
  }
  // Calculation
  totalScore = answerCount * unitScore;
  // Show result modal
  document.querySelector('.resultModal').classList.add('show');
  // if Passed
  if(totalScore >= 60){
    userCorrectCount.innerHTML = answerCount;
    userScore.innerHTML = totalScore;
  } else { //If Failed
    msgTitle.innerHTML = 'Failed';
    msgContent.innerHTML ='You have failed the test. Please retake the test.';
    userCorrectCount.innerHTML = answerCount;
    userScore.innerHTML = totalScore;
    // hiddenValue.value = 1;
    // Remove form with Continue button
    passRecord.remove();
    // Create Close Button
    let resultModal = document.querySelector('.resultModal');
    let closeBtn = document.createElement('button');
    closeBtn.id = 'closeBtn';
    closeBtn.innerHTML = 'Close';
    resultModal.appendChild(closeBtn);
    closeBtn.addEventListener('click',()=>{
      resultModal.classList.remove('show');
      // Init values
      selected = [];
      userAnswers = [];
      answerCount = 0;
      totalScore = 0;
    })
  }
})