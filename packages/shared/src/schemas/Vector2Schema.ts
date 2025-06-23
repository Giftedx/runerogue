import { Schema, type } from "@colyseus/schema";
import { Vector2 } from "../types/common";

/**
 * @class Vector2Schema
 * @description Represents a 2D vector, used for positions and other 2D data.
 * @author The Architect
 */
export class Vector2Schema extends Schema implements Vector2 {
  @type("number") x = 0;
  @type("number") y = 0;
}
