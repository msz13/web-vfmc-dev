# Specification: NISS (Normal/Inverse Scramble Switching)

## Glossary

| Term | Definition |
|------|------------|
| **Scramble (S)** | The given sequence of moves representing the starting cube state. E.g. `R U R' F'`. |
| **Inverse Scramble (inv(S))** | Each move of the scramble inverted, in reversed order. E.g. `F R U' R'` for `R U R' F'`. |
| **Normal Mode** | The solving context where the solver is working on the normal scramble. New moves entered are **normal moves**. |
| **Inverse Mode** | The solving context where the solver is working on the inverse scramble. New moves entered are **inverse moves**. |
| **Normal Moves (n)** | Moves entered while in normal mode. Displayed without brackets. |
| **Inverse Moves (i)** | Moves entered while in inverse mode. Displayed inside round brackets `( )` after the normal moves. |
| **NISS Switch** | The action of toggling the current solving mode by pressing the NISS button. Pressing once enters inverse mode; pressing again returns to normal mode. |
| **Normal Cube State** | The cube state as seen in normal mode: `inv(i) + S + n`. Represents where the cube stands from the normal-scramble side. |
| **Inverse Cube State** | The cube state as seen in inverse mode: `inv(n) + inv(S) + i`. Represents where the cube stands from the inverse-scramble side. |
| **Step Solution** | A saved set of moves for one FMC phase (EO, DR, HTR, Floppy, Finish). Contains both `normalMoves` and `inverseMoves`. |
| **Solution Notation** | The written form of a NISS solution for a step: `n1 n2 ... (i1 i2 ...)`. Normal moves come first; inverse moves follow in a single grouped round bracket block. |
| **Attempt** | A complete FMC session: one scramble, multiple saved step solutions, one active solution being built. |
| **Move Count** | Total number of moves in the solution, counting both normal and inverse moves. Brackets do not add extra cost. |

---

## Feature: NISS Support

```gherkin
Feature: NISS - Normal/Inverse Scramble Switching

  Background:
    Given the scramble is "R U R' F'"
    And the inverse scramble is "F R U' R'"

  Rule: Normal cube state is inv(inverseMoves) + scramble + normalMoves
    # inv(inverseMoves) prepends the inverse of all inverse moves before the scramble,
    # followed by the normal moves.
    # Example: scramble "R U R' F'", normal moves "U F", inverse moves "R"
    #   -> inv(R) + R U R' F' + U F = R' R U R' F' U F = U R' F' U F  (R' R cancel)

    # inv("R") + "R U R' F'" + "" = "R' R U R' F'"
    Scenario: Entering inverse moves then switching to normal mode shows inverse moves prepended
      Given I am in inverse mode
      And I have no moves
      When I enter the moves "R" while in inverse mode
      And I switch to normal mode
      Then I am in normal mode
      And the cube state is "R' R U R' F'"

    # inv("R") + "R U R' F'" + "U F" = "R' R U R' F' U F"
    Scenario: Entering inverse moves, switching to normal, then entering normal moves
      Given I am in inverse mode
      And I have no moves
      When I enter the moves "R" while in inverse mode
      And I press the NISS button to return to normal mode
      And I enter the moves "U F"
      Then I am in normal mode
      And the cube state is "R' R U R' F' U F"

    # inv("F") + "R U R' F'" + "U B" = "F' R U R' F' U B"
    Scenario: Entering normal moves, switching to inverse, entering inverse moves, switching back and entering more normal moves
      Given I enter the moves "U" on normal mode
      And I enter the moves "F" while in inverse mode
      When I switch to return to normal mode
      And I enter the moves "B"
      Then the cube state is "F' R U R' F' U B"

  Rule: Inverse cube state is inv(normalMoves) + inv(scramble) + inverseMoves
    # inv(normalMoves) prepends the inverse of all normal moves before the inverse scramble,
    # followed by the inverse moves.
    # Example: scramble "R U R' F'", inverse scramble "F R U' R'", normal "U F", inverse "R"
    #   -> inv(U F) + F R U' R' + R = F' U' F R U' R' R = F' U' F R U'  (R' R cancel)


    # inv("") + "F R U' R'" + "" = "F R U' R'"
    Scenario: Switching to inverse mode with no moves shows the inverse scramble
      Given I am in normal mode
      And I have no moves
      When I switch to inverse
      Then I am in inverse mode
      And the inverse cube state is "F R U' R'"

    # inv("") + "F R U' R'" + "R" = "F R U' R' R"
    Scenario: Entering moves while in inverse mode extends the inverse cube state
      Given I am in inverse mode
      When I enter the moves "R" while in inverse mode
      Then the inverse cube state is "F R U' R' R"

    # inv("U F") + "F R U' R'" + "" = "F' U' F R U' R'"
    Scenario: Switching to inverse after entering normal moves 
      Given I enter the moves "U F" on normal
      When I switch to inverse
      Then I am in inverse mode
      And the inverse cube state is "F' U' F R U' R'"

    # inv("U") + "F R U' R'" + "R B" = "U' F R U' R' R B"
    Scenario: Entering inverse moves, adding normal moves, then switching back to inverse and adding more inverse moves
      Given I enter the moves "R" while in inverse mode
      And I enter the move "U" on normal
      When I enter move "B" while in inverse mode
      Then the inverse cube state is "U' F R U' R' R B"

  Rule: Label of which mode is is visible
    # Pressing the NISS button once enters inverse mode.
    # Pressing it again returns to normal mode.
    # A label is visible in the UI whenever inverse mode is active.

    Scenario: Inverse model label is visible after switching to inverse
      Given I am in normal mode
      When I swich to inverse
      Then the inverse mode label is visible

    Scenario: Switching back to normal and inverse label is not visible.
      Given I am in inverse mode
      When I switch to normal
      Then the inverse mode label is not visible

  Rule: Undo removes the last inverse move but does not exit inverse mode
    # When in inverse mode, undo removes the last entered inverse move.
    # When there are no inverse moves left, undo does nothing.
    # To exit inverse mode the solver must press the NISS button again.

    Scenario: Undo move on inverse when no moves are entered
      Given I am in inverse mode
      And I have no inverse moves
      When I press undo
      Then I am still in inverse mode
      And I have no inverse moves

  Rule: Solver can perform a NISS switch between steps
    # After saving a step solution the solver may start the next step in the opposite mode.
    # NISS mode carries over from the active mode at the time of saving the previous step.
    # Selecting a different step variation updates the active mode for the continuation.

#Decide czy tego nie usunac
    Scenario: Start the next step in inverse mode after saving the previous step in normal mode
      Given I have saved EO with normal moves "U F" and no inverse moves
      When I switch to inverse
      And I enter the DR moves "R B" while in inverse mode
      Then the DR line in the solution list shows "(R B)"

    Scenario: NISS mode carries over when advancing to the next step
      Given I am in inverse mode
      And I have saved EO with no normal moves and inverse moves "U F"
      When I advance to DR without pressing the NISS button
      Then I am in inverse mode at the start of DR

    Scenario: Selecting a step variation solved in inverse mode switches active mode to inverse
      Given I have two saved EO variations:
        | id | normalMoves | inverseMoves |
        | A  | "U F"       | ""           |
        | B  | ""          | "R B"        |
      And variation A is currently selected
      When I select variation B
      Then I am in inverse mode

    Scenario: Selecting a step variation solved in normal mode switches active mode to normal
      Given I have two saved EO variations:
        | id | normalMoves | inverseMoves |
        | A  | "U F"       | ""           |
        | B  | ""          | "R B"        |
      And variation B is currently selected
      When I select variation A
      Then I am in normal mode

  Rule: Solver can perform a NISS switch within a step
    # The solver can switch mode while entering moves for the current step before saving it.
    # Pressing the NISS button again within the same step returns to normal mode.
    # Normal and inverse moves accumulate in separate lists regardless of how many times mode is toggled.
    # Display always groups them: normalMoves (inverseMoves).

#decide czy nie przenieść tego do zapisu
    Scenario: Entering moves on normal then switching to inverse within the same step
      Given Solver is solving the EO step
      And entered the moves "U B" on normal
      When switches to inverse
      And I enter the moves "F" while in inverse mode
      Then the current step has normal moves "U B" and inverse moves "F"
      And the step display shows "U B (F)"

    Scenario: Saving a step solution preserves both normal and inverse moves
      Given I am solving the EO step
      And the current step has normal moves "U B" and inverse moves "F"
      When I save the step solution
      Then the saved EO step solution has normalMoves "U B" and inverseMoves "F"
      And the EO line in the solution list shows "U B (F)"

    Scenario: Switching back to normal mode within a step appends further moves to normal moves
      Given I am solving the EO step
      And I have entered normal moves "U"
      And I have pressed the NISS button and entered inverse moves "F"
      When I press the NISS button to return to normal mode
      And I enter the moves "B"
      Then the current step has normal moves "U B" and inverse moves "F"
      And the step display shows "U B (F)"

  Rule: Inverse moves are displayed in round brackets after normal moves
    # Format per step: normalMoves (inverseMoves)
    # If a step has no inverse moves it displays only: normalMoves
    # If a step has no normal moves it displays only: (inverseMoves)
    # All inverse moves for a step are grouped into a single bracket block.
    # This notation is used in both the per-step multiline view and the flat overall solution string.

    Scenario: Step with only normal moves shows no brackets
      Given a saved step solution with normalMoves "R U" and inverseMoves ""
      Then the step display is "R U"

    Scenario: Step with only inverse moves shows only round brackets
      Given a saved step solution with normalMoves "" and inverseMoves "F B'"
      Then the step display is "(F B')"

    Scenario: Step with both normal and inverse moves shows normal moves first then brackets
      Given a saved step solution with normalMoves "U R" and inverseMoves "F B'"
      Then the step display is "U R (F B')"

    Scenario: Multiple inverse moves appear as one grouped bracket block
      Given a saved step solution with normalMoves "U" and inverseMoves "R F"
      Then the step display is "U (R F)"
      # Not "U (R) (F)" or "(R) U (F)"

    Scenario: Full multiline solution with NISS applied across multiple steps
      Given I have saved EO with normal moves "U F" and no inverse moves
      And I have saved DR with no normal moves and inverse moves "R B"
      Then the multiline solution view shows:
        """
        EO: U F
        DR: (R B)
        """

    Scenario: Overall flat solution string uses the same round bracket notation
      Given I have saved EO with normal moves "U F" and no inverse moves
      And I have saved DR with no normal moves and inverse moves "R B"
      Then the overall solution string is "U F (R B)"

  Rule: Full solution is all normal moves followed by the inverse of all inverse moves
    # The final executable solution sequence combines moves from both scramble sides:
    #   full_solution = normalMoves_total + inv(inverseMoves_total)
    # where:
    #   normalMoves_total  = all normalMoves from all steps concatenated in order
    #   inverseMoves_total = all inverseMoves from all steps concatenated in order
    #   inv(seq)           = sequence reversed with each move inverted (e.g. inv("R B") = "B' R'")
    # This is the sequence that, applied to the scrambled cube, produces the solved state.

    Scenario: Full solution with only normal moves equals the normal moves unchanged
      Given I have saved steps with total normalMoves "R U F" and no inverseMoves
      Then the full solution sequence is "R U F"

    Scenario: Full solution with only inverse moves equals the inverse of those moves
      Given I have saved steps with no normalMoves and total inverseMoves "B D"
      Then the full solution sequence is "D' B'"
      # inv("B D") = "D' B'"

    Scenario: Full solution appends the inverse of inverse moves after normal moves
      Given I have saved steps with total normalMoves "U F" and total inverseMoves "R B"
      Then the full solution sequence is "U F B' R'"
      # "U F" + inv("R B") = "U F" + "B' R'"

    Scenario: Full solution across multiple steps with NISS in different steps
      Given I have saved:
        | step | normalMoves | inverseMoves |
        | EO   | "U"         | "F"          |
        | DR   | "R"         | "B"          |
      Then the total normalMoves are "U R"
      And the total inverseMoves are "F B"
      And the full solution sequence is "U R B' F'"
      # "U R" + inv("F B") = "U R" + "B' F'"

    Scenario: Inverse moves from multiple steps are concatenated before inverting
      Given I have saved:
        | step | normalMoves | inverseMoves |
        | EO   | "U F"       | ""           |
        | DR   | ""          | "R"          |
        | HTR  | ""          | "B D"        |
      Then the total inverseMoves are "R B D"
      And the full solution sequence is "U F D' B' R'"
      # "U F" + inv("R B D") = "U F" + "D' B' R'"

  Rule: A saved StepSolution stores normalMoves and inverseMoves separately
    # Both move lists are preserved independently in the linked solution tree.
    # This allows the cube state formula to reconstruct the correct position at any step.

  Rule: Move count includes both normal and inverse moves
    # Round brackets carry no extra cost; each move counts once regardless of mode.

    Scenario: Move count for a step sums normal and inverse moves
      Given a saved step solution with normalMoves "R U F" and inverseMoves "B D"
      Then the step move count is 5

    Scenario: Total solution move count sums all steps regardless of mode
      Given I have saved EO with normal moves "U F" and inverse moves "R"   # 3 moves
      And I have saved DR with no normal moves and inverse moves "R B"        # 2 moves
      Then the total move count is 5
```

---

## Open Questions

4. **Does the cube visualizer change when in inverse mode?**
   Specifically: does the TwistyPlayer `alg` parameter use the full `cube_state_inverse` formula, or does the displayed scramble itself switch to the inverse scramble?

## Out of scope 
- move cencelation

---

## Rules

1. Normal cube state is inv(inverseMoves) + scramble + normalMoves
2. Inverse cube state is inv(normalMoves) + inv(scramble) + inverseMoves
3. Label of which mode is is visible
4. Undo removes the last inverse move but does not exit inverse mode
5. Solver can perform a NISS switch between steps
6. Solver can perform a NISS switch within a step
7. Inverse moves are displayed in round brackets after normal moves
8. Full solution is all normal moves followed by the inverse of all inverse moves
  - same scenarios as in first two rule but with different outcome
9. A saved solution preserves inverse moves
  - Scenario: full step is on inverse
  - Scenario: part of step is on inverse

10. Move count includes both normal and inverse moves


 # inv("F") + "R U R' F'" + "U B" = "F' R U R' F' U B"
    Scenario: Entering normal moves, switching to inverse, entering inverse moves, switching back and entering more normal moves
      Given I enter the moves "U" on normal mode
      And I enter the moves "F" while in inverse mode
      When I switch to return to normal mode
      And I enter the moves "B"
      Then the cube state is "F' R U R' F' U B"
      And current input is "U B (F')"
      And Multiline solution is "U B (F')"
      And full solution is 

  #refactor test to show 3 feature
  # - cube state
  # - multiline solution
  # full solution 