import assert from "assert";
import { isNumeric } from "./Util.js";

assert(isNumeric("1.2"))
assert(isNumeric(0))
assert(!isNumeric("NaN"))
assert(!isNumeric("hey"))
