// For this demo, I would like:
// A program which, given a state, character goals, and author's goal,
// runs through one step at a time to generate a narrative. Each step
// should be printed to the console, or displayed in the browser

function intendsTo(char, goal, motivatingStep, satisfyingStep) {
  return new IntentionFrame(char, goal, motivatingStep, satisfyingStep);
}

class IntentionFrame {
  char;
  goal;
  motivatingStep;
  satisfyingStep;
  subPlan = [];
  constructor(char, goal, motivatingStep, satisfyingStep, subPlan) {
    this.char = char,
    this.goal = goal,
    this.motivatingStep = motivatingStep
    this.satisfyingStep = satisfyingStep
    this.subPlan = subPlan
  }
}

/** Denotes a step in a CPOCL Plan*/
class Step {
  persistant;
  description;
  preconditions;
  effects;
  
  /**
   * Creates a step
   * @param {Array<Function>} preconditions
   * @param {Function} effects Function to apply to modify state
   * @param {Boolean} persistant Whether step should be executed every turn
   * @param {String} description description of the Step. It will be printed to the screen if executed.
   */
  constructor(description, persistant, preconditions, effects) {
    this.persistant = persistant;
    this.description = description;
    this.preconditions = preconditions;
    this.effects = effects;
  }

  executed = false;

  /**
   * Executes event and returns a copy of the state with changes
   * @param {Map<symbol, Map<symbol, Array<String> | String | boolean>>} state
   * @returns {Map<symbol, Map<symbol, Array<String> | String | boolean>>} new state
   */
  execute(state) {
    if (this.preconditions.every((x) => x(state) == true)) {
      let newState = Object.assign({}, state);
      this.effects(newState);
      console.log(this.description);
      this.executed = true;
      return newState;
    } else {
      console.log("all preconditions not met");
      return state;
    }
  }
}

// Here I am setting up 'domain' functions pursuant to the CPOCL example
// Also called operators
const travel = (char, from, to) => {
  let preconditions = [char.health > 0, char.at == from];
  let effects = () => (char.at = to);
  let consenting = true;

  if (preconditions && consenting) {
    effects();
  }
};

class Travel extends Step {
  constructor(preconditions, char, from, to) {
    // TODO: How is the planner supposed to know what this does?
    // Perhaps if it knows what `this.to` is ahead of time
    const effects = (state) => (state[char].at = to);
    const defaultPreconditions = [
      (state) => state[char].alive == true,
      (state) => state[char].at == from,
      () => from !== to,
    ];
    const allPreconditions = preconditions.concat(defaultPreconditions);
    super(
      `${char} travels from ${from} to ${to}`,
      false,
      allPreconditions,
      effects
    );
    // TODO: Figure out if you need these properties around
    this.char = char;
    this.from = from;
    this.to = to;
  }
}

class Snakebite extends Step {
  constructor(preconditions, char) {
    const defaultPreconditions = [(state) => state[char].alive === true];
    const allPreconditions = preconditions.concat(defaultPreconditions);
    const effects = (state) => {
      intendsTo(char, state[char].status == "dying", this, null);
      super(`${char} is bitten by snake`, false, allPreconditions, effects);
    };
  }
}

class Take extends Step {
  constructor(preconditions, item, takeChar, fromChar) {
    // the fromChar actually needs the item
    // the takeChar needs to be alive
    // both Chars need to be in the same location
    const defaultPreconditions = [
      (state) => state[fromChar].inventory.includes(item),
      (state) => state[takeChar].alive === true,
      (state) => state[fromChar].at === state[takeChar].at,
    ];
    const allPreconditions = preconditions.concat(defaultPreconditions);
    const effects = (state) => {
      state[fromChar].inventory = state[fromChar].inventory.filter(
        (i) => i !== item
      );
      state[takeChar].inventory.push(item);
    };
    super(
      `${takeChar} takes ${item} from ${fromChar}`,
      false,
      allPreconditions,
      effects
    );
  }
}

// Start step
const state = {
  Hank: {
    name: "Hank",
    alive: true,
    family: ["Timmy"],
    armed: true,
    sheriff: false,
    at: "Ranch",
    inventory: [],
    status: "healthy",
  },
  Timmy: {
    name: "Timmy",
    alive: true,
    family: ["Hank"],
    armed: false,
    sheriff: false,
    at: "Ranch",
    inventory: [],
    status: "healthy",
  },
  William: {
    name: "William",
    alive: true,
    family: [],
    armed: true,
    sheriff: true,
    at: "Saloon",
    inventory: [],
    status: "healthy",
  },
  Carl: {
    name: "Carl",
    alive: true,
    family: [],
    armed: true,
    sheriff: false,
    at: "Saloon",
    inventory: [],
    status: "healthy",
  },
};

// I'm not yet sure whether it's best to represent the end state as a function,
// or as a Map, with which I can compare by copying the current state and adding
// in the endState
// Actually, I don't know if just "adding in the endState" is possible with a map
const isEndState = (state) => state.Timmy.alive == false || state.Timmy.saved == true;

const eState1 = {
  Timmy: {
    status: "dying",
  },
};

const eState2 = {
  Timmy: {
    status: "-dying",
  },
};

/**
 * Returns the index of a step if it exists
 * @param {any} step
 * @returns {any}
 */
function index(step) {}

function likelihood(step) {
  return 1;
}

// How sastfied a character is with the state of the world once T occurs
// I could also make this a property within an intention frame, I'm thinking
function utility(char, T) {
  return 1;
}

/**
 * Returns the likelihood of success for a characters intention frame (T1) given an opposing intention frame (T2)
 * @param {Array} T1 Remainder of intention frame
 * @param {Array} T2
 * @returns {Number}
 */
function balance(T1, T2) {
  if (T1[0].persistant === true) {
    return 1 - likelihood(T2);
  } else {
    return likelihood(T1) / (likelihood(T1) + likelihood(T2));
  }
}

function directness(c1, c2) {
  const fam = c1.family == c2.family ? 1 : 0;
  const phsyical = c1.at == c2.at ? 1 : 0;

  return fam + phsyical / 2;
}

// The diff between how high a participant's utility will be if
// they prevail and how it will be if they fail
function stakes(char, T1, T2) {
  return Math.abs(utility(char, T1) - utility(char, T2));
}

/**
 * Measures the change in utility a character experiences after a conflict ends
 * @param {any} char
 * @param {Array} T1
 * @param {Array} T2
 * @param {Array} pT
 * @returns {any}
 */
function resolution(char, T1, T2, pT) {
  // Create execution frame, which has all executed intention frames sorted
  const isExecuted = (step) => {
    return step.executed;
  };
  T1Finished = T1.filter(isExecuted);
  T2Finished = T2.filter(isExecuted);
  executedFrames = T1Finished.concat(T2Finished);
  executedFrames.sort((a) => a.index);

  complete = utility(char, executedFrames);
  beforeConflict = utility(char, pT);
  return complete - beforeConflict;
}

function calculateDuration(m1, m2, t, u, if1, if2) {
  let start = Math.max();
}


/**
 * Simulates a coinflip, and returns either heads (0) or tails (1)
 * @returns {Number} 0 or 1
 */
const coinFlip = () => {
  return Math.floor(Math.random() * 2);
};

const randIdx = (arr) => {
  return Math.floor(Math.random() * arr.length);
};

class CPOCL {
  history;
  flaws;
  startState;
  operators;
  endState;
  constructor(startState, endState) {
    this.history = [];
    this.flaws = [];
    this.state = startState;
    this.operators = [];
    this.endState = new Function(...endState)
  }

  cpocl(steps, varBindings, stepOrdering, causalLinks, intentionFrames) {
    flaw = this.getFlaw();
    
    switch (flaw.type) {
      case "open precondition flaw":
        let sAdd = this.getStep(steps);
        break;
    }
    

    let newState = undefined;
    return newState;
  }

  createStep() {
    let newStep;
    return newStep;
  }

  /**
   * Returns a random flaw from the list of flaws
   * @returns {any} A random Flaw object
   */
  getFlaw() {
    idx = randIdx(flaws);
    flaw = this.flaws[idx];
    this.flaws.splice(idx, 1);
    return flaw;
  }

  getStep(steps) {
    if (steps.length > 0) {
      answer = coinFlip();
      
      // If we get "tails", we generate a random index number from a helper 
      // fn and return a random step
      if (answer == 1) {
        idx = randIdx(steps);
        return steps[idx];
      } else {
        return this.createStep();
      }
    } else {
      // create new step
      return this.createStep();
    }
  }

  step() {
    if (this.desiredState == true) {
      return "Fin";
    }
  }
}
