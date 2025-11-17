import React from 'react';
import { Typography } from 'antd';

const { Text, Paragraph } = Typography;

/**
 * MPEG-TS field help text and tooltips based on ISO/IEC 13818-1 standard
 */

export interface FieldHelp {
  title: string;
  description: React.ReactNode;
  technicalDetails?: string;
  standardReference?: string;
}

export const fieldHelp: Record<string, FieldHelp> = {
  // Header Fields
  syncByte: {
    title: 'Sync Byte',
    description: (
      <>
        <Paragraph>Fixed 8-bit field with value 0x47 (71 decimal).</Paragraph>
        <Paragraph>
          Used to identify the start of each MPEG-TS packet. Decoders search for this
          byte to find packet boundaries in the transport stream.
        </Paragraph>
      </>
    ),
    technicalDetails: 'Must always be 0x47',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.2',
  },

  transportErrorIndicator: {
    title: 'Transport Error Indicator (TEI)',
    description: (
      <>
        <Paragraph>1-bit flag indicating uncorrectable errors in the packet.</Paragraph>
        <Paragraph>
          When set to 1, indicates that at least one uncorrectable bit error exists in
          the associated transport packet. Set by the transmission medium.
        </Paragraph>
      </>
    ),
    technicalDetails: '0 = No error, 1 = Error detected',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.2',
  },

  payloadUnitStartIndicator: {
    title: 'Payload Unit Start Indicator (PUSI)',
    description: (
      <>
        <Paragraph>
          1-bit flag indicating if this packet contains the start of a PES packet or PSI
          section.
        </Paragraph>
        <Paragraph>
          When set to 1 for PES: packet contains the first byte of a PES packet.
          <br />
          When set to 1 for PSI: payload starts with the first byte of a PSI section.
        </Paragraph>
      </>
    ),
    technicalDetails: '0 = Not start, 1 = Packet starts here',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.2',
  },

  transportPriority: {
    title: 'Transport Priority',
    description: (
      <>
        <Paragraph>
          1-bit indicator of packet priority relative to other packets with the same PID.
        </Paragraph>
        <Paragraph>
          When set to 1, this packet has higher priority than packets with the same PID
          where this bit is 0. Useful for prioritizing important data during congestion.
        </Paragraph>
      </>
    ),
    technicalDetails: '0 = Normal priority, 1 = Higher priority',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.2',
  },

  pid: {
    title: 'Packet Identifier (PID)',
    description: (
      <>
        <Paragraph>
          13-bit field indicating the type of data in the packet payload.
        </Paragraph>
        <Paragraph>
          Special PIDs:
          <br />• 0x0000: Program Association Table (PAT)
          <br />• 0x0001: Conditional Access Table (CAT)
          <br />• 0x0002: Transport Stream Description Table
          <br />• 0x1FFF: Null packets (stuffing)
          <br />
          Other values identify elementary streams (video, audio, data).
        </Paragraph>
      </>
    ),
    technicalDetails: 'Range: 0x0000 - 0x1FFF (0-8191)',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.2',
  },

  transportScramblingControl: {
    title: 'Transport Scrambling Control',
    description: (
      <>
        <Paragraph>2-bit field indicating scrambling mode of the payload.</Paragraph>
        <Paragraph>
          Values:
          <br />• 00: Not scrambled
          <br />• 01: Reserved for future use
          <br />• 10: Scrambled with even key
          <br />• 11: Scrambled with odd key
        </Paragraph>
      </>
    ),
    technicalDetails: '00 = Clear, 10/11 = Scrambled',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.2',
  },

  adaptationFieldControl: {
    title: 'Adaptation Field Control (AFC)',
    description: (
      <>
        <Paragraph>
          2-bit field indicating the presence of adaptation field and/or payload.
        </Paragraph>
        <Paragraph>
          Values:
          <br />• 00: Reserved (invalid)
          <br />• 01: Payload only
          <br />• 10: Adaptation field only
          <br />• 11: Adaptation field followed by payload
        </Paragraph>
      </>
    ),
    technicalDetails: '01 = Payload only, 10 = AF only, 11 = Both',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.2',
  },

  continuityCounter: {
    title: 'Continuity Counter (CC)',
    description: (
      <>
        <Paragraph>
          4-bit counter incremented for each packet with the same PID containing payload.
        </Paragraph>
        <Paragraph>
          Wraps around from 15 to 0. Used to detect lost or duplicated packets. Only
          increments when payload is present (AFC = 01 or 11).
        </Paragraph>
        <Paragraph>
          Discontinuities may occur due to channel changes, stream multiplexing, or when
          the discontinuity indicator is set in the adaptation field.
        </Paragraph>
      </>
    ),
    technicalDetails: 'Range: 0-15 (wraps around)',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.2',
  },

  // Adaptation Field
  discontinuityIndicator: {
    title: 'Discontinuity Indicator',
    description: (
      <>
        <Paragraph>
          1-bit flag indicating discontinuity in the continuity counter or PCR.
        </Paragraph>
        <Paragraph>
          When set to 1, indicates that the current packet is in a discontinuity state
          with respect to either the continuity counter or the PCR. Used during channel
          switches or stream splicing.
        </Paragraph>
      </>
    ),
    technicalDetails: '0 = Continuous, 1 = Discontinuity',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.4',
  },

  randomAccessIndicator: {
    title: 'Random Access Indicator',
    description: (
      <>
        <Paragraph>
          1-bit flag indicating that this packet contains data suitable for starting
          decoding.
        </Paragraph>
        <Paragraph>
          When set to 1, the next PES packet in the payload contains an elementary stream
          access point. For video, this typically means an I-frame (intra-coded frame).
        </Paragraph>
      </>
    ),
    technicalDetails: '0 = No access point, 1 = Access point present',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.4',
  },

  elementaryStreamPriorityIndicator: {
    title: 'Elementary Stream Priority Indicator',
    description: (
      <>
        <Paragraph>
          1-bit flag indicating priority of this elementary stream data.
        </Paragraph>
        <Paragraph>
          When set to 1, the payload has higher priority compared to other payloads of
          the same PID where this indicator is 0.
        </Paragraph>
      </>
    ),
    technicalDetails: '0 = Normal, 1 = Higher priority',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.4',
  },

  pcr: {
    title: 'Program Clock Reference (PCR)',
    description: (
      <>
        <Paragraph>48-bit field providing timing reference for the decoder.</Paragraph>
        <Paragraph>
          Consists of two parts:
          <br />• PCR Base: 33 bits (increments at 90 kHz)
          <br />• PCR Extension: 9 bits (increments at 27 MHz)
        </Paragraph>
        <Paragraph>
          Used for synchronizing decoder clock with encoder clock. PCR values should be
          transmitted at least every 100ms for a given program.
        </Paragraph>
      </>
    ),
    technicalDetails: 'Base: 90kHz, Extension: 27MHz, 6 bytes total',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.4',
  },

  opcr: {
    title: 'Original Program Clock Reference (OPCR)',
    description: (
      <>
        <Paragraph>
          48-bit field similar to PCR but represents the original timing before
          remultiplexing.
        </Paragraph>
        <Paragraph>
          Used in remultiplexing scenarios to preserve the original program timing
          information. Helps maintain synchronization when combining multiple streams.
        </Paragraph>
      </>
    ),
    technicalDetails: 'Same format as PCR, used in remultiplexing',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.4',
  },

  spliceCountdown: {
    title: 'Splice Countdown',
    description: (
      <>
        <Paragraph>
          8-bit field counting down to a splice point for stream switching.
        </Paragraph>
        <Paragraph>
          Indicates the number of packets to the splice point. Decrements with each
          packet. When it reaches zero, a splice (stream switch) may occur.
        </Paragraph>
        <Paragraph>
          Used in advertising insertion, program switching, and emergency broadcast
          systems.
        </Paragraph>
      </>
    ),
    technicalDetails: 'Counts down packets to splice point',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.4',
  },

  transportPrivateData: {
    title: 'Transport Private Data',
    description: (
      <>
        <Paragraph>
          Variable-length field for private data not defined by the MPEG standard.
        </Paragraph>
        <Paragraph>
          Can contain up to 255 bytes of custom data. Used by broadcasters for
          proprietary information, conditional access systems, or application-specific
          data.
        </Paragraph>
      </>
    ),
    technicalDetails: 'User-defined, max 255 bytes',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.4',
  },

  // Adaptation Field Extension
  ltw: {
    title: 'Legal Time Window (LTW)',
    description: (
      <>
        <Paragraph>
          Indicates the time window during which data is valid for legal playback.
        </Paragraph>
        <Paragraph>
          Consists of:
          <br />• Valid flag: Indicates if LTW is valid
          <br />• Offset: 15-bit value specifying the legal time window
        </Paragraph>
        <Paragraph>Used in professional broadcasting for legal buffer management.</Paragraph>
      </>
    ),
    technicalDetails: '1 bit valid flag + 15 bits offset',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.5',
  },

  piecewiseRate: {
    title: 'Piecewise Rate',
    description: (
      <>
        <Paragraph>
          22-bit field indicating the bitrate of the transport stream in units of 50
          bytes/second.
        </Paragraph>
        <Paragraph>
          Used to signal changes in the bitrate of the transport stream. Helpful for
          adaptive streaming and buffer management at the decoder.
        </Paragraph>
      </>
    ),
    technicalDetails: 'Units: 50 bytes/sec, 22 bits',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.5',
  },

  seamlessSplice: {
    title: 'Seamless Splice',
    description: (
      <>
        <Paragraph>
          Provides timing information for seamless switching between streams.
        </Paragraph>
        <Paragraph>
          Contains:
          <br />• Splice Type: 4 bits indicating the type of splice
          <br />• DTS Next AU: 33 bits with the DTS of the next access unit
        </Paragraph>
        <Paragraph>
          Enables frame-accurate splicing for smooth transitions between video/audio
          sources without artifacts.
        </Paragraph>
      </>
    ),
    technicalDetails: '4-bit type + 33-bit DTS',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.5',
  },

  stuffingBytes: {
    title: 'Stuffing Bytes',
    description: (
      <>
        <Paragraph>
          Padding bytes (all 0xFF) used to fill the adaptation field to reach the
          required packet size.
        </Paragraph>
        <Paragraph>
          MPEG-TS packets must be exactly 188 bytes. Stuffing bytes are added when the
          actual data doesn't fill the entire packet. Decoders simply discard these
          bytes.
        </Paragraph>
      </>
    ),
    technicalDetails: 'All bytes set to 0xFF',
    standardReference: 'ISO/IEC 13818-1 Section 2.4.3.4',
  },
};

/**
 * Get help text for a specific field
 */
export function getFieldHelp(fieldName: string): FieldHelp | undefined {
  return fieldHelp[fieldName];
}

/**
 * Get help tooltip content for a field
 */
export function getFieldTooltip(fieldName: string): React.ReactNode {
  const help = fieldHelp[fieldName];
  if (!help) return null;

  return (
    <div style={{ maxWidth: 400 }}>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        {help.title}
      </Text>
      <div>{help.description}</div>
      {help.technicalDetails && (
        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
          {help.technicalDetails}
        </Text>
      )}
      {help.standardReference && (
        <Text
          type="secondary"
          italic
          style={{ display: 'block', marginTop: 4, fontSize: 11 }}
        >
          {help.standardReference}
        </Text>
      )}
    </div>
  );
}
