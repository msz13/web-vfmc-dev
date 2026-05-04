Feature: NISS - Normal/Inverse Scramble Switching


  Background:
    Given the scramble is "R U R' F'"
    And the inverse scramble is "F R U' R'"
    And cube state is EO

  Rule: Normal cube state is inv(inverseMoves) + scramble + normalMovesube 
  #Cube state, cue solution and multiline notes should follow FMC rules
    # inv(inverseMoves) prepends the inverse of all inverse moves before the scramble,
    # followed by the normal moves.
    # Example: scramble "R U R' F'", normal moves "U F", inverse moves "R"
    #   -> inv(R) + R U R' F' + U F = R' R U R' F' U F = U R' F' U F  (R' R cancel)

    # inv("R") + "R U R' F'" + "" = "R' R U R' F'"
    Scenario: Entering inverse moves then switching to normal mode 
      Given I am in inverse mode
      And I have no moves
      When I enter the moves "R" while in inverse mode
      And I switch to normal mode
      Then the cube state is "R' R U R' F'"
      And Multiline solution is "(R)"
      And Final solution is R'

    Scenario: Entering inverse moves then switching to normal mode 
      Given I am in inverse mode
      And I have no moves
      When I enter the moves "R" while in inverse mode
      And I switch to normal mode
      Then I am in normal mode
      And the cube state is "R' R U R' F'"

    #Dobre
    Scenario: Entering inverse moves then switching to normal mode 
      Given Solver enter the moves "R" while in inverse mode
      When Switch to normal mode
      Then the cube state is "R' R U R' F'"
      And Multiline solution is "(R)"
      And Final solution is "R'"

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