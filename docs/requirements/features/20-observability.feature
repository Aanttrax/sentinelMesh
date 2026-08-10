Feature: SentinelMesh observability

  As a platform operator
  I want to monitor SentinelMesh itself
  So that platform problems can be detected

  Scenario: Expose application metrics

    When the metrics endpoint is requested
    Then SentinelMesh should expose application metrics

  Scenario: Count received events

    Given SentinelMesh receives 100 events
    When metrics are collected
    Then the received event counter should increase by 100

  Scenario: Measure detection processing time

    Given a detection worker processes an event
    When metrics are collected
    Then the detection processing duration should be recorded

  Scenario: Monitor queue depth

    Given events are waiting in the processing queue
    When metrics are collected
    Then the queue depth should be available as a metric
