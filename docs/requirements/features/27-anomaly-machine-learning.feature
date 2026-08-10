Feature: Machine learning anomaly detection

  As SentinelMesh
  I want to use machine learning to identify unusual behavior
  So that complex anomalies can be detected

  Scenario: Generate features from traffic

    Given historical HTTP events exist
    When the feature extraction process runs
    Then traffic features should be generated

  Scenario: Train an anomaly detection model

    Given a valid training dataset exists
    When the anomaly detection model is trained
    Then a trained model should be produced
    And the model metadata should be stored

  Scenario: Detect an anomalous event

    Given a trained anomaly detection model exists
    When an unusual traffic pattern is evaluated
    Then the model should return an anomaly score

  Scenario: Combine ML and rule-based detection

    Given rule-based detections exist
    And a machine learning anomaly score exists
    When the threat engine evaluates the signals
    Then both sources should contribute to the final threat assessment
