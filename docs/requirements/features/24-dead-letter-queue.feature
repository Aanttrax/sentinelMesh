Feature: Dead letter queue

  As a platform operator
  I want permanently failed events to be isolated
  So that they can be investigated without blocking normal processing

  Scenario: Move a permanently failed event to the dead letter queue

    Given an event has failed the maximum number of times
    When the final retry fails
    Then the event should be moved to the dead letter queue

  Scenario: Inspect dead letter events

    Given failed events exist in the dead letter queue
    When an administrator requests failed events
    Then the failed events should be displayed

  Scenario: Retry a dead letter event

    Given an event exists in the dead letter queue
    When an administrator retries the event
    Then the event should be returned to the processing queue
