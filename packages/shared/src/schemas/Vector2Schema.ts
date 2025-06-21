import { Schema, type } from "@colyseus/schema";
import { Vector2 } from "../types/common";

export class Vector2Schema extends Schema implements Vector2 {
  @type("number") x = 0;
  @type("number") y = 0;
}
