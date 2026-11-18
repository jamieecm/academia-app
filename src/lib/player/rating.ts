
export type PlayerPosition = "POR" | "DEF" | "MED" | "DEL";

// Posiciones que pueden llegar desde Supabase.
export type PlayerPositionInput = PlayerPosition | "DC";

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

// Ponderaciones por posición.
// Cada columna suma 100%.
const POSITION_WEIGHTS: Record<
  PlayerPosition,
  Record<keyof PlayerAttributes, number>
> = {
  POR: {
    pace: 5,
    shooting: 5,
    passing: 15,
    dribbling: 10,
    defending: 35,
    physical: 30,
  },
  DEF: {
    pace: 10,
    shooting: 5,
    passing: 15,
    dribbling: 10,
    defending: 35,
    physical: 25,
  },
  MED: {
    pace: 15,
    shooting: 10,
    passing: 25,
    dribbling: 20,
    defending: 15,
    physical: 15,
  },
  DEL: {
    pace: 20,
    shooting: 30,
    passing: 15,
    dribbling: 20,
    defending: 5,
    physical: 10,
  },
};

/**
 * Normaliza los códigos de posición recibidos desde Supabase.
 * DC utiliza las ponderaciones de DEL.
 */
export function normalizePlayerPosition(
  position: PlayerPositionInput
): PlayerPosition {
  const normalized = position.trim().toUpperCase();

  if (normalized === "DC") {
    return "DEL";
  }

  if (
    normalized === "POR" ||
    normalized === "DEF" ||
    normalized === "MED" ||
    normalized === "DEL"
  ) {
    return normalized;
  }

  throw new Error(`Posición no válida: ${position}`);
}

/**
 * Valida que los atributos sean números enteros entre 1 y 99.
 */
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

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calcula el OVR según las ponderaciones de cada posición.
 */
export function calculateOverall(
  position: PlayerPositionInput,
  attributes: PlayerAttributes
): number {
  const validation = validatePlayerAttributes(attributes);

  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  const normalizedPosition = normalizePlayerPosition(position);
  const weights = POSITION_WEIGHTS[normalizedPosition];

  const overall = Object.entries(weights).reduce(
    (total, [attribute, weight]) => {
      const key = attribute as keyof PlayerAttributes;
      return total + attributes[key] * (weight / 100);
    },
    0
  );

  return Math.round(overall);
}

/**
 * Determina la rareza permanente según el OVR.
 */
export function getPlayerRarity(overall: number): PlayerRarity {
  if (!Number.isInteger(overall) || overall < 1 || overall > 99) {
    throw new Error("El OVR debe ser un número entero entre 1 y 99.");
  }

  if (overall >= 75) return "GOLD";
  if (overall >= 65) return "SILVER";

  return "BRONZE";
}

/**
 * Calcula la valoración completa del jugador.
 */
export function calculatePlayerRating(
  position: PlayerPositionInput,
  attributes: PlayerAttributes
): PlayerRating {
  const overall = calculateOverall(position, attributes);

  return {
    overall,
    rarity: getPlayerRarity(overall),
    attributes,
  };
}
