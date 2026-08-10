Feature: Real-Time Threat Monitoring

  As a platform operator
  I want to see threats appear in real time as they are detected
  So that I can respond immediately to active security incidents

  Scenario: New threat appears in real time
    Given the dashboard is open
    When a new threat is detected and scored
    Then the threat appears on the dashboard without requiring a manual refresh
