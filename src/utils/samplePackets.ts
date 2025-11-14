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

/**
 * Create a packet with Transport Private Data
 */
export function createPacketWithPrivateData(): Uint8Array {
  const packet = new Uint8Array(188);
  packet.fill(0xff);

  // Header
  packet[0] = 0x47; // Sync byte
  packet[1] = 0x41; // TEI=0, PUSI=1, Priority=0
  packet[2] = 0x01; // PID = 257
  packet[3] = 0x30; // TSC=0, AFC=11 (adaptation + payload), CC=0

  // Adaptation Field
  const privateDataLength = 16;
  packet[4] = 1 + 1 + privateDataLength; // AF length = flags(1) + tpd_length(1) + data(16) = 18
  packet[5] = 0x02; // Flags: transport_private_data_flag set

  // Transport Private Data
  packet[6] = privateDataLength; // Length of private data
  // Fill with sample private data
  for (let i = 0; i < privateDataLength; i++) {
    packet[7 + i] = 0x10 + i; // Example: 0x10, 0x11, 0x12, ...
  }

  // Payload starts after adaptation field
  const payloadStart = 4 + 1 + packet[4];
  packet[payloadStart] = 0x00;
  packet[payloadStart + 1] = 0x00;
  packet[payloadStart + 2] = 0x01;
  packet[payloadStart + 3] = 0xc0; // Audio stream

  return packet;
}

/**
 * Create a packet with OPCR and Splice Countdown
 */
export function createPacketWithOPCRAndSplice(): Uint8Array {
  const packet = new Uint8Array(188);
  packet.fill(0xff);

  // Header
  packet[0] = 0x47; // Sync byte
  packet[1] = 0x41; // TEI=0, PUSI=1, Priority=0
  packet[2] = 0x02; // PID = 258
  packet[3] = 0x30; // TSC=0, AFC=11 (adaptation + payload), CC=0

  // Adaptation Field with PCR, OPCR, and Splice Countdown
  packet[4] = 14; // AF length = 1(flags) + 6(PCR) + 6(OPCR) + 1(splice) = 14
  packet[5] = 0x1c; // Flags: PCR + OPCR + Splicing Point flags set (00011100)

  // PCR (6 bytes)
  const pcrBase = 100000n;
  const pcrExtension = 50;
  packet[6] = Number((pcrBase >> 25n) & 0xffn);
  packet[7] = Number((pcrBase >> 17n) & 0xffn);
  packet[8] = Number((pcrBase >> 9n) & 0xffn);
  packet[9] = Number((pcrBase >> 1n) & 0xffn);
  packet[10] = (Number(pcrBase & 1n) << 7) | 0x7e | ((pcrExtension >> 8) & 1);
  packet[11] = pcrExtension & 0xff;

  // OPCR (6 bytes)
  const opcrBase = 99000n;
  const opcrExtension = 25;
  packet[12] = Number((opcrBase >> 25n) & 0xffn);
  packet[13] = Number((opcrBase >> 17n) & 0xffn);
  packet[14] = Number((opcrBase >> 9n) & 0xffn);
  packet[15] = Number((opcrBase >> 1n) & 0xffn);
  packet[16] = (Number(opcrBase & 1n) << 7) | 0x7e | ((opcrExtension >> 8) & 1);
  packet[17] = opcrExtension & 0xff;

  // Splice Countdown (1 byte, signed)
  packet[18] = 0x0a; // 10 packets until splice point

  // Payload
  const payloadStart = 4 + 1 + packet[4];
  packet[payloadStart] = 0x00;
  packet[payloadStart + 1] = 0x00;
  packet[payloadStart + 2] = 0x01;
  packet[payloadStart + 3] = 0xe0; // Video stream

  return packet;
}

/**
 * Create a packet with Adaptation Field Extension (LTW)
 */
export function createPacketWithExtensionLTW(): Uint8Array {
  const packet = new Uint8Array(188);
  packet.fill(0xff);

  // Header
  packet[0] = 0x47; // Sync byte
  packet[1] = 0x41; // TEI=0, PUSI=1, Priority=0
  packet[2] = 0x03; // PID = 259
  packet[3] = 0x30; // TSC=0, AFC=11 (adaptation + payload), CC=0

  // Adaptation Field with Extension
  packet[4] = 5; // AF length = 1(flags) + 1(ext_length) + 1(ext_flags) + 2(LTW) = 5
  packet[5] = 0x01; // Flags: adaptation_field_extension_flag set

  // Adaptation Field Extension
  packet[6] = 3; // Extension length = 1(flags) + 2(LTW) = 3
  packet[7] = 0x80; // Extension flags: ltw_flag set

  // LTW (Legal Time Window) - 2 bytes
  const ltwValid = true;
  const ltwOffset = 12345;
  const ltwWord = (ltwValid ? 0x8000 : 0) | (ltwOffset & 0x7fff);
  packet[8] = (ltwWord >> 8) & 0xff;
  packet[9] = ltwWord & 0xff;

  // Payload
  const payloadStart = 4 + 1 + packet[4];
  packet[payloadStart] = 0x00;
  packet[payloadStart + 1] = 0x00;
  packet[payloadStart + 2] = 0x01;
  packet[payloadStart + 3] = 0xbd; // Private stream

  return packet;
}

/**
 * Create a packet with Adaptation Field Extension (Piecewise Rate)
 */
export function createPacketWithExtensionPiecewiseRate(): Uint8Array {
  const packet = new Uint8Array(188);
  packet.fill(0xff);

  // Header
  packet[0] = 0x47; // Sync byte
  packet[1] = 0x41; // TEI=0, PUSI=1, Priority=0
  packet[2] = 0x04; // PID = 260
  packet[3] = 0x30; // TSC=0, AFC=11 (adaptation + payload), CC=0

  // Adaptation Field with Extension
  packet[4] = 6; // AF length = 1(flags) + 1(ext_length) + 1(ext_flags) + 3(piecewise_rate) = 6
  packet[5] = 0x01; // Flags: adaptation_field_extension_flag set

  // Adaptation Field Extension
  packet[6] = 4; // Extension length = 1(flags) + 3(piecewise_rate) = 4
  packet[7] = 0x40; // Extension flags: piecewise_rate_flag set

  // Piecewise Rate - 3 bytes (22 bits)
  const piecewiseRate = 100000; // Rate in units of 50 bytes/second
  packet[8] = 0xc0 | ((piecewiseRate >> 16) & 0x3f); // Reserved bits + rate[21:16]
  packet[9] = (piecewiseRate >> 8) & 0xff; // rate[15:8]
  packet[10] = piecewiseRate & 0xff; // rate[7:0]

  // Payload
  const payloadStart = 4 + 1 + packet[4];
  packet[payloadStart] = 0x00;
  packet[payloadStart + 1] = 0x00;
  packet[payloadStart + 2] = 0x01;
  packet[payloadStart + 3] = 0xe0; // Video stream

  return packet;
}

/**
 * Create a packet with Adaptation Field Extension (Seamless Splice)
 */
export function createPacketWithExtensionSeamlessSplice(): Uint8Array {
  const packet = new Uint8Array(188);
  packet.fill(0xff);

  // Header
  packet[0] = 0x47; // Sync byte
  packet[1] = 0x41; // TEI=0, PUSI=1, Priority=0
  packet[2] = 0x05; // PID = 261
  packet[3] = 0x30; // TSC=0, AFC=11 (adaptation + payload), CC=0

  // Adaptation Field with Extension
  packet[4] = 8; // AF length = 1(flags) + 1(ext_length) + 1(ext_flags) + 5(seamless_splice) = 8
  packet[5] = 0x01; // Flags: adaptation_field_extension_flag set

  // Adaptation Field Extension
  packet[6] = 6; // Extension length = 1(flags) + 5(seamless_splice) = 6
  packet[7] = 0x20; // Extension flags: seamless_splice_flag set

  // Seamless Splice - 5 bytes
  const spliceType = 0; // Video splice
  const dtsNextAu = 180000n; // DTS value (33 bits)

  // Splice Type (4 bits) + DTS[32:30] (3 bits) + marker bit (1 bit)
  packet[8] = (spliceType << 4) | (Number((dtsNextAu >> 30n) & 0x07n) << 1) | 0x01;
  // DTS[29:22] (8 bits)
  packet[9] = Number((dtsNextAu >> 22n) & 0xffn);
  // DTS[21:15] (7 bits) + marker bit (1 bit)
  packet[10] = (Number((dtsNextAu >> 15n) & 0x7fn) << 1) | 0x01;
  // DTS[14:7] (8 bits)
  packet[11] = Number((dtsNextAu >> 7n) & 0xffn);
  // DTS[6:0] (7 bits) + marker bit (1 bit)
  packet[12] = (Number(dtsNextAu & 0x7fn) << 1) | 0x01;

  // Payload
  const payloadStart = 4 + 1 + packet[4];
  packet[payloadStart] = 0x00;
  packet[payloadStart + 1] = 0x00;
  packet[payloadStart + 2] = 0x01;
  packet[payloadStart + 3] = 0xe0; // Video stream

  return packet;
}

/**
 * Create a complex packet with multiple adaptation field features
 */
export function createComplexPacket(): Uint8Array {
  const packet = new Uint8Array(188);
  packet.fill(0xff);

  // Header
  packet[0] = 0x47; // Sync byte
  packet[1] = 0x41; // TEI=0, PUSI=1, Priority=0
  packet[2] = 0x06; // PID = 262
  packet[3] = 0x30; // TSC=0, AFC=11 (adaptation + payload), CC=0

  // Adaptation Field with multiple features
  // PCR (6) + OPCR (6) + Splice (1) + Private Data (1 + 8) = 22 bytes
  packet[4] = 23; // AF length
  packet[5] = 0xfe; // All flags set except extension (11111110)

  let offset = 6;

  // PCR
  const pcrBase = 200000n;
  const pcrExtension = 100;
  packet[offset++] = Number((pcrBase >> 25n) & 0xffn);
  packet[offset++] = Number((pcrBase >> 17n) & 0xffn);
  packet[offset++] = Number((pcrBase >> 9n) & 0xffn);
  packet[offset++] = Number((pcrBase >> 1n) & 0xffn);
  packet[offset++] = (Number(pcrBase & 1n) << 7) | 0x7e | ((pcrExtension >> 8) & 1);
  packet[offset++] = pcrExtension & 0xff;

  // OPCR
  const opcrBase = 199000n;
  const opcrExtension = 50;
  packet[offset++] = Number((opcrBase >> 25n) & 0xffn);
  packet[offset++] = Number((opcrBase >> 17n) & 0xffn);
  packet[offset++] = Number((opcrBase >> 9n) & 0xffn);
  packet[offset++] = Number((opcrBase >> 1n) & 0xffn);
  packet[offset++] = (Number(opcrBase & 1n) << 7) | 0x7e | ((opcrExtension >> 8) & 1);
  packet[offset++] = opcrExtension & 0xff;

  // Splice Countdown
  packet[offset++] = 15; // 15 packets until splice

  // Transport Private Data
  const privateDataLength = 8;
  packet[offset++] = privateDataLength;
  for (let i = 0; i < privateDataLength; i++) {
    packet[offset++] = 0xa0 + i; // Custom private data
  }

  // Payload
  const payloadStart = 4 + 1 + packet[4];
  packet[payloadStart] = 0x00;
  packet[payloadStart + 1] = 0x00;
  packet[payloadStart + 2] = 0x01;
  packet[payloadStart + 3] = 0xe0; // Video stream

  return packet;
}
