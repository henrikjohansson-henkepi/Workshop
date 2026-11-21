const lessonText = window.lessonText;
const { buildExactSolution } = window.odeSolver;
const form = document.querySelector("#equation-form");
const inputA = document.querySelector("#coefficient-a");
const inputB = document.querySelector("#coefficient-b");
const inputForcing = document.querySelector("#forcing");
const inputY0 = document.querySelector("#initial-y");
const inputVelocity0 = document.querySelector("#initial-velocity");
const equationDisplay = document.querySelector("#equation-display");
const errorMessage = document.querySelector("#error-message");
const exactSolution = document.querySelector("#exact-solution");
const classificationValue = document.querySelector("#classification");
const canvas = document.querySelector("#solution-graph");
const context = canvas.getContext("2d");
const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 10,
  useGrouping: false
});
const axisFormat = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 });
const endX = 20;

document.title = lessonText.pageTitle;
document.querySelectorAll("[data-text]").forEach((element) => {
  const key = element.dataset.text;
  if (!Object.hasOwn(lessonText, key)) {
    throw new Error(`Texten "${key}" saknas i content.js.`);
  }
  element.textContent = lessonText[key];
});

function tickStep(maximum) {
  const roughStep = maximum / 5;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / magnitude;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * magnitude;
}

function drawGraph(points) {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const minimum = Math.min(...points.map((point) => point.y), 0);
  const maximum = Math.max(...points.map((point) => point.y), 0);
  const span = Math.max(maximum - minimum, 1);
  const padding = { left: 60, right: 20, top: 24, bottom: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const yMin = minimum - span * 0.1;
  const yMax = maximum + span * 0.1;
  const xPosition = (x) => padding.left + x / endX * plotWidth;
  const yPosition = (y) => height - padding.bottom - (y - yMin) / (yMax - yMin) * plotHeight;
  const yStep = tickStep(yMax - yMin);

  context.strokeStyle = "#e5eaf2";
  context.lineWidth = 1;
  context.beginPath();
  for (let x = 0; x <= endX; x += 2) {
    const position = xPosition(x);
    context.moveTo(position, padding.top);
    context.lineTo(position, height - padding.bottom);
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    const position = yPosition(y);
    context.moveTo(padding.left, position);
    context.lineTo(width - padding.right, position);
  }
  context.stroke();

  context.strokeStyle = "#8c9ab0";
  context.lineWidth = 1.2;
  context.beginPath();
  const zeroY = yPosition(0);
  context.moveTo(padding.left, zeroY);
  context.lineTo(width - padding.right, zeroY);
  context.stroke();

  context.fillStyle = "#64718a";
  context.font = "12px system-ui, sans-serif";
  context.textAlign = "center";
  for (let x = 0; x <= endX; x += 2) {
    context.fillText(axisFormat.format(x), xPosition(x), height - padding.bottom + 20);
  }
  context.textAlign = "right";
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    context.fillText(axisFormat.format(y), padding.left - 9, yPosition(y) + 4);
  }

  context.save();
  context.fillStyle = "#536078";
  context.font = "13px system-ui, sans-serif";
  context.textAlign = "center";
  context.translate(17, padding.top + plotHeight / 2);
  context.rotate(-Math.PI / 2);
  context.fillText(lessonText.yAxis, 0, 0);
  context.restore();

  context.strokeStyle = "#2463c5";
  context.lineWidth = 2.5;
  context.lineJoin = "round";
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(xPosition(point.x), yPosition(point.y));
    } else {
      context.lineTo(xPosition(point.x), yPosition(point.y));
    }
  });
  context.stroke();
}

function readNumber(input, label) {
  if (input.value.trim() === "") {
    throw new Error(`Ange ett värde för ${label}.`);
  }
  const value = Number(input.value);
  if (!Number.isFinite(value)) {
    throw new Error(`${label} måste vara ett ändligt tal.`);
  }
  return value;
}

function formatTerm(coefficient, variable) {
  const magnitude = Math.abs(coefficient);
  if (magnitude === 0) {
    return "";
  }
  const sign = coefficient < 0 ? " − " : " + ";
  const value = magnitude === 1 ? "" : numberFormat.format(magnitude);
  return `${sign}${value}${variable}`;
}

function calculate() {
  errorMessage.hidden = true;
  try {
    const a = readNumber(inputA, "a");
    const b = readNumber(inputB, "b");
    const y0 = readNumber(inputY0, "y(0)");
    const velocity0 = readNumber(inputVelocity0, "y′(0)");
    const expression = inputForcing.value;
    const solution = buildExactSolution({ a, b, expression, y0, velocity0 });

    equationDisplay.textContent =
      `y″${formatTerm(a, "y′")}${formatTerm(b, "y")} = ${expression}; `
      + `y(0) = ${numberFormat.format(y0)}, y′(0) = ${numberFormat.format(velocity0)}`;
    exactSolution.textContent = `y(x) = ${solution.formula}`;
    classificationValue.textContent = solution.classification;
    canvas.setAttribute("aria-label", `${lessonText.graphLabel}, från x = 0 till x = ${endX}`);
    drawGraph(solution.points);
  } catch (error) {
    errorMessage.textContent = error.message || lessonText.solveError;
    errorMessage.hidden = false;
    equationDisplay.textContent = "";
    exactSolution.textContent = "";
    classificationValue.textContent = "";
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});
window.addEventListener("resize", calculate);
calculate();
