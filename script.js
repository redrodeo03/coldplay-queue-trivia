const position = document.getElementById('position');
const progressBar = document.querySelector('.progress');
const hackContent = document.getElementById('hack-content');
const hackTitle = document.getElementById('hack-title');
const question = document.getElementById('question');
const options = document.getElementById('options');
const hackCards = document.querySelectorAll('.hack-card');
const loadingIndicator = document.getElementById('loading-indicator');
const victoryScreen = document.getElementById('victory-screen');
const restartButton = document.getElementById('restart-button');

let currentPosition = 2500;
let totalQueue = 2500;
let currentData = null;
let usedHacks = new Set();
let cachedQuestions = {};
let gameWon = false;

const hackApis = {
    yellow: 'https://universe.lemme.cloud/api/coldplay',
    vivalavida: 'https://universe.lemme.cloud/api/vivalavida',
    paradise: 'https://universe.lemme.cloud/api/paradise',
    fixYou: 'https://universe.lemme.cloud/api/fixyou',
    clocks: 'https://universe.lemme.cloud/api/clocks'
};

function updatePosition() {
    position.textContent = currentPosition;
    const progress = ((totalQueue - currentPosition) / totalQueue) * 100;
    progressBar.style.width = `${progress}%`;
    
    if (currentPosition === 1 && !gameWon) {
        celebrateSuccess();
    }
}

function moveInQueue(spots) {
    if (!gameWon) {
        currentPosition = Math.max(1, currentPosition - spots);
        updatePosition();
    }
}

function celebrateSuccess() {
    gameWon = true;
    victoryScreen.style.display = 'flex';
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        disableForReducedMotion: true
    });
}

function showLoadingIndicator() {
    loadingIndicator.style.display = 'flex';
}

function hideLoadingIndicator() {
    loadingIndicator.style.display = 'none';
}

async function fetchQuestion(hackId) {
    if (cachedQuestions[hackId]) {
        return cachedQuestions[hackId];
    }

    showLoadingIndicator();

    const requestBody = {
        params: {
            id: hackId
        }
    };

    try {
        const response = await fetch(hackApis[hackId], {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        cachedQuestions[hackId] = data;
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    } finally {
        hideLoadingIndicator();
    }
}

function displayQuestion(data) {
    hackContent.style.display = 'block';
    hackTitle.textContent = data.hackName || 'Complete the Lyrics';
    question.textContent = data.question;
    options.innerHTML = '';
    for (let i = 1; i <= 4; i++) {
        const button = document.createElement('button');
        button.classList.add('option');
        button.textContent = data[i.toString()];
        button.addEventListener('click', () => checkAnswer(i.toString()));
        options.appendChild(button);
    }
}

function checkAnswer(selected) {
    const buttons = options.querySelectorAll('.option');
    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent === currentData[currentData.correct]) {
            button.classList.add('correct');
        }
    });

    if (selected === currentData.correct) {
        moveInQueue(2500);
        setTimeout(() => {
            if (!gameWon) {
                alert('Correct! You moved 2500 spots in the queue!');
                hackContent.style.display = 'none';
            }
        }, 1500);
    } else {
        const selectedButton = options.children[parseInt(selected) - 1];
        selectedButton.classList.add('incorrect');
        setTimeout(() => {
            if (!gameWon) {
                alert('Sorry, that\'s incorrect. Try again!');
                hackContent.style.display = 'none';
            }
        }, 1500);
    }
}

async function loadNewQuestion(hackId) {
    if (usedHacks.has(hackId)) {
        alert("You've already used this hack!");
        return;
    }

    currentData = await fetchQuestion(hackId);
    if (currentData) {
        displayQuestion(currentData);
        usedHacks.add(hackId);
        document.querySelector(`[data-hack="${hackId}"]`).classList.add('used');
    } else {
        question.textContent = 'Failed to load question. Please try again later.';
        options.innerHTML = '';
    }
}

function restartGame() {
    currentPosition = 2500;
    usedHacks.clear();
    cachedQuestions = {};
    gameWon = false;
    hackCards.forEach(card => card.classList.remove('used'));
    victoryScreen.style.display = 'none';
    hackContent.style.display = 'none';
    updatePosition();
}

// Event listeners for hack cards
hackCards.forEach(card => {
    card.addEventListener('click', () => {
        if (!gameWon) {
            const hackId = card.getAttribute('data-hack');
            loadNewQuestion(hackId);
        }
    });
});

// Event listener for restart button
restartButton.addEventListener('click', restartGame);

// Simulate queue movement
setInterval(() => {
    moveInQueue(Math.floor(Math.random() * 10) + 1);
}, 5000);

// Initial load
updatePosition();