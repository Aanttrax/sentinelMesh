Feature: Event Idempotency

  As a platform operator
  I want duplicate events to be handled safely
  So that reprocessing or retries do not produce duplicate threats or alerts

  Scenario: Discard duplicate event
    Given an event with an idempotency key that has already been processed
    When the same event is submitted again
    Then the duplicate is discarded and no duplicate threat is created
