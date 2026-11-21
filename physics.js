(() => {
  const end = 20;
  const baseSamples = 1200;
  const maximumSamples = 100000;
  const numericPattern = "(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?";
  const signedNumericPattern = `[+-]?${numericPattern}`;
  const formulaFormat = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 10,
    useGrouping: false
  });

  const complex = (re = 0, im = 0) => ({ re, im });
  const add = (left, right) => complex(left.re + right.re, left.im + right.im);
  const subtract = (left, right) => complex(left.re - right.re, left.im - right.im);
  const multiply = (left, right) => complex(
    left.re * right.re - left.im * right.im,
    left.re * right.im + left.im * right.re
  );
  const scale = (value, factor) => complex(value.re * factor, value.im * factor);
  const magnitude = (value) => Math.hypot(value.re, value.im);

  function splitTerms(expression) {
    const source = expression.replace(/\s+/g, "");
    const terms = [];
    let start = 0;
    let depth = 0;
    for (let index = 0; index < source.length; index += 1) {
      if (source[index] === "(") {
        depth += 1;
      } else if (source[index] === ")") {
        depth -= 1;
        if (depth < 0) {
          throw new Error("Uttrycket f(x) har en felaktig parentes.");
        }
      } else if (
        depth === 0
        && (source[index] === "+" || source[index] === "-")
        && index > start
        && !/[eE]/.test(source[index - 1])
      ) {
        terms.push(source.slice(start, index));
        start = index;
      }
    }
    if (depth !== 0) {
      throw new Error("Uttrycket f(x) har en felaktig parentes.");
    }
    terms.push(source.slice(start));
    return terms;
  }

  function parseLinearArgument(source) {
    if (source === "-x") {
      return -1;
    }
    if (source === "+x" || source === "x") {
      return 1;
    }
    const numberFirst = source.match(new RegExp(`^(${signedNumericPattern})\\*x$`));
    if (numberFirst) {
      return Number(numberFirst[1]);
    }
    const xFirst = source.match(new RegExp(`^x(?:\\*(${signedNumericPattern}))?$`));
    if (xFirst) {
      return Number(xFirst[1] || 1);
    }
    throw new Error(`Kan inte tolka uttrycket "${source}". Använd en linjär funktion av x.`);
  }

  function addForcingTerm(terms, lambda, polynomial) {
    while (polynomial.length > 1 && magnitude(polynomial[polynomial.length - 1]) < 1e-14) {
      polynomial.pop();
    }
    if (polynomial.some((value) => magnitude(value) > 0)) {
      terms.push({ lambda: complex(lambda), polynomial });
    }
  }

  function parseForcing(expression) {
    const terms = [];
    for (const rawTerm of splitTerms(expression)) {
      if (!rawTerm) {
        throw new Error("Uttrycket f(x) är ofullständigt.");
      }
      const sign = rawTerm[0] === "-" ? -1 : 1;
      const source = /^[+-]/.test(rawTerm) ? rawTerm.slice(1) : rawTerm;
      const constant = source.match(new RegExp(`^${numericPattern}$`, "i"));
      if (constant) {
        addForcingTerm(terms, 0, [complex(sign * Number(source))]);
        continue;
      }

      const harmonic = source.match(new RegExp(`^(?:(${numericPattern})\\*)?(sin|cos)\\((.*)\\)$`, "i"));
      if (harmonic) {
        let amplitude = sign * Number(harmonic[1] || 1);
        if (amplitude === 0) {
          continue;
        }
        let frequency = parseLinearArgument(harmonic[3]);
        if (frequency < 0) {
          if (harmonic[2].toLowerCase() === "sin") {
            amplitude *= -1;
          }
          frequency = Math.abs(frequency);
        }
        if (frequency === 0) {
          if (harmonic[2].toLowerCase() === "cos") {
            addForcingTerm(terms, 0, [complex(amplitude)]);
          }
          continue;
        }
        const positive = harmonic[2].toLowerCase() === "sin"
          ? complex(0, -amplitude / 2)
          : complex(amplitude / 2);
        addForcingTerm(terms, 0, [positive]);
        terms[terms.length - 1].lambda = complex(0, frequency);
        addForcingTerm(terms, 0, [{ re: positive.re, im: -positive.im }]);
        terms[terms.length - 1].lambda = complex(0, -frequency);
        continue;
      }

      const exponential = source.match(new RegExp(
        `^(?:(${numericPattern})\\*)?(?:exp\\((.*)\\)|e\\^\\((.*)\\))$`,
        "i"
      ));
      if (exponential) {
        const amplitude = sign * Number(exponential[1] || 1);
        const exponent = parseLinearArgument(exponential[2] || exponential[3]);
        addForcingTerm(terms, exponent, [complex(amplitude)]);
        continue;
      }

      const monomial = source.match(new RegExp(
        `^(?:(${numericPattern})\\*)?x(?:\\^(\\d+))?$`,
        "i"
      ));
      if (monomial) {
        const coefficient = sign * Number(monomial[1] || 1);
        const power = Number(monomial[2] || 1);
        if (power > 12) {
          throw new Error("Polynom av grad högre än 12 stöds inte.");
        }
        const polynomial = Array.from({ length: power + 1 }, () => complex());
        polynomial[power] = complex(coefficient);
        addForcingTerm(terms, 0, polynomial);
        continue;
      }

      if (/^(?:sin|cos|exp|e\^)/i.test(source)) {
        throw new Error(`Kan inte skriva en sluten lösning för "${rawTerm}". Använd sin(k*x), cos(k*x), exp(k*x), tal eller polynom.`);
      }
      throw new Error(`Kan inte skriva en sluten lösning för f(x) = ${expression}. Använd tal, polynom, exp(k*x), sin(k*x) eller cos(k*x).`);
    }
    return terms;
  }

  function solveLinearSystem(matrix) {
    const size = matrix.length;
    for (let column = 0; column < size; column += 1) {
      let pivot = column;
      for (let row = column + 1; row < size; row += 1) {
        if (magnitude(matrix[row][column]) > magnitude(matrix[pivot][column])) {
          pivot = row;
        }
      }
      if (magnitude(matrix[pivot][column]) < 1e-14) {
        throw new Error("Den slutna lösningen kunde inte beräknas för dessa värden.");
      }
      [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
      const divisor = matrix[column][column];
      for (let entry = column; entry <= size; entry += 1) {
        matrix[column][entry] = divide(matrix[column][entry], divisor);
      }
      for (let row = 0; row < size; row += 1) {
        if (row === column) {
          continue;
        }
        const factor = matrix[row][column];
        for (let entry = column; entry <= size; entry += 1) {
          matrix[row][entry] = subtract(
            matrix[row][entry],
            multiply(factor, matrix[column][entry])
          );
        }
      }
    }
    return matrix.map((row) => row[size]);
  }

  function divide(left, right) {
    const denominator = right.re * right.re + right.im * right.im;
    return complex(
      (left.re * right.re + left.im * right.im) / denominator,
      (left.im * right.re - left.re * right.im) / denominator
    );
  }

  function particularTerm(term, a, b) {
    const degree = term.polynomial.length - 1;
    const lambda = term.lambda;
    const lambdaSquared = multiply(lambda, lambda);
    const operatorValue = add(add(lambdaSquared, scale(lambda, a)), complex(b));
    const operatorDerivative = add(scale(lambda, 2), complex(a));
    const tolerance = 1e-10 * Math.max(1, Math.abs(a), Math.abs(b));
    let resonanceOrder = 0;
    if (magnitude(operatorValue) < tolerance) {
      resonanceOrder = magnitude(operatorDerivative) < tolerance ? 2 : 1;
    }

    const size = degree + 1;
    const matrix = Array.from({ length: size }, () =>
      Array.from({ length: size + 1 }, () => complex()));
    for (let outputPower = 0; outputPower <= degree; outputPower += 1) {
      const row = outputPower;
      for (let unknown = 0; unknown < size; unknown += 1) {
        const uPower = unknown + resonanceOrder;
        if (uPower === outputPower) {
          matrix[row][unknown] = add(matrix[row][unknown], operatorValue);
        }
        if (uPower === outputPower + 1) {
          matrix[row][unknown] = add(
            matrix[row][unknown],
            scale(operatorDerivative, outputPower + 1)
          );
        }
        if (uPower === outputPower + 2) {
          matrix[row][unknown] = add(
            matrix[row][unknown],
            complex((outputPower + 2) * (outputPower + 1))
          );
        }
      }
      matrix[row][size] = term.polynomial[outputPower] || complex();
    }

    const solution = solveLinearSystem(matrix);
    return {
      lambda,
      polynomial: Array.from({ length: resonanceOrder }, () => complex()).concat(solution)
    };
  }

  function evaluatePolynomial(coefficients, x) {
    let value = complex();
    for (let index = coefficients.length - 1; index >= 0; index -= 1) {
      value = add(multiply(value, complex(x)), coefficients[index]);
    }
    return value;
  }

  function particularValues(terms) {
    let y0 = 0;
    let velocity0 = 0;
    for (const term of terms) {
      const value = term.polynomial[0] || complex();
      const derivative = add(
        term.polynomial[1] || complex(),
        multiply(term.lambda, value)
      );
      y0 += value.re;
      velocity0 += derivative.re;
    }
    return { y0, velocity0 };
  }

  function formatNumber(value) {
    if (Math.abs(value) < 1e-11) {
      return "0";
    }
    const sign = value < 0 ? -1 : 1;
    const absolute = Math.abs(value);
    for (let denominator = 1; denominator <= 10000; denominator += 1) {
      const numerator = Math.round(absolute * denominator);
      if (
        numerator === 0
        || Math.abs(absolute - numerator / denominator) > 1e-10 * Math.max(1, absolute)
      ) {
        continue;
      }
      let divisor = numerator;
      let remainder = denominator;
      while (remainder !== 0) {
        [divisor, remainder] = [remainder, divisor % remainder];
      }
      const reducedNumerator = numerator / divisor;
      const reducedDenominator = denominator / divisor;
      const prefix = sign < 0 ? "-" : "";
      return reducedDenominator === 1
        ? `${prefix}${reducedNumerator}`
        : `${prefix}${reducedNumerator}/${reducedDenominator}`;
    }
    return formulaFormat.format(value);
  }

  function polynomialTerms(coefficients, factor = "") {
    const terms = [];
    for (let power = coefficients.length - 1; power >= 0; power -= 1) {
      const coefficient = coefficients[power];
      if (Math.abs(coefficient) < 1e-10) {
        continue;
      }
      const magnitudeValue = Math.abs(coefficient);
      const variable = power === 0 ? "" : power === 1 ? "x" : `x^${power}`;
      const scalar = magnitudeValue === 1 && variable ? "" : formatNumber(magnitudeValue);
      const product = variable && scalar.includes("/")
        ? `(${scalar})*${variable}`
        : `${scalar}${variable}`;
      const body = `${product}${factor ? `*${factor}` : ""}`;
      terms.push({ negative: coefficient < 0, body });
    }
    return terms;
  }

  function formatSum(terms) {
    if (terms.length === 0) {
      return "0";
    }
    return terms.map((term, index) => {
      const sign = term.negative ? " − " : " + ";
      return index === 0
        ? `${term.negative ? "−" : ""}${term.body}`
        : `${sign}${term.body}`;
    }).join("");
  }

  function exponentialFactor(rate) {
    if (Math.abs(rate) < 1e-10) {
      return "";
    }
    const exponent = rate === 1 ? "x" : rate === -1 ? "-x" : `${formatNumber(rate)}*x`;
    return `e^(${exponent})`;
  }

  function amplitudeProduct(amplitude, factor) {
    const formatted = formatNumber(Math.abs(amplitude));
    if (formatted === "1" && factor) {
      return factor;
    }
    return factor ? `${formatted}*${factor}` : formatted;
  }

  function frequencyArgument(frequency) {
    if (Math.abs(frequency - 1) < 1e-10) {
      return "x";
    }
    if (Math.abs(frequency + 1) < 1e-10) {
      return "-x";
    }
    return `${formatNumber(frequency)}*x`;
  }

  function formatRealParticular(term) {
    const factor = exponentialFactor(term.lambda.re);
    const polynomial = polynomialTerms(term.polynomial.map((value) => value.re));
    return polynomial.map(({ negative, body }) => ({
      negative,
      body: `${body}${factor ? `*${factor}` : ""}`
    }));
  }

  function formatComplexParticular(term) {
    const omega = Math.abs(term.lambda.im);
    const alpha = term.lambda.re;
    const argument = frequencyArgument(omega);
    const cosine = polynomialTerms(term.polynomial.map((value) => 2 * value.re), `cos(${argument})`);
    const sine = polynomialTerms(term.polynomial.map((value) => -2 * value.im), `sin(${argument})`);
    const combined = cosine.concat(sine);
    const factor = exponentialFactor(alpha);
    return combined.map((part) => ({
      ...part,
      body: `${part.body}${factor ? `*${factor}` : ""}`
    }));
  }

  function matchConjugate(term, candidates, used) {
    return candidates.findIndex((candidate, index) =>
      !used.has(index)
      && Math.abs(candidate.lambda.re - term.lambda.re) < 1e-8
      && Math.abs(candidate.lambda.im + term.lambda.im) < 1e-8
    );
  }

  function formatParticularSolution(terms) {
    const used = new Set();
    const formatted = [];
    terms.forEach((term, index) => {
      if (used.has(index)) {
        return;
      }
      if (Math.abs(term.lambda.im) < 1e-10) {
        used.add(index);
        formatted.push(...formatRealParticular(term));
        return;
      }
      if (term.lambda.im < 0) {
        const conjugate = matchConjugate(term, terms, used);
        if (conjugate < 0) {
          throw new Error("Kunde inte bilda en reell lösning för den angivna kraften.");
        }
        used.add(index);
        used.add(conjugate);
        formatted.push(...formatComplexParticular(terms[conjugate]));
        return;
      }
      const conjugate = matchConjugate(term, terms, used);
      if (conjugate < 0) {
        throw new Error("Kunde inte bilda en reell lösning för den angivna kraften.");
      }
      used.add(index);
      used.add(conjugate);
      formatted.push(...formatComplexParticular(term));
    });
    return formatted;
  }

  function classify(a, b, forcingTerms) {
    const tolerance = 1e-8 * Math.max(1, Math.abs(a * a), Math.abs(4 * b));
    const discriminant = a * a - 4 * b;
    if (b > 0 && Math.abs(a) < 1e-8) {
      const naturalFrequency = Math.sqrt(b);
      const hasResonantForce = forcingTerms.some((term) =>
        Math.abs(Math.abs(term.lambda.im) - naturalFrequency) < 0.01 * naturalFrequency
      );
      if (hasResonantForce) {
        return "Resonans: den odämpade kraftens frekvens matchar systemets egenfrekvens.";
      }
      return "Odämpad svängning.";
    }
    if (a > 0 && b > 0 && Math.abs(discriminant) <= tolerance) {
      return "Kritisk dämpning.";
    }
    if (a > 0 && b > 0 && discriminant < 0) {
      return "Dämpad svängning.";
    }
    if (a > 0 && b > 0 && discriminant > 0) {
      return "Överdämpning.";
    }
    if (a < 0 && b > 0) {
      return "Negativ dämpning: svängningarnas amplitud kan växa.";
    }
    return "Ingen standardklassificering (kontrollera a och b).";
  }

  function buildExactSolution({ a, b, expression, y0, velocity0 }) {
    const forcingTerms = parseForcing(expression);
    const particular = forcingTerms.map((term) => particularTerm(term, a, b));
    const particularInitial = particularValues(particular);
    const initialY = y0 - particularInitial.y0;
    const initialVelocity = velocity0 - particularInitial.velocity0;
    const discriminant = a * a - 4 * b;
    const tolerance = 1e-10 * Math.max(1, Math.abs(a * a), Math.abs(4 * b));
    let homogeneous;
    let homogeneousAt;

    if (discriminant > tolerance) {
      const root = Math.sqrt(discriminant);
      const firstRoot = (-a + root) / 2;
      const secondRoot = (-a - root) / 2;
      const firstCoefficient = (initialVelocity - secondRoot * initialY) / (firstRoot - secondRoot);
      const secondCoefficient = initialY - firstCoefficient;
      const firstFactor = exponentialFactor(firstRoot);
      const secondFactor = exponentialFactor(secondRoot);
      homogeneous = [
        {
          magnitude: Math.abs(firstCoefficient),
          negative: firstCoefficient < 0,
          body: amplitudeProduct(firstCoefficient, firstFactor)
        },
        {
          magnitude: Math.abs(secondCoefficient),
          negative: secondCoefficient < 0,
          body: amplitudeProduct(secondCoefficient, secondFactor)
        }
      ];
      homogeneousAt = (x) =>
        firstCoefficient * Math.exp(firstRoot * x)
        + secondCoefficient * Math.exp(secondRoot * x);
    } else if (discriminant >= -tolerance) {
      const root = -a / 2;
      const firstCoefficient = initialY;
      const secondCoefficient = initialVelocity - root * initialY;
      const factor = exponentialFactor(root);
      homogeneous = [
        {
          magnitude: Math.abs(firstCoefficient),
          negative: firstCoefficient < 0,
          body: amplitudeProduct(firstCoefficient, factor)
        },
        {
          magnitude: Math.abs(secondCoefficient),
          negative: secondCoefficient < 0,
          body: amplitudeProduct(secondCoefficient, `x${factor ? `*${factor}` : ""}`)
        }
      ];
      homogeneousAt = (x) =>
        (firstCoefficient + secondCoefficient * x) * Math.exp(root * x);
    } else {
      const alpha = -a / 2;
      const omega = Math.sqrt(-discriminant) / 2;
      const firstCoefficient = initialY;
      const secondCoefficient = initialVelocity / omega - alpha * initialY / omega;
      const factor = exponentialFactor(alpha);
      homogeneous = [
        {
          magnitude: Math.abs(firstCoefficient),
          negative: firstCoefficient < 0,
          body: amplitudeProduct(firstCoefficient, `cos(${frequencyArgument(omega)})`)
        },
        {
          magnitude: Math.abs(secondCoefficient),
          negative: secondCoefficient < 0,
          body: amplitudeProduct(secondCoefficient, `sin(${frequencyArgument(omega)})`)
        }
      ];
      if (factor) {
        homogeneous = homogeneous.map((term) => ({ ...term, body: `${term.body}*${factor}` }));
      }
      homogeneousAt = (x) =>
        Math.exp(alpha * x)
        * (firstCoefficient * Math.cos(omega * x) + secondCoefficient * Math.sin(omega * x));
    }

    const homogeneousTerms = homogeneous.filter((term) => term.magnitude > 1e-10);
    const formula = formatSum(homogeneousTerms.concat(formatParticularSolution(particular)));

    const frequency = Math.max(
      1,
      Math.abs(a),
      Math.sqrt(Math.abs(b)),
      ...particular.map((term) => Math.hypot(term.lambda.re, term.lambda.im))
    );
    const sampleCount = Math.max(baseSamples, Math.ceil(end * frequency * 30));
    if (sampleCount > maximumSamples) {
      throw new Error("Frekvensen eller koefficienterna är för stora för att rita grafen.");
    }
    const points = [];
    for (let index = 0; index <= sampleCount; index += 1) {
      const x = end * index / sampleCount;
      let y = homogeneousAt(x);
      for (const term of particular) {
        const polynomial = evaluatePolynomial(term.polynomial, x);
        const angle = term.lambda.im * x;
        const exponential = Math.exp(term.lambda.re * x);
        const factor = complex(exponential * Math.cos(angle), exponential * Math.sin(angle));
        y += multiply(polynomial, factor).re;
      }
      if (!Number.isFinite(y)) {
        throw new Error("Lösningen växte utanför beräkningsområdet. Prova andra värden.");
      }
      points.push({ x, y });
    }

    return {
      points,
      formula,
      classification: classify(a, b, forcingTerms)
    };
  }

  window.odeSolver = { buildExactSolution };
})();
