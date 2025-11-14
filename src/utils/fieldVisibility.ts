import { TSPacket } from '../types/TSPacket';

/**
 * Field visibility rules based on packet structure
 */
export const FieldVisibilityRules = {
  adaptationField: {
    condition: (packet: TSPacket) =>
      packet.header.adaptationFieldControl === 0b10 ||
      packet.header.adaptationFieldControl === 0b11,

    children: {
      pcr: {
        condition: (packet: TSPacket) => packet.adaptationField?.pcrFlag === true,
      },
      opcr: {
        condition: (packet: TSPacket) => packet.adaptationField?.opcrFlag === true,
      },
      spliceCountdown: {
        condition: (packet: TSPacket) =>
          packet.adaptationField?.splicingPointFlag === true,
      },
      transportPrivateData: {
        condition: (packet: TSPacket) =>
          packet.adaptationField?.transportPrivateDataFlag === true,
      },
      extension: {
        condition: (packet: TSPacket) =>
          packet.adaptationField?.adaptationFieldExtensionFlag === true,

        children: {
          ltw: {
            condition: (packet: TSPacket) =>
              packet.adaptationField?.extension?.ltwFlag === true,
          },
          piecewiseRate: {
            condition: (packet: TSPacket) =>
              packet.adaptationField?.extension?.piecewiseRateFlag === true,
          },
          seamlessSplice: {
            condition: (packet: TSPacket) =>
              packet.adaptationField?.extension?.seamlessSpliceFlag === true,
          },
        },
      },
    },
  },

  payload: {
    condition: (packet: TSPacket) =>
      packet.header.adaptationFieldControl === 0b01 ||
      packet.header.adaptationFieldControl === 0b11,
  },
};

/**
 * Check if a field should be visible
 */
export function isFieldVisible(
  packet: TSPacket,
  fieldPath: string
): boolean {
  const parts = fieldPath.split('.');
  let rules: any = FieldVisibilityRules;

  for (const part of parts) {
    if (!rules[part]) return true; // No rule means always visible

    const rule = rules[part];
    if (rule.condition && !rule.condition(packet)) {
      return false;
    }

    rules = rule.children || {};
  }

  return true;
}

/**
 * Get all visible field paths for a packet
 */
export function getVisibleFields(packet: TSPacket): string[] {
  const fields: string[] = ['header'];

  if (isFieldVisible(packet, 'adaptationField')) {
    fields.push('adaptationField');

    if (isFieldVisible(packet, 'adaptationField.pcr')) {
      fields.push('adaptationField.pcr');
    }
    if (isFieldVisible(packet, 'adaptationField.opcr')) {
      fields.push('adaptationField.opcr');
    }
    if (isFieldVisible(packet, 'adaptationField.spliceCountdown')) {
      fields.push('adaptationField.spliceCountdown');
    }
    if (isFieldVisible(packet, 'adaptationField.transportPrivateData')) {
      fields.push('adaptationField.transportPrivateData');
    }
    if (isFieldVisible(packet, 'adaptationField.extension')) {
      fields.push('adaptationField.extension');

      if (isFieldVisible(packet, 'adaptationField.extension.ltw')) {
        fields.push('adaptationField.extension.ltw');
      }
      if (isFieldVisible(packet, 'adaptationField.extension.piecewiseRate')) {
        fields.push('adaptationField.extension.piecewiseRate');
      }
      if (isFieldVisible(packet, 'adaptationField.extension.seamlessSplice')) {
        fields.push('adaptationField.extension.seamlessSplice');
      }
    }
  }

  if (isFieldVisible(packet, 'payload')) {
    fields.push('payload');
  }

  return fields;
}
