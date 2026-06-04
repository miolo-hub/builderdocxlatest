export function towerLetters(count: number): string[] {
  if (count < 1 || count > 26) {
    throw new Error("Tower count must be between 1 and 26");
  }
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
}

/** e.g. tower A, floor 1, flat 1 → A101 */
export function formatUnitNumber(tower: string, floor: number, flat: number): string {
  return `${tower}${floor}${String(flat).padStart(2, "0")}`;
}

export function previewTowerLayout(input: {
  towerCount: number;
  floors: number;
  flatsPerFloor: number;
}): { total: number; sample: string[] } {
  const total = input.towerCount * input.floors * input.flatsPerFloor;
  const sample: string[] = [];
  const towers = towerLetters(Math.min(input.towerCount, 2));
  for (const tower of towers) {
    for (let floor = 1; floor <= Math.min(input.floors, 2); floor++) {
      for (let flat = 1; flat <= Math.min(input.flatsPerFloor, 3); flat++) {
        sample.push(formatUnitNumber(tower, floor, flat));
      }
    }
  }
  return { total, sample };
}

export function generateTowerLayoutUnits(input: {
  towerCount: number;
  floors: number;
  flatsPerFloor: number;
  defaultBasePrice: number;
}): {
  unitNumber: string;
  tower: string;
  floor: string;
  block: string;
  status: "available";
  basePrice: number;
}[] {
  const { towerCount, floors, flatsPerFloor, defaultBasePrice } = input;
  if (floors < 1 || floors > 99) throw new Error("Floors must be between 1 and 99");
  if (flatsPerFloor < 1 || flatsPerFloor > 99) {
    throw new Error("Flats per floor must be between 1 and 99");
  }

  const towers = towerLetters(towerCount);
  const price = defaultBasePrice > 0 ? defaultBasePrice : 1;
  const units: {
    unitNumber: string;
    tower: string;
    floor: string;
    block: string;
    status: "available";
    basePrice: number;
  }[] = [];

  for (const tower of towers) {
    const block = `Tower ${tower}`;
    for (let floor = 1; floor <= floors; floor++) {
      for (let flat = 1; flat <= flatsPerFloor; flat++) {
        units.push({
          unitNumber: formatUnitNumber(tower, floor, flat),
          tower,
          floor: String(floor),
          block,
          status: "available",
          basePrice: price,
        });
      }
    }
  }
  return units;
}
