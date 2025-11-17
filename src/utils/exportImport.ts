import { TSPacket } from '../types/TSPacket';

/**
 * Export/Import utilities for MPEG-TS packets
 */

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(data: Uint8Array): string {
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert bigint to string for JSON serialization
 */
function bigIntReplacer(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Uint8Array) {
    return {
      __type: 'Uint8Array',
      data: Array.from(value),
    };
  }
  return value;
}

/**
 * Convert string back to bigint for JSON deserialization
 */
function bigIntReviver(_key: string, value: any): any {
  // Check if this looks like a bigint (stored as string)
  if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 15) {
    return BigInt(value);
  }
  if (value && value.__type === 'Uint8Array') {
    return new Uint8Array(value.data);
  }
  return value;
}

/**
 * Export packet to JSON
 */
export function exportToJSON(packet: TSPacket): string {
  return JSON.stringify(packet, bigIntReplacer, 2);
}

/**
 * Import packet from JSON
 */
export function importFromJSON(json: string): TSPacket {
  return JSON.parse(json, bigIntReviver);
}

/**
 * Export packet to C array
 */
export function exportToCArray(packet: TSPacket): string {
  const data = packet.raw;
  let code = '// MPEG-TS Packet\n';
  code += `unsigned char packet[${data.length}] = {\n`;

  for (let i = 0; i < data.length; i += 16) {
    code += '    ';
    for (let j = 0; j < 16 && i + j < data.length; j++) {
      code += `0x${data[i + j].toString(16).padStart(2, '0')}`;
      if (i + j < data.length - 1) code += ', ';
    }
    code += '\n';
  }

  code += '};\n';
  return code;
}

/**
 * Export packet to Python bytes
 */
export function exportToPython(packet: TSPacket): string {
  const data = packet.raw;
  let code = '# MPEG-TS Packet\n';
  code += 'packet = bytes([\n';

  for (let i = 0; i < data.length; i += 16) {
    code += '    ';
    for (let j = 0; j < 16 && i + j < data.length; j++) {
      code += `0x${data[i + j].toString(16).padStart(2, '0')}`;
      if (i + j < data.length - 1) code += ', ';
    }
    code += '\n';
  }

  code += '])\n';
  return code;
}

/**
 * Export packet to hex string
 */
export function exportToHexString(packet: TSPacket): string {
  return uint8ArrayToHex(packet.raw);
}

/**
 * Export packet to detailed text report
 */
export function exportToTextReport(packet: TSPacket): string {
  let report = '═══════════════════════════════════════════════════════════\n';
  report += '           MPEG-TS PACKET INSPECTION REPORT\n';
  report += '═══════════════════════════════════════════════════════════\n\n';

  // Header
  report += '📋 PACKET HEADER\n';
  report += '─────────────────────────────────────────────────────────\n';
  report += `  Sync Byte:                    0x${packet.header.syncByte.toString(16).toUpperCase().padStart(2, '0')}\n`;
  report += `  Transport Error Indicator:    ${packet.header.transportErrorIndicator ? 'YES' : 'NO'}\n`;
  report += `  Payload Unit Start:           ${packet.header.payloadUnitStartIndicator ? 'YES' : 'NO'}\n`;
  report += `  Transport Priority:           ${packet.header.transportPriority ? 'HIGH' : 'NORMAL'}\n`;
  report += `  PID:                          ${packet.header.pid} (0x${packet.header.pid.toString(16).toUpperCase().padStart(4, '0')})\n`;
  report += `  Scrambling Control:           ${packet.header.transportScramblingControl}\n`;
  report += `  Adaptation Field Control:     ${packet.header.adaptationFieldControl} (${getAFCName(packet.header.adaptationFieldControl)})\n`;
  report += `  Continuity Counter:           ${packet.header.continuityCounter}\n\n`;

  // Adaptation Field
  if (packet.adaptationField) {
    report += '🔧 ADAPTATION FIELD\n';
    report += '─────────────────────────────────────────────────────────\n';
    report += `  Length:                       ${packet.adaptationField.length} bytes\n`;
    report += `  Discontinuity Indicator:      ${packet.adaptationField.discontinuityIndicator ? 'YES' : 'NO'}\n`;
    report += `  Random Access Indicator:      ${packet.adaptationField.randomAccessIndicator ? 'YES' : 'NO'}\n`;
    report += `  ES Priority Indicator:        ${packet.adaptationField.elementaryStreamPriorityIndicator ? 'YES' : 'NO'}\n`;
    report += `  PCR Flag:                     ${packet.adaptationField.pcrFlag ? 'YES' : 'NO'}\n`;
    report += `  OPCR Flag:                    ${packet.adaptationField.opcrFlag ? 'YES' : 'NO'}\n`;
    report += `  Splicing Point Flag:          ${packet.adaptationField.splicingPointFlag ? 'YES' : 'NO'}\n`;
    report += `  Transport Private Data Flag:  ${packet.adaptationField.transportPrivateDataFlag ? 'YES' : 'NO'}\n`;
    report += `  Extension Flag:               ${packet.adaptationField.adaptationFieldExtensionFlag ? 'YES' : 'NO'}\n`;

    if (packet.adaptationField.pcr) {
      report += `\n  ⏰ PCR (Program Clock Reference):\n`;
      report += `     Base:                      ${packet.adaptationField.pcr.base}\n`;
      report += `     Extension:                 ${packet.adaptationField.pcr.extension}\n`;
      report += `     Time:                      ${packet.adaptationField.pcr.calculated.toFixed(2)} μs\n`;
    }

    if (packet.adaptationField.opcr) {
      report += `\n  ⏰ OPCR (Original Program Clock Reference):\n`;
      report += `     Base:                      ${packet.adaptationField.opcr.base}\n`;
      report += `     Extension:                 ${packet.adaptationField.opcr.extension}\n`;
    }

    if (packet.adaptationField.spliceCountdown !== undefined) {
      report += `\n  ✂️  Splice Countdown:            ${packet.adaptationField.spliceCountdown}\n`;
    }

    if (packet.adaptationField.transportPrivateData) {
      report += `\n  🔒 Transport Private Data:\n`;
      report += `     Length:                    ${packet.adaptationField.transportPrivateData.length} bytes\n`;
      report += `     Data:                      ${uint8ArrayToHex(packet.adaptationField.transportPrivateData.data)}\n`;
    }

    if (packet.adaptationField.extension) {
      report += `\n  🔧 Adaptation Field Extension:\n`;
      report += `     Length:                    ${packet.adaptationField.extension.length} bytes\n`;

      if (packet.adaptationField.extension.ltw) {
        report += `     LTW Valid:                 ${packet.adaptationField.extension.ltw.validFlag ? 'YES' : 'NO'}\n`;
        report += `     LTW Offset:                ${packet.adaptationField.extension.ltw.offset}\n`;
      }

      if (packet.adaptationField.extension.piecewiseRate !== undefined) {
        report += `     Piecewise Rate:            ${packet.adaptationField.extension.piecewiseRate} (${packet.adaptationField.extension.piecewiseRate * 50} bytes/sec)\n`;
      }

      if (packet.adaptationField.extension.seamlessSplice) {
        report += `     Seamless Splice Type:      ${packet.adaptationField.extension.seamlessSplice.spliceType}\n`;
        report += `     DTS Next AU:               ${packet.adaptationField.extension.seamlessSplice.dtsNextAu}\n`;
      }
    }

    report += `\n  Stuffing Bytes:               ${packet.adaptationField.stuffingBytes.length} bytes\n\n`;
  }

  // Payload
  if (packet.payload) {
    report += '📦 PAYLOAD\n';
    report += '─────────────────────────────────────────────────────────\n';
    report += `  Length:                       ${packet.payload.length} bytes\n`;
    report += `  First 32 bytes (hex):         ${uint8ArrayToHex(packet.payload.slice(0, 32))}\n\n`;
  }

  // Size distribution
  const headerSize = 4;
  const afSize = packet.adaptationField ? packet.adaptationField.length + 1 : 0;
  const payloadSize = packet.payload?.length || 0;

  report += '📊 SIZE DISTRIBUTION\n';
  report += '─────────────────────────────────────────────────────────\n';
  report += `  Header:                       ${headerSize} bytes (${((headerSize / 188) * 100).toFixed(1)}%)\n`;
  report += `  Adaptation Field:             ${afSize} bytes (${((afSize / 188) * 100).toFixed(1)}%)\n`;
  report += `  Payload:                      ${payloadSize} bytes (${((payloadSize / 188) * 100).toFixed(1)}%)\n`;
  report += `  Total:                        188 bytes\n\n`;

  report += '═══════════════════════════════════════════════════════════\n';
  report += '                     END OF REPORT\n';
  report += '═══════════════════════════════════════════════════════════\n';

  return report;
}

function getAFCName(afc: number): string {
  const names = ['Reserved', 'Payload only', 'Adaptation only', 'Adaptation + Payload'];
  return names[afc] || 'Unknown';
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
