/**
 * Basic Phaser types to fix compilation errors
 * TODO: Replace with proper @types/phaser when available
 */

declare namespace Phaser {
  namespace GameObjects {
    class Container {
      x: number;
      y: number;
      visible: boolean;
      add(child: unknown): this;
      setPosition(x: number, y: number): this;
      setVisible(visible: boolean): this;
      setDepth(depth: number): this;
      setAlpha(alpha: number): this;
      setScale(scale: number): this;
      destroy(): void;
    }

    class Text {
      x: number;
      y: number;
      text: string;
      visible: boolean;
      setOrigin(x: number, y?: number): this;
      setStyle(style: unknown): this;
      setDepth(depth: number): this;
      setTint(color: number): this;
      setAlpha(alpha: number): this;
      setScale(scale: number): this;
      setText(text: string): this;
      destroy(): void;
    }

    class Rectangle {
      x: number;
      y: number;
      width: number;
      height: number;
      fillColor: number;
      visible: boolean;
      setFillStyle(color: number): this;
      setStrokeStyle(lineWidth: number, color?: number): this;
      setSize(width: number, height: number): this;
      destroy(): void;
    }
  }

  namespace Display {
    namespace Color {
      function IntegerToColor(color: number): { r: number; g: number; b: number };
      function GetColor(r: number, g: number, b: number): number;

      namespace Interpolate {
        function ColorWithColor(
          colorA: { r: number; g: number; b: number },
          colorB: { r: number; g: number; b: number },
          length: number,
          index: number
        ): { r: number; g: number; b: number };
      }
    }
  }

  namespace Math {
    function Between(min: number, max: number): number;
  }

  class Scene {
    add: {
      text(x: number, y: number, text: string, style?: any): GameObjects.Text;
      rectangle(
        x: number,
        y: number,
        width: number,
        height: number,
        color?: number
      ): GameObjects.Rectangle;
      container(x: number, y: number, children?: any[]): GameObjects.Container;
    };
    tweens: {
      add(config: any): any;
    };
  }
}
