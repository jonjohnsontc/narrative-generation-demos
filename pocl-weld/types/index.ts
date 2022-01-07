// Type Declarations
export type VariableBinding = {
  equal: boolean;
  assignor: string;
  assignee: string;
};

export type BindingMap = Map<PropertyKey, VariableBinding>;

export type NewBindingMap = Map<string, VariableBinding[]>;

export type OrderingConstraint = {
  name: string;
  tail: string;
};

export type Literal = {
  operation: string;
  action: string;
  parameters: readonly string[];
};

export type Action = {
  name: string;
  parameters: readonly ActionParam[];
  precondition: readonly Literal[];
  effect: readonly Literal[];
};

// TODO: Right now, this represents the first and last state of the problem
export type State = {
  name: string;
  actions: readonly Literal[];
};

// TODO: I think this should have a `version: number` kv pair
export type ActionParam = {
  parameter: string;
  type: string | null;
};

export type AgendaItem = {
  q: Literal;
  aAdd: string;
};

export type Agenda = AgendaItem[];

export type CausalLink = {
  createdBy: string; // action effect
  consumedBy: string; // action precondition

  // The preposition (or Q) needs to be a string representation of the effect/precondition
  // shared by the creator and consumer.
  preposition: Literal;
};
