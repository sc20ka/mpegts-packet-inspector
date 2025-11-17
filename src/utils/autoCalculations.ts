import { TSPacket } from '../types/TSPacket';

/**
 * Auto-calculation utilities for MPEG-TS packets
 */

/**
 * Calculate adaptation field length based on its contents
 */
export function calculateAdaptationFieldLength(packet: TSPacket): number {
  if (!packet.adaptationField) return 0;

  let length = 1; // Flags byte

  // PCR: 6 bytes
  if (packet.adaptationField.pcrFlag && packet.adaptationField.pcr) {
    length += 6;
  }

  // OPCR: 6 bytes
  if (packet.adaptationField.opcrFlag && packet.adaptationField.opcr) {
    length += 6;
  }

  // Splice Countdown: 1 byte
  if (packet.adaptationField.splicingPointFlag && packet.adaptationField.spliceCountdown !== undefined) {
    length += 1;
  }

  // Transport Private Data: 1 (length) + data length
  if (packet.adaptationField.transportPrivateDataFlag && packet.adaptationField.transportPrivateData) {
    length += 1 + packet.adaptationField.transportPrivateData.length;
  }

  // Adaptation Field Extension: 1 (length) + extension length
  if (packet.adaptationField.adaptationFieldExtensionFlag && packet.adaptationField.extension) {
    length += 1 + packet.adaptationField.extension.length;
  }

  // Stuffing bytes
  if (packet.adaptationField.stuffingBytes) {
    length += packet.adaptationField.stuffingBytes.length;
  }

  return length;
}

/**
 * Calculate adaptation field extension length based on its contents
 */
export function calculateExtensionLength(extension: NonNullable<TSPacket['adaptationField']>['extension']): number {
  if (!extension) return 0;

  let length = 1; // Flags byte

  // LTW: 2 bytes
  if (extension.ltwFlag && extension.ltw) {
    length += 2;
  }

  // Piecewise Rate: 3 bytes
  if (extension.piecewiseRateFlag && extension.piecewiseRate !== undefined) {
    length += 3;
  }

  // Seamless Splice: 5 bytes
  if (extension.seamlessSpliceFlag && extension.seamlessSplice) {
    length += 5;
  }

  return length;
}

/**
 * Auto-update packet with calculated lengths
 */
export function autoUpdateLengths(packet: TSPacket): TSPacket {
  const updated = JSON.parse(JSON.stringify(packet)); // Deep clone

  // Update adaptation field extension length
  if (updated.adaptationField?.extension) {
    updated.adaptationField.extension.length = calculateExtensionLength(updated.adaptationField.extension);
  }

  // Update adaptation field length
  if (updated.adaptationField) {
    updated.adaptationField.length = calculateAdaptationFieldLength(updated);
  }

  return updated;
}

/**
 * Calculate next continuity counter
 */
export function calculateNextContinuityCounter(currentCC: number): number {
  return (currentCC + 1) & 0x0f; // 4-bit counter (0-15)
}

/**
 * Calculate PCR time in microseconds
 */
export function calculatePCRTime(pcr: { base: bigint; extension: number }): number {
  // PCR = base * 300 + extension
  // Time in microseconds = PCR / 27
  const pcrValue = pcr.base * 300n + BigInt(pcr.extension);
  return Number((pcrValue * 1000000n) / 27000000n);
}

/**
 * Calculate PCR from time in microseconds
 */
export function calculatePCRFromTime(timeUs: number): { base: bigint; extension: number } {
  const pcrValue = BigInt(Math.round((timeUs * 27000000) / 1000000));
  const base = pcrValue / 300n;
  const extension = Number(pcrValue % 300n);

  return { base, extension };
}

/**
 * Calculate total packet size distribution
 */
export function calculatePacketSizes(packet: TSPacket): {
  header: number;
  adaptationField: number;
  payload: number;
  stuffing: number;
  total: number;
} {
  const header = 4;
  const adaptationField = packet.adaptationField ? packet.adaptationField.length + 1 : 0;
  const payload = packet.payload?.length || 0;
  const stuffing = packet.adaptationField?.stuffingBytes.length || 0;
  const total = 188;

  return { header, adaptationField, payload, stuffing, total };
}

/**
 * Calculate required stuffing bytes
 */
export function calculateRequiredStuffing(packet: TSPacket): number {
  const sizes = calculatePacketSizes(packet);
  const used = sizes.header + sizes.adaptationField + sizes.payload;
  return Math.max(0, 188 - used);
}

/**
 * Auto-add stuffing bytes to make packet 188 bytes
 */
export function autoAddStuffing(packet: TSPacket): TSPacket {
  const updated = JSON.parse(JSON.stringify(packet));
  const requiredStuffing = calculateRequiredStuffing(updated);

  if (requiredStuffing > 0 && updated.adaptationField) {
    updated.adaptationField.stuffingBytes = new Uint8Array(requiredStuffing).fill(0xff);
    updated.adaptationField.length = calculateAdaptationFieldLength(updated);
  }

  return updated;
}

/**
 * Validate packet length constraints
 */
export function validatePacketLength(packet: TSPacket): { valid: boolean; message?: string } {
  const sizes = calculatePacketSizes(packet);

  if (sizes.header + sizes.adaptationField + sizes.payload > 188) {
    return {
      valid: false,
      message: `Packet too large: ${sizes.header + sizes.adaptationField + sizes.payload} bytes (max 188)`,
    };
  }

  if (packet.header.adaptationFieldControl === 0b10 && packet.adaptationField?.length !== 183) {
    return {
      valid: false,
      message: `Adaptation field must be 183 bytes when AFC=10 (currently ${packet.adaptationField?.length})`,
    };
  }

  return { valid: true };
}
