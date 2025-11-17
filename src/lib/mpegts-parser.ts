import { TSPacket, ValidationError, ValidationResult } from '../types/TSPacket';

/**
 * Parse a single MPEG-TS packet from raw bytes
 */
export function parsePacket(data: Uint8Array): TSPacket {
  if (data.length !== 188 && data.length !== 204) {
    throw new Error(`Invalid packet length: ${data.length}. Expected 188 or 204 bytes.`);
  }

  const packet: TSPacket = {
    header: parseHeader(data),
    raw: data,
  };

  let offset = 4; // After header

  // Parse adaptation field if present
  const afc = packet.header.adaptationFieldControl;
  if (afc === 0b10 || afc === 0b11) {
    const afResult = parseAdaptationField(data, offset);
    packet.adaptationField = afResult.adaptationField;
    offset = afResult.nextOffset;
  }

  // Parse payload if present
  if (afc === 0b01 || afc === 0b11) {
    const payloadLength = 188 - offset;
    packet.payload = data.slice(offset, offset + payloadLength);
  }

  return packet;
}

/**
 * Parse packet header (first 4 bytes)
 */
function parseHeader(data: Uint8Array) {
  const byte0 = data[0];
  const byte1 = data[1];
  const byte2 = data[2];
  const byte3 = data[3];

  return {
    syncByte: byte0,
    transportErrorIndicator: !!(byte1 & 0b10000000),
    payloadUnitStartIndicator: !!(byte1 & 0b01000000),
    transportPriority: !!(byte1 & 0b00100000),
    pid: ((byte1 & 0b00011111) << 8) | byte2,
    transportScramblingControl: (byte3 & 0b11000000) >> 6,
    adaptationFieldControl: (byte3 & 0b00110000) >> 4,
    continuityCounter: byte3 & 0b00001111,
  };
}

/**
 * Parse adaptation field
 */
function parseAdaptationField(data: Uint8Array, offset: number) {
  const length = data[offset];
  offset++;

  if (length === 0) {
    return {
      adaptationField: {
        length: 0,
        stuffingBytes: new Uint8Array(0),
      },
      nextOffset: offset,
    };
  }

  const afStart = offset;
  const flags = data[offset];
  offset++;

  const adaptationField: TSPacket['adaptationField'] = {
    length,
    discontinuityIndicator: !!(flags & 0b10000000),
    randomAccessIndicator: !!(flags & 0b01000000),
    elementaryStreamPriorityIndicator: !!(flags & 0b00100000),
    pcrFlag: !!(flags & 0b00010000),
    opcrFlag: !!(flags & 0b00001000),
    splicingPointFlag: !!(flags & 0b00000100),
    transportPrivateDataFlag: !!(flags & 0b00000010),
    adaptationFieldExtensionFlag: !!(flags & 0b00000001),
    stuffingBytes: new Uint8Array(0),
  };

  // Parse PCR if present
  if (adaptationField.pcrFlag) {
    const pcrBytes = data.slice(offset, offset + 6);
    adaptationField.pcr = parsePCR(pcrBytes);
    offset += 6;
  }

  // Parse OPCR if present
  if (adaptationField.opcrFlag) {
    const opcrBytes = data.slice(offset, offset + 6);
    adaptationField.opcr = parseOPCR(opcrBytes);
    offset += 6;
  }

  // Parse splice countdown if present
  if (adaptationField.splicingPointFlag) {
    adaptationField.spliceCountdown = data[offset];
    offset++;
  }

  // Parse transport private data if present
  if (adaptationField.transportPrivateDataFlag) {
    const tpdLength = data[offset];
    offset++;
    adaptationField.transportPrivateData = {
      length: tpdLength,
      data: data.slice(offset, offset + tpdLength),
    };
    offset += tpdLength;
  }

  // Parse adaptation field extension if present
  if (adaptationField.adaptationFieldExtensionFlag) {
    const afExtResult = parseAdaptationFieldExtension(data, offset);
    adaptationField.extension = afExtResult.extension;
    offset = afExtResult.nextOffset;
  }

  // Calculate stuffing bytes
  const stuffingStart = offset;
  const stuffingEnd = afStart + length;
  adaptationField.stuffingBytes = data.slice(stuffingStart, stuffingEnd);

  return {
    adaptationField,
    nextOffset: afStart + length,
  };
}

/**
 * Parse PCR (Program Clock Reference)
 */
function parsePCR(bytes: Uint8Array) {
  // PCR base is 33 bits
  const base =
    (BigInt(bytes[0]) << 25n) |
    (BigInt(bytes[1]) << 17n) |
    (BigInt(bytes[2]) << 9n) |
    (BigInt(bytes[3]) << 1n) |
    (BigInt(bytes[4] >> 7) & 1n);

  // Reserved is 6 bits
  const reserved = (bytes[4] >> 1) & 0b00111111;

  // Extension is 9 bits
  const extension = ((bytes[4] & 0b00000001) << 8) | bytes[5];

  // Calculate time in microseconds
  const pcrValue = base * 300n + BigInt(extension);
  const calculated = Number((pcrValue * 1000000n) / 27000000n);

  return {
    base,
    reserved,
    extension,
    calculated,
  };
}

/**
 * Parse OPCR (Original Program Clock Reference)
 */
function parseOPCR(bytes: Uint8Array) {
  // Same structure as PCR
  const base =
    (BigInt(bytes[0]) << 25n) |
    (BigInt(bytes[1]) << 17n) |
    (BigInt(bytes[2]) << 9n) |
    (BigInt(bytes[3]) << 1n) |
    (BigInt(bytes[4] >> 7) & 1n);

  const reserved = (bytes[4] >> 1) & 0b00111111;
  const extension = ((bytes[4] & 0b00000001) << 8) | bytes[5];

  return {
    base,
    reserved,
    extension,
  };
}

/**
 * Parse Adaptation Field Extension
 */
function parseAdaptationFieldExtension(data: Uint8Array, offset: number) {
  const extLength = data[offset];
  offset++;

  const extStart = offset;
  const flags = data[offset];
  offset++;

  const extension: NonNullable<TSPacket['adaptationField']>['extension'] = {
    length: extLength,
    ltwFlag: !!(flags & 0b10000000),
    piecewiseRateFlag: !!(flags & 0b01000000),
    seamlessSpliceFlag: !!(flags & 0b00100000),
  };

  // Parse LTW (Legal Time Window) if present
  if (extension.ltwFlag) {
    const ltwBytes = (data[offset] << 8) | data[offset + 1];
    extension.ltw = {
      validFlag: !!(ltwBytes & 0x8000),
      offset: ltwBytes & 0x7fff,
    };
    offset += 2;
  }

  // Parse Piecewise Rate if present
  if (extension.piecewiseRateFlag) {
    const prBytes = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
    extension.piecewiseRate = prBytes & 0x3fffff; // 22 bits
    offset += 3;
  }

  // Parse Seamless Splice if present
  if (extension.seamlessSpliceFlag) {
    const spliceType = (data[offset] >> 4) & 0x0f;

    // DTS Next AU is 33 bits spread across 5 bytes with marker bits
    const dtsNextAu =
      (BigInt((data[offset] >> 1) & 0x07) << 30n) |
      (BigInt(data[offset + 1]) << 22n) |
      (BigInt((data[offset + 2] >> 1) & 0x7f) << 15n) |
      (BigInt(data[offset + 3]) << 7n) |
      (BigInt((data[offset + 4] >> 1) & 0x7f));

    extension.seamlessSplice = {
      spliceType,
      dtsNextAu,
    };
    offset += 5;
  }

  return {
    extension,
    nextOffset: extStart + extLength,
  };
}

/**
 * Validate a MPEG-TS packet
 */
export function validatePacket(packet: TSPacket): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate sync byte
  if (packet.header.syncByte !== 0x47) {
    errors.push({
      field: 'header.syncByte',
      message: 'Sync byte must be 0x47',
      severity: 'error',
    });
  }

  // Validate adaptation field length
  if (packet.adaptationField) {
    const afc = packet.header.adaptationFieldControl;
    const afLength = packet.adaptationField.length;

    if (afc === 0b10 && afLength !== 183) {
      errors.push({
        field: 'adaptationField.length',
        message: 'Adaptation field length must be 183 when AFC=10',
        severity: 'error',
      });
    }

    if (afc === 0b11 && (afLength < 0 || afLength > 183)) {
      errors.push({
        field: 'adaptationField.length',
        message: 'Adaptation field length must be 0-183 when AFC=11',
        severity: 'error',
      });
    }
  }

  // Validate PCR base (33 bits)
  if (packet.adaptationField?.pcr) {
    if (packet.adaptationField.pcr.base >= 1n << 33n) {
      errors.push({
        field: 'adaptationField.pcr.base',
        message: 'PCR base exceeds 33 bits',
        severity: 'error',
      });
    }
  }

  return {
    isValid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Serialize a TSPacket back to bytes
 */
export function serializePacket(packet: TSPacket): Uint8Array {
  const data = new Uint8Array(188);

  // Write header
  data[0] = packet.header.syncByte;
  data[1] =
    (packet.header.transportErrorIndicator ? 0b10000000 : 0) |
    (packet.header.payloadUnitStartIndicator ? 0b01000000 : 0) |
    (packet.header.transportPriority ? 0b00100000 : 0) |
    ((packet.header.pid >> 8) & 0b00011111);
  data[2] = packet.header.pid & 0xff;
  data[3] =
    (packet.header.transportScramblingControl << 6) |
    (packet.header.adaptationFieldControl << 4) |
    packet.header.continuityCounter;

  let offset = 4;

  // Write adaptation field if present
  if (packet.adaptationField) {
    data[offset] = packet.adaptationField.length;
    offset++;

    if (packet.adaptationField.length > 0) {
      const flags =
        (packet.adaptationField.discontinuityIndicator ? 0b10000000 : 0) |
        (packet.adaptationField.randomAccessIndicator ? 0b01000000 : 0) |
        (packet.adaptationField.elementaryStreamPriorityIndicator ? 0b00100000 : 0) |
        (packet.adaptationField.pcrFlag ? 0b00010000 : 0) |
        (packet.adaptationField.opcrFlag ? 0b00001000 : 0) |
        (packet.adaptationField.splicingPointFlag ? 0b00000100 : 0) |
        (packet.adaptationField.transportPrivateDataFlag ? 0b00000010 : 0) |
        (packet.adaptationField.adaptationFieldExtensionFlag ? 0b00000001 : 0);

      data[offset] = flags;
      offset++;

      // Write PCR if present
      if (packet.adaptationField.pcr) {
        const pcr = packet.adaptationField.pcr;
        data[offset] = Number((pcr.base >> 25n) & 0xffn);
        data[offset + 1] = Number((pcr.base >> 17n) & 0xffn);
        data[offset + 2] = Number((pcr.base >> 9n) & 0xffn);
        data[offset + 3] = Number((pcr.base >> 1n) & 0xffn);
        data[offset + 4] =
          (Number(pcr.base & 1n) << 7) | (pcr.reserved << 1) | ((pcr.extension >> 8) & 1);
        data[offset + 5] = pcr.extension & 0xff;
        offset += 6;
      }

      // Write OPCR if present
      if (packet.adaptationField.opcr) {
        const opcr = packet.adaptationField.opcr;
        data[offset] = Number((opcr.base >> 25n) & 0xffn);
        data[offset + 1] = Number((opcr.base >> 17n) & 0xffn);
        data[offset + 2] = Number((opcr.base >> 9n) & 0xffn);
        data[offset + 3] = Number((opcr.base >> 1n) & 0xffn);
        data[offset + 4] =
          (Number(opcr.base & 1n) << 7) | (opcr.reserved << 1) | ((opcr.extension >> 8) & 1);
        data[offset + 5] = opcr.extension & 0xff;
        offset += 6;
      }

      // Write splice countdown if present
      if (
        packet.adaptationField.splicingPointFlag &&
        packet.adaptationField.spliceCountdown !== undefined
      ) {
        data[offset] = packet.adaptationField.spliceCountdown;
        offset++;
      }

      // Write transport private data if present
      if (packet.adaptationField.transportPrivateData) {
        const tpd = packet.adaptationField.transportPrivateData;
        data[offset] = tpd.length;
        offset++;
        data.set(tpd.data, offset);
        offset += tpd.length;
      }

      // Write adaptation field extension if present
      if (packet.adaptationField.extension) {
        const ext = packet.adaptationField.extension;
        data[offset] = ext.length;
        offset++;

        // Extension flags
        const extFlags =
          (ext.ltwFlag ? 0b10000000 : 0) |
          (ext.piecewiseRateFlag ? 0b01000000 : 0) |
          (ext.seamlessSpliceFlag ? 0b00100000 : 0);
        data[offset] = extFlags;
        offset++;

        // Write LTW if present
        if (ext.ltw) {
          const ltwWord = (ext.ltw.validFlag ? 0x8000 : 0) | (ext.ltw.offset & 0x7fff);
          data[offset] = (ltwWord >> 8) & 0xff;
          data[offset + 1] = ltwWord & 0xff;
          offset += 2;
        }

        // Write Piecewise Rate if present
        if (ext.piecewiseRate !== undefined) {
          data[offset] = 0xc0 | ((ext.piecewiseRate >> 16) & 0x3f);
          data[offset + 1] = (ext.piecewiseRate >> 8) & 0xff;
          data[offset + 2] = ext.piecewiseRate & 0xff;
          offset += 3;
        }

        // Write Seamless Splice if present
        if (ext.seamlessSplice) {
          const ss = ext.seamlessSplice;
          const dts = ss.dtsNextAu;

          data[offset] = (ss.spliceType << 4) | (Number((dts >> 30n) & 0x07n) << 1) | 0x01;
          data[offset + 1] = Number((dts >> 22n) & 0xffn);
          data[offset + 2] = (Number((dts >> 15n) & 0x7fn) << 1) | 0x01;
          data[offset + 3] = Number((dts >> 7n) & 0xffn);
          data[offset + 4] = (Number(dts & 0x7fn) << 1) | 0x01;
          offset += 5;
        }
      }

      // Write stuffing bytes
      if (packet.adaptationField.stuffingBytes) {
        data.set(packet.adaptationField.stuffingBytes, offset);
        offset += packet.adaptationField.stuffingBytes.length;
      }
    }
  }

  // Write payload if present
  if (packet.payload) {
    data.set(packet.payload, offset);
  }

  return data;
}
