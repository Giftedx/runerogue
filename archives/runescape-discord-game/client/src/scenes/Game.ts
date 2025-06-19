import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    console.log("GameScene create");
    this.add.text(100, 100, "Welcome to the Game!", {
      fontSize: "32px",
      color: "#ffffff",
    });
    // Game logic will go here
  }

  update(time: number, delta: number) {
    // Game loop
  }
}
