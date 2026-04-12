type ID = number

type Nisscontext = 'normal' | 'inverse' | 'undefined'


interface Subsequence {
    moves: string
    nissContext: string
}

  interface Sequence  {
    id: ID
    moves: Subsequence[];
    moveCount: number;
    previousStepId: string;
  }

type Step = 'EO' | 'DR'| 'HTR'

type SessionState = {
  steps: Map<Step, Sequence>;
  id: ID;
  datestart: Date;
};



interface Session {

  start(): void 
  newScramble(): void
  getActiveSolutionStepbyStep(): string // returns solution in step by step format
  getStepVariations(step: Step): Sequence[]
  getActiveSolution(): string //sequence to visualise: scramble + solution 
  setActiveStep(step: Step): void
  addMove(move: string): void //adds move to active solution
  saveSequence(): void //saves active active solution
  setActiveSolution(step: Step, sequenceId:ID): void
  
 
}
