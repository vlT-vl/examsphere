// examsphere.js <> script main exmsphere
//******************************************************************************

import jsonparse from './module/jsonparse.js'
let quizData;
let totalScore = 0;
let correctAnswers = 0;
let dateAnswers = 0;
let totalQuestions;
let titoloQuiz;
const maxScore = 500;
let timeLeft = 0;
let effectiveTime = 0;

const quizContainer = document.getElementById('quiz-container');

function mainfn(data) {
  const tabTitle = document.getElementById('tabTitle');
  const quizTitle = document.getElementById('quiz-title');
  const questionsN = document.getElementById('questionsN');
  const questionsComplete = document.getElementById('questionsComplete');
  const questionsTimer = document.getElementById('questionsTimer');


  titoloQuiz = data.title;
  tabTitle.textContent = `examsphere - ${titoloQuiz}`;
  quizTitle.textContent = titoloQuiz;

  // Logica Timer quiz

  if (timeLeft == 0) {
    timeLeft = parseInt(data.time) * 60;
    questionsTimer.textContent = `${Math.round(timeLeft /60)} min rimanenti`;
  }

  const countdown = setInterval(() => {
    timeLeft--;
    effectiveTime++;
    questionsTimer.textContent = ` ${Math.round(timeLeft /60)} min rimanenti`;

    if (timeLeft <= 0) {
      effectiveTime++;
      questionsTimer.textContent = "TEMPO SCADUTO!"
      questionsTimer.style.backgroundColor = "red";
    }
  }, 1000);

  data.questions.forEach((item, index) => {
    const questionDiv = document.createElement('div');
    const pointsPerQuestion = maxScore / data.questions.length;
    totalQuestions = data.questions.length;
    questionsN.textContent = `${totalQuestions} domande`;
    questionDiv.className = 'question';

    // Aggiungi il testo della domanda
    const questionText = document.createElement('h3');
    questionText.textContent = `${item.question}`;
    questionDiv.appendChild(questionText);

    // Aggiungi l'immagine (se esiste)
    if (item.image) {
      const questionImage = document.createElement('img');
      questionImage.src = item.image;
      questionImage.alt = `Immagine per la domanda ${index + 1}`;
      questionDiv.appendChild(questionImage);
    }

    // Aggiungi le risposte
    const scoreDisplay = document.getElementById('score');
    const answersDiv = document.createElement('div');
    answersDiv.className = 'answers';

    item.answers.forEach(answer => {
      const answerDiv = document.createElement('div');
      answerDiv.className = 'answer';
      answerDiv.textContent = answer;

      answerDiv.addEventListener('click', () => {
        if (answer === item.correct) {
          totalScore += pointsPerQuestion;
          correctAnswers++;
          dateAnswers++;
        } else {
          dateAnswers++;
        }

        questionsComplete.textContent = `domande completate: ${dateAnswers} / ${totalQuestions}`;
        //scoreDisplay.textContent = `Score: ${Math.round(totalScore, maxScore)} / 500`;

        // Disabilita ulteriori risposte per questa domanda
        Array.from(answersDiv.children).forEach(child => {
          child.style.pointerEvents = 'none';
          child.style.backgroundColor = '#a1a1a1';
        });
      });

      answersDiv.appendChild(answerDiv);
    });

    questionDiv.appendChild(answersDiv);
    quizContainer.appendChild(questionDiv);
  });
}

// Esegue il parse del file JSON
const storedPath = localStorage.getItem('jsonPath');
const storedToken = localStorage.getItem('token');

jsonparse(storedPath, storedToken)
  .then((jsonData) => {
    quizData = jsonData;
    localStorage.setItem('jsonPath', null);
    localStorage.setItem('token', null);
    mainfn(quizData);
  })
  .catch((e) => {
    window.location.href = 'index.html';
  });

// funzione per salvare lo score
document.getElementById('complete-button').addEventListener('click', examComplete);

function examComplete() {
  const username = document.getElementById('username').value;
  const now = new Date();
  const dateTime = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  let isPromoted;
  let statColor;

  if (Math.round(totalScore) > 350) {
    isPromoted = "PROMOSSO";
    statColor = "green";
  } else {
    isPromoted = "BOCCIATO";
    statColor = "red";
  }

  if (dateAnswers < Math.round(totalQuestions / 2)) {
    alert('Devi almeno completare la metà delle domande prima di consegnare!');
    return;
  } else if (!username) {
    alert('Inserisci Nome e Cognome prima di esportare il risultato!');
    return;
  }

  // Apri una nuova finestra per mostrare il report
  const reportWindow = window.open('', '_blank');
  reportWindow.document.open();
  reportWindow.document.write(`<!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>${username}-${titoloQuiz}</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #1e242e; }
                .result { margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: white; max-width: 500px; }
                h1 { color: #2e3747; }
                p { font-size: 1.0em; }
                #download-btn { position: absolute; top: 20px; right: 20px; background-color: #007BFF; color: white; border: none; padding: 10px 20px; font-size: 16px; cursor: pointer; border-radius: 5px; }
                #download-btn:hover { background-color: #0056b3; }
            </style>
        </head>
        <body>
            <button id='download-btn'>Download</button>
            <div class='result'>
                <h1>${titoloQuiz}</h1>
                <h3>Risultato Quiz</h3>
                <p><strong>${dateTime}</strong></p>
                <p>Candidato:<strong> ${username}</strong></p>
                <p>Punteggio:<strong> ${Math.round(totalScore)} / 500</strong></p>
                <p>Domande Completate:<strong> ${dateAnswers} / ${totalQuestions}</strong></p>
                <p>Risposte Corrette:<strong> ${correctAnswers} / ${totalQuestions}</strong></p>
                <p>Tempo Totale Impiegato:<strong> ${Math.round(effectiveTime /60)} Minuti</strong></p>
                <br>
                <h1 style='color:${statColor}'><strong>${isPromoted}</strong></h1>
            </div>
            <script>
                document.getElementById('download-btn').addEventListener('click', function() {
                    const button = document.getElementById('download-btn');
                    button.remove(); // Rimuove il bottone prima del download
                    const resultHTML = document.documentElement.outerHTML;
                    const blob = new Blob([resultHTML], { type: 'text/html' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'Risultato-${titoloQuiz}-${username}.html';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            </script>
        </body>
        </html>`);
  reportWindow.document.close();

  // Dopo 1 secondo, la pagina principale viene reindirizzata a complete.html
  setTimeout(() => {
    window.location.href = 'complete.html';
  }, 1000);
}
