Feature: Event processing

  As SentinelMesh
  I want to process events asynchronously
  So that event ingestion remains fast

  Scenario: Publish an event to the queue

    Given a valid event has been received
    When the collector accepts the event
    Then the event should be published to the event queue

  Scenario: Process an event from the queue

    Given an event exists in the event queue
    When a detection worker consumes the event
    Then the event should be processed
    And the event processing status should be updated

  Scenario: Mark a successfully processed event

    Given a worker successfully processes an event
    Then the event should be marked as processed

  Scenario: Handle processing failure

    Given a worker fails while processing an event
    Then the event should not be marked as successfully processed
    And the retry policy should be applied
