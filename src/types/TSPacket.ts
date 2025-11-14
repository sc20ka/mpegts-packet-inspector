export interface TSPacket {
  // Header (4 bytes)
  header: {
    syncByte: number;           // 0x47
    transportErrorIndicator: boolean;
    payloadUnitStartIndicator: boolean;
    transportPriority: boolean;
    pid: number;                // 13 bits
    transportScramblingControl: number; // 2 bits
    adaptationFieldControl: number;     // 2 bits
    continuityCounter: number;   // 4 bits
  };

  // Adaptation Field (optional)
  adaptationField?: {
    length: number;
    discontinuityIndicator?: boolean;
    randomAccessIndicator?: boolean;
    elementaryStreamPriorityIndicator?: boolean;
    pcrFlag?: boolean;
    opcrFlag?: boolean;
    splicingPointFlag?: boolean;
    transportPrivateDataFlag?: boolean;
    adaptationFieldExtensionFlag?: boolean;

    pcr?: {
      base: bigint;        // 33 bits
      reserved: number;    // 6 bits
      extension: number;   // 9 bits
      calculated: number;  // in microseconds
    };

    opcr?: {
      base: bigint;
      reserved: number;
      extension: number;
    };

    spliceCountdown?: number;

    transportPrivateData?: {
      length: number;
      data: Uint8Array;
    };

    extension?: {
      length: number;
      ltwFlag?: boolean;
      piecewiseRateFlag?: boolean;
      seamlessSpliceFlag?: boolean;

      ltw?: {
        validFlag: boolean;
        offset: number;  // 15 bits
      };

      piecewiseRate?: number;  // 22 bits

      seamlessSplice?: {
        spliceType: number;     // 4 bits
        dtsNextAu: bigint;      // 33 bits
      };
    };

    stuffingBytes: Uint8Array;
  };

  // Payload (optional)
  payload?: Uint8Array;

  // Raw data
  raw: Uint8Array;  // 188 or 204 bytes
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
