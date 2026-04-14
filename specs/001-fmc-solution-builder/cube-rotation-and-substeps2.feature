Feature: Cube Rotation and Solving Substeps

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

  # ---------------------------------------------------------------------------
  # EO substeps and their canonical cube orientation
  # ---------------------------------------------------------------------------

  Rule: Selecting an EO substep sets the canonical front face for that axis

    Scenario: Selecting eofb sets front face to F
      Given the EO step is active
      When the user selects substep "eofb"
      Then the cube state is ""
      And the substep label "eofb" is highlighted as active

    Scenario: Selecting eorl sets front face to R
      Given the EO step is active
      When the user selects substep "eorl"
      Then the cube state is "y"
      And the substep label "eorl" is highlighted as active

    Scenario: Selecting eoud sets front face to U
      Given the EO step is active
      When the user selects substep "eoud"
      Then the cube state is "x"
      And the substep label "eoud" is highlighted as active
   

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
      Then the cube display resets to the canonical orientation for that substep "z"

    Scenario: User adds manual rotations canonical orientation of that substep is preserved
      Given the user selects the substep "eorl"      
      When the user has manually rotated the cube to an arbitrary orientation "z"
      Then the cube state is "y z"

  # ---------------------------------------------------------------------------
  # DR substeps and their canonical cube orientation
  # ---------------------------------------------------------------------------

  Rule: Selecting a DR substep sets the canonical front face for that axis

    Scenario: Selecting drud keeps the default orientation (F face at front)
      Given the DR step is active
      When the user selects substep "drud"
      Then the cube state is ""
      And the substep label "drud" is highlighted as active

    Scenario: Selecting drrl sets front face to R
      Given the DR step is active
      When the user selects substep "drrl"
      Then the cube state is "y"
      And the substep label "drrl" is highlighted as active

    Scenario: Selecting drfb sets front face to F
      Given the DR step is active
      When the user selects substep "drfb"
      Then the cube state is "x"
      And the substep label "drud" is highlighted as active

    Scenario: DR substep is reflected in solution display
      Given the DR step is active and substep "drrl" is selected
      When the user saves a move sequence
      Then the step-by-step display appends the line:
        """
        {moves} // DR-RL ({stepCount}/{runningTotal})
        """

    Scenario: Switching EO substep axis does not alter the DR substep
      Given the EO step has a saved variation with substep "eorl"
      And the DR step is active with substep "drud"
      When the user switches to a different EO variation with substep "eofb"
      Then the DR substep remains "drud"

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