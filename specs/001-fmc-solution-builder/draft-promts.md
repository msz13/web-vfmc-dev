refactor 001-fmc-solution-builder spec.md to 
- contain user stories:
    - build solution step by step based on scramble writen in code
    - scramble cube by app or from user input
    -  Save and View multiple Variations Per Step
- User Story 3 - NISS: Switch Between Normal and Inverse Scramble will be added in next feature, explian it in assumptions
- add to key entities that solution in displayed in two formats: as simple sequence of moves and in format which shows solution divdivided by each step, move count for current step and overall move count, like in example:
   """
   F B R' // EO (3/3) 
   U F'^ R2 L2 F' D' // DR 2c3 2e (6/9) 
   B F' R2 F' // HTR (4/13) 
   U2 L2 D2 B2 R2 // Finish (5/18)
   """



 analyse Data Model: FMC Solution Builder in @data-model.md and compare it to my proposition which is written as typsript interfaces and types. write pros and cons of my solution compring it to proposed i file. 
 parsing and validation shoud be private methods

'''
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

interface Variation {
  step: Step  //current step
  id: ID //sequence ID
}



interface Session {

  start(): Variation 
  newScramble(): Variation
  addMove(step: Step, sequenceId: ID, move: string): void
  updateSequence(step: Step, sequenceId: ID, moves: string): void
  cubeState(): string // sequence to visalise scramble + solution 
  saveSequence(): Variation //saves active sequence
  getSolutionStepByStepForVariation(step: Step, sequenceId: ID): string // returns solution in step by step format
  getStepVariations(step: Step): Sequence[]
  getTotalMoveCount(step: Step, sequenceId: ID): number // returns totoal move count for sequence of given step and previous steps
  getCurrentScramle(): string
}

//active solution contains, last step, and seqence id
// on new session, or new step, it creates first(empty) sequence

'''

verify if session contians oall methods to implemenet solution ??


