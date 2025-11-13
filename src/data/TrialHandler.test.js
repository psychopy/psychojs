import { expect, describe, test } from "@jest/globals";
import { TrialHandler } from "./TrialHandler.js";

const mockPsychoJS = {
  serverManager: {
    getResource: () => {},
  },
  experiment: {
    addData: () => {},
  },
  logger: {
    debug: () => {},
    warn: () => {},
  },
};

describe("TrialHandler prevent invalid iteration", () => {
  test("prevent calling next when handler is finished", () => {
    const trialList = [{ condition: "A" }];
    const handler = new TrialHandler({
      psychoJS: mockPsychoJS,
      trialList: trialList,
      nReps: 1,
      method: TrialHandler.Method.FULL_RANDOM,
      seed: "12",
      name: "testHandler",
      autoLog: true,
    });

    const validTrialN = trialList.length; // Valid number of trials
    const invalidTrialN = trialList.length + 1; // Intentionally invalid

    let iterationCount = 0;
    for (let i = 0; i <= invalidTrialN; i++) {
      let doesTrialCount;
      doesTrialCount = i !== invalidTrialN;
      if (!handler._finished) {
        handler.next(doesTrialCount);
        iterationCount++;
      } else {
        break;
      }
    }

    expect(iterationCount).toEqual(validTrialN);
  });
});
