const MAX_POKEMON = 1025;

const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const answerForm = document.getElementById("answerForm");
const answerInput = document.getElementById("answerInput");
const hintBtn = document.getElementById("hintBtn");
const hintText = document.getElementById("hintText");
const timeSelect = document.getElementById("timeSelect");
const scoreEl = document.getElementById("score");
const dexNumberEl = document.getElementById("dexNumber");
const bigNumberEl = document.getElementById("bigNumber");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const resultText = document.getElementById("resultText");
const pokemonImage = document.getElementById("pokemonImage");
const englishNameEl = document.getElementById("englishName");
const japaneseNameEl = document.getElementById("japaneseName");

let currentPokemon = null;
let timerId = null;
let timeLeft = 15;
let score = 0;
let hintUsed = false;
let answered = false;

function showScreen(screen) {
  [startScreen, quizScreen, resultScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

function formatDexNumber(number) {
  return `#${String(number).padStart(4, "0")}`;
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[♀]/g, "-f")
    .replace(/[♂]/g, "-m")
    .replace(/[^a-z0-9]/g, "");
}

function titleCase(name) {
  return name
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function randomPokemonNumber() {
  return Math.floor(Math.random() * MAX_POKEMON) + 1;
}

async function fetchPokemon(number) {
  const [pokemonResponse, speciesResponse] = await Promise.all([
    fetch(`https://pokeapi.co/api/v2/pokemon/${number}`),
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${number}`)
  ]);

  if (!pokemonResponse.ok || !speciesResponse.ok) {
    throw new Error("Could not load Pokémon data.");
  }

  const pokemon = await pokemonResponse.json();
  const species = await speciesResponse.json();

  const englishName = species.names.find(n => n.language.name === "en")?.name || titleCase(pokemon.name);
  const japaneseName =
    species.names.find(n => n.language.name === "ja-Hrkt")?.name ||
    species.names.find(n => n.language.name === "ja")?.name ||
    "Unknown";

  const genus = species.genera.find(g => g.language.name === "en")?.genus || "Unknown Pokémon";
  const types = pokemon.types.map(t => titleCase(t.type.name));
  const image = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default;

  return {
    number,
    englishName,
    japaneseName,
    genus,
    types,
    image
  };
}

async function startRound() {
  clearInterval(timerId);
  statusEl.textContent = "Loading Pokémon...";
  showScreen(quizScreen);
  answerInput.value = "";
  answerInput.disabled = true;
  hintBtn.disabled = true;
  hintText.textContent = "";
  hintUsed = false;
  answered = false;

  const number = randomPokemonNumber();
  dexNumberEl.textContent = formatDexNumber(number);
  bigNumberEl.textContent = formatDexNumber(number);

  try {
    currentPokemon = await fetchPokemon(number);
    statusEl.textContent = "";
    answerInput.disabled = false;
    hintBtn.disabled = false;
    answerInput.focus();
    startTimer();
  } catch (error) {
    statusEl.textContent = "Internet/API problem. Try Next Pokémon.";
    currentPokemon = null;
  }
}

function startTimer() {
  timeLeft = Number(timeSelect.value);
  timerEl.textContent = timeLeft;

  timerId = setInterval(() => {
    timeLeft -= 1;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      finishRound(false, true);
    }
  }, 1000);
}

function finishRound(isCorrect, timedOut = false) {
  if (answered) return;
  answered = true;
  clearInterval(timerId);

  if (isCorrect) {
    score += 1;
    scoreEl.textContent = score;
    resultText.textContent = "Correct! 🎉";
  } else if (timedOut) {
    resultText.textContent = "Time's up! ⏰";
  } else {
    resultText.textContent = "Wrong answer 😭";
  }

  pokemonImage.src = currentPokemon.image;
  pokemonImage.alt = currentPokemon.englishName;
  englishNameEl.textContent = currentPokemon.englishName;
  japaneseNameEl.textContent = currentPokemon.japaneseName;
  statusEl.textContent = "";
  showScreen(resultScreen);
}

answerForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!currentPokemon || answered) return;

  const userAnswer = normalizeName(answerInput.value);
  const correctAnswer = normalizeName(currentPokemon.englishName);

  finishRound(userAnswer === correctAnswer);
});

hintBtn.addEventListener("click", () => {
  if (!currentPokemon || hintUsed) return;
  hintUsed = true;
  hintBtn.disabled = true;

  const firstLetter = currentPokemon.englishName.charAt(0).toUpperCase();
  hintText.textContent = `Hint: ${currentPokemon.types.join(" / ")} type, starts with “${firstLetter}”.`;
});

startBtn.addEventListener("click", () => {
  score = 0;
  scoreEl.textContent = score;
  startRound();
});

nextBtn.addEventListener("click", startRound);
