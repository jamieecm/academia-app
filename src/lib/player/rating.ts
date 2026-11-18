export const PLAYER_POSITIONS = [
  "POR",
  "DFC",
  "LI",
  "LD",
  "MCD",
  "MC",
  "MCO",
  "MI",
  "MD",
  "EI",
  "ED",
  "DC",
] as const;

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

export const POSITION_NAMES: Record<PlayerPosition, string> = {
  POR: "Portero",
  DFC: "Defensa Central",
  LI: "Lateral Izquierdo",
  LD: "Lateral Derecho",
  MCD: "Mediocampista Defensivo",
  MC: "Mediocampista Central",
  MCO: "Mediocampista Ofensivo",
  MI: "Mediocentro Izquierdo",
  MD: "Mediocentro Derecho",
  EI: "Extremo Izquierdo",
  ED: "Extremo Derecho",
  DC: "Delantero Centro",
};

export type PlayerAttributes = {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};

export type PlayerRarity = "BRONZE" | "SILVER" | "GOLD";

export type PlayerRating = {
  overall: number;
  rarity: PlayerRarity;
  attributes: PlayerAttributes;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

type AttributeWeights = Record<keyof PlayerAttributes, number>;

// Pesos iniciales por posición. Cada fila suma 100 y se aplica a atributos 1–99.
const POSITION_WEIGHTS: Record<PlayerPosition, AttributeWeights> = {
  POR: {
    pace: 5,
    shooting: 5,
    passing: 15,
    dribbling: 10,
    defending: 35,
    physical: 30,
  },
  DFC: {
    pace: 10,
    shooting: 5,
    passing: 15,
    dribbling: 10,
    defending: 35,
    physical: 25,
  },
  LI: {
    pace: 20,
    shooting: 5,
    passing: 15,
    dribbling: 15,
    defending: 25,
    physical: 20,
  },
  LD: {
    pace: 20,
    shooting: 5,
    passing: 15,
    dribbling: 15,
    defending: 25,
    physical: 20,
  },
  MCD: {
    pace: 10,
    shooting: 5,
    passing: 25,
    dribbling: 15,
    defending: 25,
    physical: 20,
  },
  MC: {
    pace: 15,
    shooting: 10,
    passing: 25,
    dribbling: 20,
    defending: 15,
    physical: 15,
  },
  MCO: {
    pace: 15,
    shooting: 20,
    passing: 25,
    dribbling: 25,
    defending: 5,
    physical: 10,
  },
  MI: {
    pace: 20,
    shooting: 10,
    passing: 20,
    dribbling: 20,
    defending: 15,
    physical: 15,
  },
  MD: {
    pace: 20,
    shooting: 10,
    passing: 20,
    dribbling: 20,
    defending: 15,
    physical: 15,
  },
  EI: {
    pace: 25,
    shooting: 25,
    passing: 15,
    dribbling: 25,
    defending: 3,
    physical: 7,
  },
  ED: {
    pace: 25,
    shooting: 25,
    passing: 15,
    dribbling: 25,
    defending: 3,
    physical: 7,
  },
  DC: {
    pace: 20,
    shooting: 35,
    passing: 10,
    dribbling: 20,
    defending: 5,
    physical: 10,
  },
};

export function isPlayerPosition(position: string): position is PlayerPosition {
  return PLAYER_POSITIONS.some((validPosition) => validPosition === position);
}

export function getPlayerPositionName(position: PlayerPosition): string {
  return POSITION_NAMES[position];
}

export function validatePlayerAttributes(
  attributes: PlayerAttributes
): ValidationResult {
  const errors: string[] = [];
  const attributeNames: Record<keyof PlayerAttributes, string> = {
    pace: "Ritmo",
    shooting: "Tiro",
    passing: "Pase",
    dribbling: "Regate",
    defending: "Defensa",
    physical: "Físico",
  };

  for (const key of Object.keys(attributeNames) as (keyof PlayerAttributes)[]) {
    const value = attributes[key];

    if (!Number.isInteger(value) || value < 1 || value > 99) {
      errors.push(
        `${attributeNames[key]} debe ser un número entero entre 1 y 99.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export function calculateOverall(
  position: string,
  attributes: PlayerAttributes
): number {
  const validation = validatePlayerAttributes(attributes);
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const normalizedPosition = position.trim().toUpperCase();
  if (!isPlayerPosition(normalizedPosition)) {
    throw new Error(`Posición no válida: ${position}`);
  }

  const weights = POSITION_WEIGHTS[normalizedPosition];
  const overall = (Object.keys(weights) as (keyof PlayerAttributes)[]).reduce(
    (total, attribute) =>
      total + attributes[attribute] * (weights[attribute] / 100),
    0
  );

  return Math.round(overall);
}

export function getPlayerRarity(overall: number): PlayerRarity {
  if (!Number.isInteger(overall) || overall < 1 || overall > 99) {
    throw new Error("El OVR debe ser un número entero entre 1 y 99.");
  }

  if (overall >= 75) return "GOLD";
  if (overall >= 65) return "SILVER";
  return "BRONZE";
}

export function calculatePlayerRating(
  position: string,
  attributes: PlayerAttributes
): PlayerRating {
  const overall = calculateOverall(position, attributes);

  return {
    overall,
    rarity: getPlayerRarity(overall),
    attributes,
  };
}
