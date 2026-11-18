
import { calculatePlayerRating } from "./rating";

const player = calculatePlayerRating("DC", {
  pace: 85,
  shooting: 90,
  passing: 75,
  dribbling: 88,
  defending: 40,
  physical: 80,
});

console.log(player);
