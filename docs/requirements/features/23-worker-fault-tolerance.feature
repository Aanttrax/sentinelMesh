Feature: Worker fault tolerance

  As SentinelMesh
  I want failed jobs to be retried
  So that temporary worker failures do not lose events

  Scenario: Retry a failed job

    Given an event is being processed
    When the worker fails
    Then the job should be marked as failed
    And the retry policy should be applied

  Scenario: Successfully process a retry

    Given an event failed during its first attempt
    And the event has remaining retry attempts
    When another worker processes the retry
    Then the event should be processed successfully

  Scenario: Stop retrying after the maximum attempts

    Given an event has reached the maximum retry attempts
    When processing fails again
    Then the job should not be retried again
