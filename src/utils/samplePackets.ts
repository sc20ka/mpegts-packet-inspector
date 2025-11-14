/**
 * Generate sample MPEG-TS packets for testing
 */

/**
 * Create a simple PAT packet (PID 0)
 */
export function createSamplePATPacket(): Uint8Array {
  const packet = new Uint8Array(188);
  packet.fill(0xff); // Fill with stuffing bytes

  // Header
  packet[0] = 0x47; // Sync byte
  packet[1] = 0x40; // TEI=0, PUSI=1, Priority=0, PID high bits = 0
  packet[2] = 0x00; // PID low bits = 0 (PAT)
  packet[3] = 0x10; // TSC=0, AFC=01 (payload only), CC=0

  // Payload - Simple PAT table
  packet[4] = 0x00; // Pointer field
  packet[5] = 0x00; // Table ID (PAT)
  packet[6] = 0xb0; // Section syntax indicator, reserved
  packet[7] = 0x0d; // Section length

  return packet;
}

/**
 * Create a packet with adaptation field and PCR
 */
export function createSamplePacketWithPCR(): Uint8Array {
  const packet = new Uint8Array(188);
  packet.fill(0xff); // Fill with stuffing bytes

  // Header
  packet[0] = 0x47; // Sync byte
  packet[1] = 0x41; // TEI=0, PUSI=1, Priority=0, PID high bits
  packet[2] = 0x00; // PID = 256
  packet[3] = 0x30; // TSC=0, AFC=11 (adaptation + payload), CC=0

  // Adaptation Field
  packet[4] = 0x07; // Adaptation field length = 7 bytes
  packet[5] = 0x10; // Flags: PCR flag set

  // PCR (6 bytes)
  // Example PCR value: base = 90000, extension = 0
  const pcrBase = 90000n;
  const pcrExtension = 0;

  packet[6] = Number((pcrBase >> 25n) & 0xffn);
  packet[7] = Number((pcrBase >> 17n) & 0xffn);
  packet[8] = Number((pcrBase >> 9n) & 0xffn);
  packet[9] = Number((pcrBase >> 1n) & 0xffn);
  packet[10] = (Number(pcrBase & 1n) << 7) | 0x7e | ((pcrExtension >> 8) & 1);
  packet[11] = pcrExtension & 0xff;

  // Payload starts at byte 12
  packet[12] = 0x00;
  packet[13] = 0x00;
  packet[14] = 0x01;
  packet[15] = 0xe0; // PES start code

  return packet;
}

/**
 * Create a null packet (PID 0x1FFF)
 */
export function createNullPacket(): Uint8Array {
  const packet = new Uint8Array(188);
  packet.fill(0xff);

  // Header
  packet[0] = 0x47; // Sync byte
  packet[1] = 0x1f; // TEI=0, PUSI=0, Priority=0, PID high bits
  packet[2] = 0xff; // PID = 0x1FFF (null packet)
  packet[3] = 0x10; // TSC=0, AFC=01 (payload only), CC=0

  return packet;
}

/**
 * Create a packet with only adaptation field (no payload)
 */
export function createAdaptationOnlyPacket(): Uint8Array {
  const packet = new Uint8Array(188);
  packet.fill(0xff);

  // Header
  packet[0] = 0x47; // Sync byte
  packet[1] = 0x41; // TEI=0, PUSI=1, Priority=0
  packet[2] = 0x00; // PID = 256
  packet[3] = 0x20; // TSC=0, AFC=10 (adaptation only), CC=0

  // Adaptation Field (must be 183 bytes when AFC=10)
  packet[4] = 183; // Adaptation field length
  packet[5] = 0x50; // Flags: Random Access Indicator + PCR flag

  // PCR
  const pcrBase = 45000n;
  const pcrExtension = 150;

  packet[6] = Number((pcrBase >> 25n) & 0xffn);
  packet[7] = Number((pcrBase >> 17n) & 0xffn);
  packet[8] = Number((pcrBase >> 9n) & 0xffn);
  packet[9] = Number((pcrBase >> 1n) & 0xffn);
  packet[10] = (Number(pcrBase & 1n) << 7) | 0x7e | ((pcrExtension >> 8) & 1);
  packet[11] = pcrExtension & 0xff;

  // Rest is stuffing (already 0xFF)

  return packet;
}
