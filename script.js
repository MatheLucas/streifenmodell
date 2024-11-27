document.getElementById("generate").addEventListener("click", generateStrips);
document.getElementById("check-solution").addEventListener("click", checkSolution);
document.getElementById("apply-operation").addEventListener("click", applyOperation);

let calculatedX = 1; // Berechneter Wert für x
let stripCounter = 0; // Eindeutige ID für jeden Streifen

// Funktion: Zerlegt die Gleichung in linke und rechte Seite
function parseEquation(equation) {
  const match = equation.match(/(.*?)=(.*)/);
  if (!match) throw new Error("Ungültige Gleichung. Bitte im Format 'ax + b = c' eingeben.");
  const left = match[1].trim();
  const right = parseFloat(match[2].trim());
  return { left, right };
}

// Funktion: Zerlegt die linke Seite der Gleichung in Terme
function parseTerms(expression) {
  const terms = [];
  const regex = /(\d*)\((.*?)\)|(\d*)x|x|(\d+)/g; // Unterstützt Klammern, Variablen und Konstanten
  let match;

  while ((match = regex.exec(expression)) !== null) {
    if (match[1] && match[2]) {
      // Klammerausdruck, z. B. 3(x+2)
      const coefficient = parseInt(match[1]) || 1;
      const innerTerms = parseTerms(match[2]);
      innerTerms.forEach((inner) => {
        if (inner.type === "variable") {
          terms.push({ type: "variable", coefficient: inner.coefficient * coefficient });
        } else if (inner.type === "constant") {
          terms.push({ type: "constant", value: inner.value * coefficient });
        }
      });
    } else if (match[3] || match[0] === "x") {
      // Variablenausdruck, z. B. 2x oder x
      terms.push({ type: "variable", coefficient: parseInt(match[3]) || 1 });
    } else if (match[4]) {
      // Konstante, z. B. 6
      terms.push({ type: "constant", value: parseInt(match[4]) });
    }
  }

  return terms;
}

// Funktion: Erstellt die Visualisierung der Streifen
function generateStrips() {
  const equationInput = document.getElementById("equation").value;
  const { left, right } = parseEquation(equationInput);
  const terms = parseTerms(left);

  // Berechnung von x
  calculatedX = calculateX(terms, right);

  // Visualisierung
  const upperArea = document.getElementById("upper-strip-area");
  const lowerArea = document.getElementById("lower-strip-area");
  upperArea.innerHTML = "";
  lowerArea.innerHTML = "";

  terms.forEach((term) => {
    if (term.type === "variable") {
      for (let i = 0; i < term.coefficient; i++) {
        const strip = createStrip("x", calculatedX, "strip x");
        upperArea.appendChild(strip);
      }
    } else if (term.type === "constant") {
      const strip = createStrip(term.value, term.value, "strip constant");
      upperArea.appendChild(strip);
    }
  });

  const resultStrip = createStrip(right, right, "strip result");
  lowerArea.appendChild(resultStrip);

  makeDraggable();
}

// Funktion: Berechnet den Wert von x
function calculateX(terms, result) {
  let constantSum = 0;
  let variableCoefficient = 0;

  terms.forEach((term) => {
    if (term.type === "constant") {
      constantSum += term.value;
    } else if (term.type === "variable") {
      variableCoefficient += term.coefficient;
    }
  });

  if (variableCoefficient === 0) {
    throw new Error("Kein x in der Gleichung gefunden.");
  }

  return (result - constantSum) / variableCoefficient;
}

// Funktion: Erstellt einen Streifen
function createStrip(label, value, className) {
  const strip = document.createElement("div");
  strip.className = className;
  strip.textContent = label;
  strip.style.width = `${value * 20}px`; // Dynamische Breite
  strip.draggable = true;
  strip.id = `strip-${stripCounter++}`; // Eindeutige ID
  return strip;
}

function makeDraggable() {
  const areas = [document.getElementById("upper-strip-area"), document.getElementById("lower-strip-area")];

  areas.forEach((area) => {
    area.addEventListener("dragover", (e) => e.preventDefault()); // Ermöglicht das Ablegen
    area.addEventListener("drop", handleDrop); // Führt das Ablegen aus
  });

  const strips = document.querySelectorAll(".strip");
  strips.forEach((strip) => {
    strip.addEventListener("dragstart", handleDragStart); // Beginnt das Ziehen
  });
}

function handleDragStart(e) {
  e.dataTransfer.setData("text/plain", e.target.id); // Speichert die ID des Streifens
  e.target.style.opacity = "0.5"; // Visuelle Rückmeldung beim Ziehen
}

function handleDrop(e) {
  e.preventDefault();
  const id = e.dataTransfer.getData("text/plain"); // Holt die ID des Streifens
  const draggedElement = document.getElementById(id);

  if (draggedElement) {
    draggedElement.style.opacity = "1"; // Wiederherstellen der Sichtbarkeit

    // Stelle sicher, dass der Streifen korrekt hinzugefügt wird
    if (e.target.classList.contains("strip") || e.target.id === "upper-strip-area" || e.target.id === "lower-strip-area") {
      e.currentTarget.appendChild(draggedElement); // Verschiebe den Streifen ins Ziel
    }
  }
}

// Lösung prüfen
function checkSolution() {
  const solutionInput = parseFloat(document.getElementById("solution").value);
  const equationInput = document.getElementById("equation").value;

  const { left, right } = parseEquation(equationInput);
  const terms = parseTerms(left);

  let leftValue = 0;
  terms.forEach((term) => {
    if (term.type === "variable") {
      leftValue += term.coefficient * solutionInput;
    } else if (term.type === "constant") {
      leftValue += term.value;
    }
  });

  const resultDiv = document.getElementById("result");
  if (Math.abs(leftValue - right) < 0.01) {
    resultDiv.textContent = "Richtig! Die Lösung ist korrekt.";
    resultDiv.style.color = "green";
  } else {
    resultDiv.textContent = "Falsch! Die Lösung ist nicht korrekt.";
    resultDiv.style.color = "red";
  }

  document.getElementById("solution").value = "";
}

// Operation anwenden
function applyOperation() {
  const operation = parseInt(document.getElementById("operation").value);
  if (isNaN(operation)) {
    alert("Bitte eine gültige Zahl eingeben.");
    return;
  }

  const upperArea = document.getElementById("upper-strip-area");
  const lowerArea = document.getElementById("lower-strip-area");

  [...upperArea.children].forEach((strip) => {
    if (strip.textContent == operation) {
      upperArea.removeChild(strip);
    }
  });

  const resultStrip = lowerArea.querySelector(".strip.result");
  const newResult = parseInt(resultStrip.textContent) - operation;
  resultStrip.textContent = newResult;
  resultStrip.style.width = `${newResult * 20}px`;

  document.getElementById("operation").value = "";
}
