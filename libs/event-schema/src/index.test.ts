import { HttpEvent, ThreatSeverity } from './index';

describe('HttpEvent', () => {
  it('should accept a valid event', () => {
    const event: HttpEvent = {
      serviceId: 'svc-001',
      idempotencyKey: 'idem-abc',
      method: 'GET',
      path: '/api/users',
      statusCode: 200,
      durationMs: 42,
      timestamp: new Date(),
    };

    expect(event.serviceId).toBe('svc-001');
    expect(event.method).toBe('GET');
  });
});

describe('ThreatSeverity', () => {
  it('should define four severity levels', () => {
    const levels = Object.values(ThreatSeverity);
    expect(levels).toHaveLength(4);
    expect(levels).toContain('low');
    expect(levels).toContain('critical');
  });
});
