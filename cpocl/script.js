// For this demo, I would like:
// A program which, given a state, character goals, and author's goal,
// runs through one step at a time to generate a narrative. Each step
// should be printed to the console, or displayed in the browser

/** Denotes a step in a CPOCL Plan*/
class Step {
/**
 * Creates a step
   * @param {Map} preconditions
   * @param {Map} effects
   * @param {boolean} persistant
   * @param {String} description description of the Step. It will be printed to the screen if executed.
   */
  constructor(description, persistant, preconditions, effects) {
    this.executed = false;
    this.persistant = persistant;
    this.description = description;
    this.preconditions = preconditions;
    this.effects = effects;
  }
}

// Here I am setting up 'domain' functions pursuant to the CPOCL example
// Also called operators
const travel = (char, from, to) => {
  let preconditions = [
    char.health > 0,
    char.at == from
  ]
  let effects = () => char.at = to
  let consenting =  true;

  if (preconditions && consenting) {
    effects()
  }
} 

const snakebite = (char) => {
  let preconditions = [char.health > 0]
  // let effects = () => {}
}

// Start step
const start = () => {
  const state = {
    characters: {
      billy: {
        at: 'home',
        tired: 0,
        happy: 0,
        alive: true,
      },
      tommy: {
        at: 'home',
        tired: 0,
        happy: 0,
        alive: true,
      },
      wanda: {
        at: 'home',
        tired: 0,
        happy: 0,
        alive: true,
      },
      vision: {
        at: 'home',
        tired: 0,
        happy: 0,
        alive: true,
      },
    },
  };
  return state
}


/**
 * Returns the index of a step if it exists
 * @param {any} step
 * @returns {any}
 */
function index(step) {
}

function likelihood(step) {
  return 1
}

// How sastfied a character is with the state of the world once T occurs
// I could also make this a property within an intention frame, I'm thinking
function utility(char, T) {
  return 1
}


/**
 * Returns the likelihood of success for a characters intention frame (T1) given an opposing intention frame (T2)
 * @param {Array} T1 Remainder of intention frame 
 * @param {Array} T2
 * @returns {Number}
 */
function balance(T1, T2) {
  if (T1[0].persistant === true) {
    return 1 - likelihood(T2)
  } else {
    return likelihood(T1) / (likelihood(T1) + likelihood(T2))
  }
}

function directness(c1, c2) {
  const fam = (c1.family == c2.family) ? 1 : 0;
  const phsyical = (c1.at == c2.at) ? 1 : 0;

  return fam + phsyical / 2;
}

// The diff between how high a participant's utility will be if 
// they prevail and how it will be if they fail
function stakes(char, T1, T2) {
  return Math.abs(utility(char, T1) - utility(char, T2))
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
    return step.executed
  }
  T1Finished = T1.filter(isExecuted);
  T2Finished = T2.filter(isExecuted);
  executedFrames = T1Finished.concat(T2Finished);
  executedFrames.sort(a => a.index)

  complete = utility(char, executedFrames)
  beforeConflict = utility(char, pT)
  return complete - beforeConflict
}

function calculateDuration(m1, m2, t, u, if1, if2) {
  let start = Math.max();
}