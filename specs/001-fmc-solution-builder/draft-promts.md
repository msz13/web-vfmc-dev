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



 analyse domain-api and data model for  FMC Solution Builder in @data-model.md. compare it to my proposition which is written as typsript interfaces and types. write pros and cons of my solution compring it to proposed in @data-mode.md and @domain-api.md. verify if contians oll methods to implemenet solution.
 parsing and validation shoud be private methods

'''

type ID = number

type Nisscontext = 'normal' | 'inverse' | undefined


interface Subsequence {
    moves: string
    nissContext: NissContext
}

  interface Sequence  {
    id: ID
    moves: Subsequence[];
    moveCount: number;
    previousStepId: string;
  }

type Step = 'EO' | 'DR' | 'HTR' | 'Floppy' | 'Finish' | 

type SessionState = {
  scramble: string
  steps: Map<Step, Sequence>;
  id: ID;
  datestart: number;
};


refactor @spec.md @domain-api.md and data-model.md based on my Session interface and comments on methods. user only needs see solution with active step sequence and it's parents sequnces form previous steps, not all children variotions. insertations step should be implemented in nex feature. 


interface Session {

  setScramble(scramble: string ) // start new session for given scramble
  generateScramble(): void // start new session with generated scramble
  getActiveSolutionStepByStep(): string // returns solution in format: every sequence for given step in //new line with comment containg step name and move count for sequence and cumulative move count
  getActiveSolution(): string //returns move sequence containing scramble + solution needed for visualisation 
  getAllSteps(): Step[] //returns list of all steps
  nextStep(stepName: Step): Step | null
  getStepVariations(step: Step): Sequence[] // list all variations of sequences for given step labbeled with by step name and its index in list of sequnces for given step
  setActiveStep(step: Step): void
  addMove(move: string): void //adds move to active solution
  saveSequence(): void //saves active active solution
  setActiveSolution(step: Step, sequenceId:ID): void
  loadSession():Session | null 
  saveSession(): void
  clearSession(): void    
 
}

Errors to fix:
- failed test in actions
- cube isnt'visualise, refactor to use custom compoenent not js object for cube visualisation: change research.md usage:
 <twisty-player
      puzzle="3x3x3"
      visualization="PG3D"
      background="none"
      control-panel="none"
      id="cube-player"
      experimental-setup-alg=""
      alg=""
      "
    ></twisty-player>
- [x] add getCubeState to Session which returns scramble plus solution, and modify getActivesolution to return only solution without scramble, update tests and @domain-api.md 
- [x] refactor new page design
    - dark theme
    - toogle solution view/keybord
    - you should be able to do every action without scrolling and always see cube
- [x] session state should't have updateat property, remove all assignmentsof update at field
- add move - enum (moves) tpye on input, not need parsing
- [x]sprawdzic get step variation - niepotrzebnie zwraca variancje dla parent id, powinna zwrotcic tylko wszystkie wariance dla step
- [x] refactor handle change in variation list, chacking if page, get previous step in session
- refactor page components - simplify i three components
- ermove current input from move input


FIX:
-[ x ] on variation list, when you chose select, state should be reseted to previous step 

TODO later 
- enter solution keybord only
- cube rotations



### Manual tests
- yourney for saveing step what is next state
- input to scramble goes to in different plays. cannot save scramble
- soluotion display to small, nie widac kolejnych liniie



