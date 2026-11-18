(() => {
  const gravity = 9.82;
  const sampleCount = 100;

  function simulate(speed, angleDegrees) {
    const angle = angleDegrees * Math.PI / 180;
    const flightTime = 2 * speed * Math.sin(angle) / gravity;
    const range = speed * speed * Math.sin(2 * angle) / gravity;
    const maxHeight = speed * speed * Math.sin(angle) ** 2 / (2 * gravity);
    const points = [];

    for (let index = 0; index <= sampleCount; index += 1) {
      const time = flightTime * index / sampleCount;
      const x = speed * Math.cos(angle) * time;
      const y = Math.max(0, speed * Math.sin(angle) * time - gravity * time * time / 2);
      points.push({ x, y });
    }

    return { flightTime, range, maxHeight, points };
  }

  window.projectilePhysics = { gravity, simulate };
})();
