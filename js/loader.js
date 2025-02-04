// loader.js <> script per il loader
//******************************************************************************

import jsonparse from './module/jsonparse.js'
document.getElementById('quizPathButton').addEventListener('click', loadQuiz);
function loadQuiz(event) {
  event.preventDefault(); // Evita il ricaricamento della pagina

  const path = document.getElementById('quiz-path').value.trim();
  const token = document.getElementById('quiz-token').value.trim();
  const httpsRegex = /(https:\/\/[^\s]+)/g;
  const localPathRegex = /^\.\/[\w\-\/]+\.[\w]+$/; // Accetta percorsi locali validi con estensioni

  // Verifica la validità del percorso
  const isHttpsPath = httpsRegex.test(path);
  const isLocalPath = localPathRegex.test(path);

  if (isHttpsPath || isLocalPath) {
    // Salva il percorso nel localStorage
    localStorage.setItem('jsonPath', path);
    // Salva il token nel localStorage
    localStorage.setItem('token', token);
    // Reindirizza alla pagina principale

    //caricamento del file json
    jsonparse(path, token)
      .then((jsonData) => {
        window.location.href = 'examsphere.html';
      })
      .catch((e) => {
        alert('Il token per il quiz non è valido! , verifica e riprova.');
      });


  } else {
    alert('Inserisci un percorso valido (HTTPS o locale).');
  }
}
