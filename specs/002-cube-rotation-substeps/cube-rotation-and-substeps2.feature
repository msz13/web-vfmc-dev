Feature: Cube Rotation 

User can applay cube rotations on x, y, z axis. 
Inverse moves are not avaiblie.

  Background:
    Given a session is active with a valid WCA scramble

  # ---------------------------------------------------------------------------
  # Manual cube rotation
  # ---------------------------------------------------------------------------

  Rule: The user can manually rotate the cube along any axis

    Scenario: Rotate cube around the x-axis (tip forward)
      Given cube state is "R U F"
      When the user applies an x rotation
      Then the cube state is "R U F x"
   
    Scenario: Rotate cube around the y-axis (tip forward)
      Given cube state is "R U F"
      When the user applies an y rotation
      Then the cube state is "R U F y"

    Scenario: Rotate cube around the z-axis (tip forward)
      Given cube state is "R U F"
      When the user applies an y rotation
      Then the cube state is "R U F z" 


    Scenario: Cube rotation persists across move inputs
      Given the user has applied a y rotation 
      When the user inputs a move "D"
      Then the cube state is "R U F D y"

Feature: Selecting substeps
  # ---------------------------------------------------------------------------
  # EO substeps and their canonical cube orientation
  # ---------------------------------------------------------------------------

  Rule: Selecting an EO substep sets the canonical front face for that axis

    Scenario Outline: Selecting an EO substep sets the canonical cube orientation
      Given the EO step is active
      When the user selects substep "<substep>"
      Then the cube state is "<rotation>"
      And the substep label "<substep>" is highlighted as active

      Examples:
        | substep | rotation |
        | eofb    |          |
        | eorl    | y        |
        | eoud    | x        |
   

    Scenario: Switching between EO substeps updates the cube orientation immediately
      Given the EO step is active and substep "eofb" is selected (front face is F)
      When the user switches to substep "eorl"
      Then the cube state is "y"
      When the user switches to substep "eoud"
      Then the cube state is "x"

    Scenario: EO substep selection is preserved after entering moves
      Given the EO step is active and substep "eorl" is selected
      When the user inputs several moves "R U L"
      Then the cube state is "R U L y"

    Scenario: Cube rotation resets when a new substep is selected
      Given the user has manually rotated the cube to an arbitrary orientation "z"
      When the user selects the substep "eofb"
      Then the cube display resets to the canonical orientation for that substep ""

    Scenario: User adds manual rotations canonical orientation of that substep is preserved
      Given the user selects the substep "eorl"      
      When the user has manually rotated the cube to an arbitrary orientation "z"
      Then the cube state is "y z"

    Scenario: Substep is preserved after saving and selecting active solution
      Given the user selects the substep "eorl" 
      And saves sequence and clear variation
      When user selects this sequence
      Then cube state is "y"
      And the substep label "eorl" highlighted as active


  # ---------------------------------------------------------------------------
  # DR substeps and their canonical cube orientation
  # ---------------------------------------------------------------------------

  Rule: Selecting a DR substep sets the canonical front face for that axis

    Scenario Outline: Selecting dr orientation
      Given cube was rotaded on axis <initial_rotation>
      When the user selects <substep>
      Then the cube state is <rotation>
      And the substep label <substep> is highlighted as active
      Examples:
          | initial_rotation | substep | rotation |
          | "" | drud | ""  |
          | "" | drrl | z   |
          | y  | drud | y   |
          | y  | drfb | y z |
          | x  | drfb | x   |
          | x  | drrl | z z | 

  


  # ---------------------------------------------------------------------------
  # Substep persistence and session restore
  # ---------------------------------------------------------------------------

  Rule: Active substep is persisted across page refreshes

    Scenario: Active EO substep survives a page refresh
      Given the EO step is active with substep "eoud" selected
      When the user refreshes the page
      Then the session is restored with substep "eoud" still active
      And the cube display shows U at the front

    Scenario: Active DR substep survives a page refresh
      Given the DR step is active with substep "drrl" selected
      When the user refreshes the page
      Then the session is restored with substep "drrl" still active
      And the cube display shows R at the front

  # ---------------------------------------------------------------------------
  # Default substep on step activation
  # ---------------------------------------------------------------------------

  Rule: A step activates with a default substep when none has been selected

    Scenario: EO step defaults to eofb when first activated
      Given a new session with a scramble set
      When the EO step becomes active for the first time
      Then the active substep is "eofb"
      And the cube display shows F at the front

    Scenario: DR step defaults to drud when first activated
      Given the EO step has a saved variation
      When the user advances to the DR step for the first time
      Then the active DR substep is "drud"
      And the cube display shows F at the front


 ---                                                                                                                                            
  1. Substep switch with unsaved moves in progress
                                                                                                                                                 
  If the user has typed R U R' for EO-FB, then switches to eorl — what happens to those moves? Are they kept as-is, cleared, or does the app warn
   before switching?

  ---
  2. Does move input operate in cube-relative or absolute notation?

  When eorl is active and R is the front face, if the user presses the F button on the move pad — do they get F (absolute, the actual F face) or
  F relative to the rotated view (which would be R in absolute notation)? This is a significant design decision that affects every substep.

  ---
  3. Can two EO variations have different substeps?

  Can the user save one variation as EO-FB and another as EO-RL in the same session? Or is the substep a session-level setting shared across all
  EO variations? If per-variation, what shows in the variation list?

  ---
  4. What DR substep is valid after a given EO substep?

  In FMC, EO and DR axes are linked — you do DR on the same axis as your EO. Should drrl only be reachable if eorl was the EO substep? Or are EO
  and DR substeps fully independent?

  ---
  5. Manual rotation combined with a substep

  If eorl is active (R is front) and the user manually applies a y rotation on top — what is the "current" substep now? Is it still eorl? Is the
  manual rotation additive, or does it override/deselect the substep?

  ---
  6. What happens at the EO → DR transition?

  When the user advances from EO to DR, does the cube orientation carry over from the EO substep, or does it reset to the DR step's default (drud
   / F-front)?

  ---
  7. Substep stored on the variation or on the step?

  Is the substep label (e.g. EO-RL) stored as part of the saved Sequence, or is it just a display-time setting? If a user saves a variation,
  changes the substep, then comes back — does the variation still show EO-RL?