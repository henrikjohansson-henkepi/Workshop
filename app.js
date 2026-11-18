const lessonText = window.lessonText;
const controls = window.lessonControls;
const { gravity, simulate } = window.projectilePhysics;
const speedSlider = document.querySelector("#speed");
const angleSlider = document.querySelector("#angle");
const speedValue = document.querySelector("#speed-value");
const angleValue = document.querySelector("#angle-value");
const flightTimeValue = document.querySelector("#flight-time");
const rangeValue = document.querySelector("#range");
const maxHeightValue = document.querySelector("#max-height");
const canvas = document.querySelector("#trajectory");
const context = canvas.getContext("2d");
const gravityValue = document.querySelector("#gravity-value");
const playButton = document.querySelector("#play-button");
const playStatus = document.querySelector("#play-status");
const numberFormat = new Intl.NumberFormat("sv-SE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const axisFormat = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 });
const animation = {
  status: "idle",
  progress: 0,
  startTime: 0,
  elapsedBeforePause: 0,
  duration: 0,
  frameId: null
};

document.title = lessonText.pageTitle;
document.querySelectorAll("[data-text]").forEach((element) => {
  const key = element.dataset.text;
  if (!Object.hasOwn(lessonText, key)) {
    throw new Error(`Texten "${key}" saknas i content.js.`);
  }
  element.textContent = lessonText[key];
});
canvas.setAttribute("aria-label", lessonText.graphLabel);
gravityValue.textContent = `Tyngdacceleration: g = ${numberFormat.format(gravity)} m/s².`;

for (const [slider, settings] of [
  [speedSlider, controls.speed],
  [angleSlider, controls.angle]
]) {
  slider.min = settings.min;
  slider.max = settings.max;
  slider.step = settings.step;
  slider.value = settings.initial;
}

function tickStep(maximum) {
  const roughStep = maximum / 6;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / magnitude;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * magnitude;
}

function drawHamster(x, y, rotation) {
  context.save();
  context.translate(x, y - 11);
  context.rotate(rotation);

  context.fillStyle = "#bd8050";
  context.beginPath();
  context.ellipse(-2, 2, 15, 10, 0, 0, 2 * Math.PI);
  context.fill();

  context.fillStyle = "#f3dfc5";
  context.beginPath();
  context.arc(3, -7, 4, 0, 2 * Math.PI);
  context.arc(11, -6, 4, 0, 2 * Math.PI);
  context.fill();
  context.fillStyle = "#d8898d";
  context.beginPath();
  context.arc(3, -7, 2, 0, 2 * Math.PI);
  context.arc(11, -6, 2, 0, 2 * Math.PI);
  context.fill();

  context.fillStyle = "#d9ad7b";
  context.beginPath();
  context.ellipse(-2, 2, 11, 7, 0, 0, 2 * Math.PI);
  context.fill();

  context.fillStyle = "#f3dfc5";
  context.beginPath();
  context.ellipse(8, -1, 9, 8, 0, 0, 2 * Math.PI);
  context.fill();

  context.fillStyle = "#4a352c";
  context.beginPath();
  context.arc(11, -4, 1.2, 0, 2 * Math.PI);
  context.fill();

  context.fillStyle = "#d8898d";
  context.beginPath();
  context.arc(16, 0, 1.8, 0, 2 * Math.PI);
  context.fill();

  context.strokeStyle = "#79583f";
  context.lineWidth = 0.8;
  context.beginPath();
  context.moveTo(14, 1);
  context.lineTo(19, 0);
  context.moveTo(14, 2);
  context.lineTo(19, 3);
  context.stroke();

  context.restore();
}

function drawTrajectory(progress = animation.progress) {
  const visibleProgress = Number.isFinite(progress)
    ? Math.max(0, Math.min(progress, 1))
    : 0;
  const speed = Number(speedSlider.value);
  const angleDegrees = Number(angleSlider.value);
  const result = simulate(speed, angleDegrees);

  speedValue.textContent = `${speed} m/s`;
  angleValue.textContent = `${angleDegrees}°`;
  flightTimeValue.textContent = `${numberFormat.format(result.flightTime)} s`;
  rangeValue.textContent = `${numberFormat.format(result.range)} m`;
  maxHeightValue.textContent = `${numberFormat.format(result.maxHeight)} m`;

  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const padding = { left: 54, right: 20, top: 20, bottom: 40 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xMax = Math.max(result.range * 1.15, 5);
  const yMax = Math.max(result.maxHeight * 1.3, 5);
  const xPosition = (x) => padding.left + x / xMax * plotWidth;
  const yPosition = (y) => height - padding.bottom - y / yMax * plotHeight;

  context.strokeStyle = "#e5eaf2";
  context.lineWidth = 1;
  context.beginPath();
  const xStep = tickStep(xMax);
  for (let x = xStep; x < xMax; x += xStep) {
    context.moveTo(xPosition(x), padding.top);
    context.lineTo(xPosition(x), height - padding.bottom);
  }
  const yStep = tickStep(yMax);
  for (let y = yStep; y < yMax; y += yStep) {
    context.moveTo(padding.left, yPosition(y));
    context.lineTo(width - padding.right, yPosition(y));
  }
  context.stroke();

  context.strokeStyle = "#b8c4d6";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, height - padding.bottom);
  context.lineTo(width - padding.right, height - padding.bottom);
  context.stroke();

  context.fillStyle = "#64718a";
  context.font = "12px system-ui, sans-serif";
  context.textAlign = "center";
  for (let x = 0; x <= xMax; x += xStep) {
    const position = xPosition(x);
    context.beginPath();
    context.moveTo(position, height - padding.bottom);
    context.lineTo(position, height - padding.bottom + 5);
    context.stroke();
    context.fillText(axisFormat.format(x), position, height - padding.bottom + 19);
  }

  context.textAlign = "right";
  for (let y = yStep; y <= yMax; y += yStep) {
    const position = yPosition(y);
    context.beginPath();
    context.moveTo(padding.left - 5, position);
    context.lineTo(padding.left, position);
    context.stroke();
    context.fillText(axisFormat.format(y), padding.left - 9, position + 4);
  }

  context.strokeStyle = "#2463c5";
  context.lineWidth = 3;
  context.lineJoin = "round";
  context.beginPath();
  result.points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(xPosition(point.x), yPosition(point.y));
    } else {
      context.lineTo(xPosition(point.x), yPosition(point.y));
    }
  });
  context.stroke();

  const lastPointIndex = result.points.length - 1;
  const pointPosition = visibleProgress * lastPointIndex;
  const lowerIndex = Math.min(Math.floor(pointPosition), lastPointIndex);
  const upperIndex = Math.min(lowerIndex + 1, lastPointIndex);
  const fraction = pointPosition - lowerIndex;
  const currentPoint = {
    x: result.points[lowerIndex].x
      + (result.points[upperIndex].x - result.points[lowerIndex].x) * fraction,
    y: result.points[lowerIndex].y
      + (result.points[upperIndex].y - result.points[lowerIndex].y) * fraction
  };
  const before = result.points[Math.max(0, lowerIndex - 1)];
  const after = result.points[Math.min(lastPointIndex, upperIndex + 1)];
  const rotation = -Math.atan2(after.y - before.y, after.x - before.x);
  drawHamster(xPosition(currentPoint.x), yPosition(currentPoint.y), rotation);
}

function resetPlayback() {
  if (animation.frameId !== null) {
    cancelAnimationFrame(animation.frameId);
  }
  animation.status = "idle";
  animation.progress = 0;
  animation.elapsedBeforePause = 0;
  animation.frameId = null;
  playButton.textContent = lessonText.playButton;
  playStatus.textContent = lessonText.readyMessage;
  drawTrajectory();
}

function animate(now) {
  animation.progress = Math.min((now - animation.startTime) / animation.duration, 1);
  drawTrajectory();

  if (animation.progress < 1) {
    animation.frameId = requestAnimationFrame(animate);
    return;
  }

  animation.status = "finished";
  animation.frameId = null;
  playButton.textContent = lessonText.replayButton;
  playStatus.textContent = lessonText.finishedMessage;
}

function togglePlayback() {
  if (animation.status === "playing") {
    cancelAnimationFrame(animation.frameId);
    animation.elapsedBeforePause = performance.now() - animation.startTime;
    animation.status = "paused";
    animation.frameId = null;
    playButton.textContent = lessonText.resumeButton;
    playStatus.textContent = lessonText.pausedMessage;
    return;
  }

  if (animation.status === "paused") {
    animation.startTime = performance.now() - animation.elapsedBeforePause;
  } else {
    animation.progress = 0;
    animation.elapsedBeforePause = 0;
    const flightTime = simulate(Number(speedSlider.value), Number(angleSlider.value)).flightTime;
    animation.duration = Math.max(1000, Math.min(flightTime * 1000, 4500));
    animation.startTime = performance.now();
  }

  animation.status = "playing";
  playButton.textContent = lessonText.pauseButton;
  playStatus.textContent = lessonText.playingMessage;
  animation.frameId = requestAnimationFrame(animate);
}

speedSlider.addEventListener("input", resetPlayback);
angleSlider.addEventListener("input", resetPlayback);
playButton.addEventListener("click", togglePlayback);
window.addEventListener("resize", () => drawTrajectory());
drawTrajectory();
