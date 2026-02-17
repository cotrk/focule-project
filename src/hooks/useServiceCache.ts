import { useMemo } from 'react';
import { ErrorClassificationService } from '../services/ErrorClassificationService';
import { RecoveryService } from '../services/RecoveryService';
import { SessionRecoveryService } from '../services/SessionRecoveryService';

interface ServiceCache {
  errorClassificationService: ErrorClassificationService;
  recoveryService: RecoveryService;
  sessionRecoveryService: SessionRecoveryService;
}

export function useServiceCache(): ServiceCache {
  return useMemo(() => ({
    errorClassificationService: ErrorClassificationService.getInstance(),
    recoveryService: RecoveryService.getInstance(),
    sessionRecoveryService: SessionRecoveryService.getInstance(),
  }), []);
}
