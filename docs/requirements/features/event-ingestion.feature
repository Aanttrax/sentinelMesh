Feature: Event Ingestion

  As an external API service
  I want to send HTTP event data to SentinelMesh
  So that my traffic can be analyzed for anomalies

  Scenario: Ingest a valid HTTP event
    Given a registered service
    When an HTTP event is submitted
    Then the event is accepted and queued for processing
