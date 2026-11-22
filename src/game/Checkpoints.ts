import type { PointData } from "../levels/types";

export class Checkpoints {
  private readonly points: readonly PointData[];
  private index = 0;

  constructor(points: readonly PointData[]) {
    this.points = points;
  }

  get current(): PointData {
    return this.points[this.index];
  }

  get currentIndex(): number {
    return this.index;
  }

  jumpTo(index: number): void {
    this.index = Math.max(0, Math.min(index, this.points.length - 1));
  }

  // Índice do último checkpoint que fica antes de x (ou no próprio x).
  indexBefore(x: number): number {
    let found = 0;
    this.points.forEach((point, i) => {
      if (point.x <= x) found = i;
    });
    return found;
  }

  update(playerX: number): void {
    while (this.index + 1 < this.points.length && playerX >= this.points[this.index + 1].x) {
      this.index++;
    }
  }
}
