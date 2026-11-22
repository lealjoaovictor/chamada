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

  update(playerX: number): void {
    while (this.index + 1 < this.points.length && playerX >= this.points[this.index + 1].x) {
      this.index++;
    }
  }
}
