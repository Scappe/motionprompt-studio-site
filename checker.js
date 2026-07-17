const input = document.querySelector("#prompt-input");
const analyzeButton = document.querySelector("#analyze-button");
const exampleButton = document.querySelector("#example-button");
const clearButton = document.querySelector("#clear-button");
const scoreElement = document.querySelector("#score");
const scoreCaption = document.querySelector("#score-caption");
const recommendationList = document.querySelector("#recommendation-list");

const rules = [
  {
    id: "camera",
    weight: 17,
    pattern: /\b(camera|shot|close[- ]?up|wide shot|medium shot|lens|pan|tilt|dolly|tripod|locked[- ]?off|orbit|tracking)\b/i,
    recommendation: "Specify shot size and whether the camera is locked or moving."
  },
  {
    id: "motion",
    weight: 17,
    pattern: /\b(move|moves|moving|walk|walks|turn|turns|rotate|rotates|gesture|gestures|raises|lowers|slides|leans|nods|motion)\b/i,
    recommendation: "Define one observable subject or object action instead of asking for natural movement."
  },
  {
    id: "timing",
    weight: 16,
    pattern: /\b(duration|over\s+\d+(?:\.\d+)?|for\s+\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*(?:s|sec|secs|second|seconds))\b/i,
    recommendation: "Give the main action a duration or a start-to-end interval."
  },
  {
    id: "framing",
    weight: 16,
    pattern: /\b(9:16|16:9|1:1|4:3|portrait|landscape|vertical|horizontal|frame|framing|centered|headroom)\b/i,
    recommendation: "State aspect ratio or framing so composition is not inferred."
  },
  {
    id: "continuity",
    weight: 17,
    pattern: /\b(preserve|consistent|consistency|unchanged|maintain|maintains|locked identity|same (?:face|person|product|object)|object count|logo|geometry)\b/i,
    recommendation: "Add a continuity rule for identity, product geometry, logo and object count."
  },
  {
    id: "negative",
    weight: 17,
    pattern: /\b(no |avoid|without|do not|don't|negative|prevent|exclude)\b/i,
    recommendation: "Add specific negative direction tied to likely visible failures."
  }
];

const vagueTerms = /\b(cinematic|dynamic|beautiful|epic|natural|realistic|professional|amazing|stunning)\b/gi;
const conflictingCamera = /\b(locked|tripod|static)\b/i;
const movingCamera = /\b(camera (?:orbits|pans|tilts|dollies|tracks|moves|moving)|handheld camera|orbiting camera|tracking shot)\b/i;

function updateSignal(id, present) {
  const element = document.querySelector(`[data-signal="${id}"]`);
  if (!element) return;
  element.classList.toggle("is-present", present);
  element.querySelector("b").textContent = present ? "Present" : "Missing";
}

function setRecommendations(items) {
  recommendationList.replaceChildren();
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    recommendationList.append(li);
  }
}

function analyzePrompt() {
  const prompt = input.value.trim();

  if (!prompt) {
    scoreElement.textContent = "0";
    scoreCaption.textContent = "Add a prompt to begin.";
    for (const rule of rules) updateSignal(rule.id, false);
    setRecommendations(["Paste a prompt and select “Check prompt”."]);
    return;
  }

  let score = 0;
  const notes = [];

  for (const rule of rules) {
    const present = rule.pattern.test(prompt);
    updateSignal(rule.id, present);
    if (present) score += rule.weight;
    else notes.push(rule.recommendation);
  }

  const vagueMatches = prompt.match(vagueTerms) || [];
  const uniqueVagueTerms = [...new Set(vagueMatches.map((term) => term.toLowerCase()))];
  if (uniqueVagueTerms.length >= 3) {
    score -= 8;
    notes.push(`Replace vague adjectives (${uniqueVagueTerms.slice(0, 4).join(", ")}) with observable direction.`);
  }

  if (conflictingCamera.test(prompt) && movingCamera.test(prompt)) {
    score -= 15;
    notes.push("The prompt may combine a locked camera with camera movement. Choose one camera behavior.");
  }

  if (prompt.length < 90) {
    score -= 5;
    notes.push("The brief is very short; check whether the subject, setting and end state are explicit.");
  }

  score = Math.max(0, Math.min(100, score));
  scoreElement.textContent = String(score);

  if (score >= 85) scoreCaption.textContent = "Strong preflight. Ready for a controlled test.";
  else if (score >= 65) scoreCaption.textContent = "Usable, with a few preventable gaps.";
  else if (score >= 40) scoreCaption.textContent = "Several directions are still left to the model.";
  else scoreCaption.textContent = "High ambiguity. Structure the brief before testing.";

  if (notes.length === 0) notes.push("All six preflight signals are present. Check that each instruction is concrete and non-conflicting.");
  setRecommendations(notes);
}

analyzeButton.addEventListener("click", analyzePrompt);

exampleButton.addEventListener("click", () => {
  input.value = "9:16 close-up product shot. A creator holds the same skincare bottle label-forward and rotates her wrist once over 2 seconds. Locked tripod camera, 85 mm lens, centered framing. Preserve face identity, finger count, bottle geometry, cap shape and logo orientation. No camera orbit, focus breathing, hand deformation, text drift or background warping.";
  analyzePrompt();
  input.focus();
});

clearButton.addEventListener("click", () => {
  input.value = "";
  analyzePrompt();
  input.focus();
});

for (const link of document.querySelectorAll(".tracked-link")) {
  link.addEventListener("click", () => {
    try {
      sessionStorage.setItem("motionprompt_last_cta", link.dataset.placement || "unknown");
    } catch (_) {
      // The purchase link must keep working even when storage is unavailable.
    }
  });
}
