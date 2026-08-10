Feature: Event dashboard

  As a security administrator
  I want to inspect HTTP events
  So that I can investigate system behavior

  Scenario: Display recent events

    Given SentinelMesh has received HTTP events
    When I open the events page
    Then recent events should be displayed

  Scenario: Filter events by service

    Given events from multiple services exist
    When I filter events by "payment-api"
    Then only events from "payment-api" should be displayed

  Scenario: Filter events by status code

    Given events with different status codes exist
    When I filter events by status code 401
    Then only events with status code 401 should be displayed
