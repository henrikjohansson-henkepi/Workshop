window.lessonText = {
  pageTitle: "Henkes kastparabel",
  heading: "Henkes kastparabel",
  intro: "Undersök hur utkastfarten och vinkeln påverkar hamsterns bana.",
  model: "I modellen startar och landar kastföremålet på samma höjd. Luftmotstånd försummas.",
  animalNote: "Hamstern är en tecknad symbol – kasta aldrig ett levande djur.",
  speedLabel: "Begynnelsehastighet v₀",
  angleLabel: "Utkastvinkel θ",
  xAxis: "Horisontellt avstånd x (m)",
  yAxis: "Höjd y (m)",
  graphLabel: "Graf över hamsterns kastbana med hastighetsvektorer",
  flightTimeLabel: "Flygtid T",
  rangeLabel: "Räckvidd R",
  maxHeightLabel: "Maximal höjd",
  positionX: "x(t) = v₀ cos(θ) · t",
  positionY: "y(t) = v₀ sin(θ) · t − ½gt²",
  flightAndRange: "T = 2v₀ sin(θ) / g och R = v₀² sin(2θ) / g",
  velocityVectorLabel: "v (blå)",
  horizontalComponentLabel: "vₓ (röd)",
  verticalComponentLabel: "vᵧ (grön)",
  playButton: "Spela kastet",
  pauseButton: "Pausa",
  resumeButton: "Fortsätt",
  replayButton: "Spela igen",
  readyMessage: "Välj Spela kastet för att följa hamsterns bana.",
  playingMessage: "Kastet spelas upp.",
  pausedMessage: "Uppspelningen är pausad.",
  finishedMessage: "Kastet är färdigt."
};

window.lessonControls = {
  speed: { min: 1, max: 40, step: 1, initial: 20 },
  angle: { min: 0, max: 90, step: 1, initial: 45 }
};
