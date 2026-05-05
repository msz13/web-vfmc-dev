Feature: Cube state
  Rule: Inverse mode should be labeled

  Scenario: Inverse model label is visible after switching to inverse
      Given Solver is in normal mode
      When Solver swich to inverse
      Then The inverse mode label is visible

    Scenario: Inverse label is not visible when switching back to normal
      Given Solver is on inverse mode
      When Solver switch to normal
      Then The inverse mode label is not visible

  Rule: On inverse cube state is inverse of normal moves, inverse of scamble and moves entered on inverse moves

    Scenario: Switching to inverse mode with no moves
      Given Solver switched to inverse
      And Entered no moves
      When He views cube state
      Then It is "F R U' R'"

    Scenario: Entering moves while in inverse mode extends the inverse cube state
      Given Solver switched to inverse
      And Entered moves "R U"
      When He views cube state
      Then It is "F R U' R' R U"


  Rule: On normal cube state is inverse of moves added on inverse, scramble and normal moves
    Scenario: Moves entered on inverse then switched to normal mode
      Given Solver switched to inverse
      And Entered moves "R U"
      When Solver switch to normal
      And He views cube state
      Then It is "U' R' R U R' F'"

  Rule: Moves from different steps are compined together
    Scenario: Part of moves of EO and DR states are entered on inverse
      Given Solver completed EO step with normal moves "R U R'"
      And Solver switched to inverse on DR step
      And Entered moves "F U"
      When He views cube state
      Then It is "F R U' R' R U R' F U"

Feature: Multiline note
  Rule: Moves on inverse are in visualised in brackets on the end of step solution
    Scenario: EO step is on normal and DR is on inverse
      Given Solver completed EO step with moves "R U R'"
      And Solver switched to inverse on DR step
      And Entered moves "F U"
      When He views solution notes
      Then EO note shows "R U R'"
      And DR note shows "[F U]"

    Scenario: EO step is on inverse
      Given Solver is on EO step in inverse mode
      And Entered moves "R U"
      When He views solution notes
      Then EO note shows "[R U]"

    Scenario: First moves are on normal then switched to inverse in single step
      Given Solver is on EO step
      And Entered moves "R U"
      And Solver switched to inverse
      And Entered moves "F"
      When He views solution notes
      Then EO note shows "R U [F]"

    Scenario: First moves are on inverse then switched to normal in single step
      Given Solver is on EO step in inverse mode
      And Entered moves "F"
      And Solver switched to normal
      And Entered moves "R U"
      When He views solution notes
      Then EO note shows "[F] R U"

Feature: Full solution view
  Rule: Full solution contains moves on normal and inverse of inverse moves at the end
    Scenario: Single step is on inverse
      Given Solver completed EO step in inverse mode with moves "R U"
      When He views full solution
      Then Full solution shows "U' R' // EO"

    Scenario: EO is on invese, DR is on normal
      Given Solver completed EO step in inverse mode with moves "R U"
      And Solver completed DR step with normal moves "F R"
      When He views full solution
      Then Full solution shows "F R // DR"
      And Full solution shows "U' R' // EO"

    Scenario: Part of step is on inverse
      Given Solver is on EO step
      And Entered normal moves "R U"
      And Solver switched to inverse
      And Entered moves "F"
      When He views full solution
      Then Full solution shows "R U F' // EO"

    Scenario: Parts of multiple steps are on inverse
      Given Solver completed EO step with normal moves "R U" and inverse moves "F"
      And Solver completed DR step in inverse mode with moves "B"
      When He views full solution
      Then Full solution shows "R U B' F' // EO DR"

Feature: Saving step solution
  Rule: Inverse moves are preserves after saving
    Scenario: Full step on inverse is saved and displayed on saved list
      Given Solver is on EO step in inverse mode
      And Entered moves "R U"
      When Solver saves the step solution
      And He views saved solutions list
      Then The saved EO solution shows "[R U]"

    Scenario: Part step on inverse is saved and displayed on saved list
      Given Solver is on EO step
      And Entered moves "R U"
      And Solver switched to inverse
      And Entered moves "F"
      When Solver saves the step solution
      And He views saved solutions list
      Then The saved EO solution shows "R U [F]"

  Rule: Inverse or normal mode is preserved after saving step solution /NISS mode carries over when advancing to the next step
    Scenario: NISS mode carries over when advancing to the next step
      Given Solver is on EO step in inverse mode
      When Solver saves the step solution and advances to DR
      Then Solver is in inverse mode on DR step

Feature: Opening saved solution
    Rule: Inverse mode and inverse moves are preserved after opening
      Scenario: Opening a solution saved with inverse moves
        Given Solver saved EO solution with inverse moves "R U"
        When Solver opens the saved solution
        Then Solver is in inverse mode
        And The inverse moves "R U" are loaded
