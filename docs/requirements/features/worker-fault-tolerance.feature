Feature: Worker Fault Tolerance

  As a platform operator
  I want detection workers to be resilient to failures
  So that no event is lost during processing

  Scenario: Worker recovers from failure
    Given a detection worker processing an event
    When the worker crashes mid-processing
    Then the event is retried by another worker and processing completes
