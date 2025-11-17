import { TSPacket } from '../types/TSPacket';

export interface PacketTemplate {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'user';
  packet: TSPacket;
  tags?: string[];
}

/**
 * Get all saved templates from localStorage
 */
export function getSavedTemplates(): PacketTemplate[] {
  try {
    const stored = localStorage.getItem('mpegts-templates');
    if (!stored) return [];

    const templates = JSON.parse(stored);

    // Reconstruct bigint and Uint8Array values
    return templates.map((t: any) => ({
      ...t,
      packet: reconstructPacket(t.packet),
    }));
  } catch (error) {
    console.error('Failed to load templates:', error);
    return [];
  }
}

/**
 * Save a template to localStorage
 */
export function saveTemplate(template: PacketTemplate): void {
  try {
    const templates = getSavedTemplates();

    // Check if template with same ID exists
    const existingIndex = templates.findIndex(t => t.id === template.id);

    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }

    // Serialize for storage
    const serialized = templates.map(t => ({
      ...t,
      packet: serializePacketForStorage(t.packet),
    }));

    localStorage.setItem('mpegts-templates', JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save template:', error);
    throw new Error('Failed to save template to localStorage');
  }
}

/**
 * Delete a template from localStorage
 */
export function deleteTemplate(id: string): void {
  try {
    const templates = getSavedTemplates();
    const filtered = templates.filter(t => t.id !== id);

    const serialized = filtered.map(t => ({
      ...t,
      packet: serializePacketForStorage(t.packet),
    }));

    localStorage.setItem('mpegts-templates', JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to delete template:', error);
    throw new Error('Failed to delete template');
  }
}

/**
 * Create a new template from a packet
 */
export function createTemplateFromPacket(
  packet: TSPacket,
  name: string,
  description: string,
  tags?: string[]
): PacketTemplate {
  return {
    id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    category: 'user',
    packet: JSON.parse(JSON.stringify(packet)), // Deep clone
    tags,
  };
}

/**
 * Get predefined system templates
 */
export function getSystemTemplates(): PacketTemplate[] {
  // Note: These would reference the sample packets from samplePackets.ts
  // For now, return empty array - the actual implementation would create
  // PacketTemplate objects from the sample packets
  return [];
}

/**
 * Serialize packet for localStorage (convert bigint and Uint8Array)
 */
function serializePacketForStorage(packet: TSPacket): any {
  return JSON.parse(JSON.stringify(packet, (_key: string, value: any) => {
    if (typeof value === 'bigint') {
      return { __type: 'bigint', value: value.toString() };
    }
    if (value instanceof Uint8Array) {
      return { __type: 'Uint8Array', data: Array.from(value) };
    }
    return value;
  }));
}

/**
 * Reconstruct packet from localStorage (restore bigint and Uint8Array)
 */
function reconstructPacket(data: any): TSPacket {
  return JSON.parse(JSON.stringify(data), (_key: string, value: any) => {
    if (value && typeof value === 'object') {
      if (value.__type === 'bigint') {
        return BigInt(value.value);
      }
      if (value.__type === 'Uint8Array') {
        return new Uint8Array(value.data);
      }
    }
    return value;
  });
}

/**
 * Export templates to JSON file
 */
export function exportTemplates(templates: PacketTemplate[]): string {
  const serialized = templates.map(t => ({
    ...t,
    packet: serializePacketForStorage(t.packet),
  }));

  return JSON.stringify(serialized, null, 2);
}

/**
 * Import templates from JSON string
 */
export function importTemplates(jsonString: string): PacketTemplate[] {
  try {
    const parsed = JSON.parse(jsonString);

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid template file: expected array');
    }

    return parsed.map((t: any) => ({
      ...t,
      packet: reconstructPacket(t.packet),
    }));
  } catch (error) {
    console.error('Failed to import templates:', error);
    throw new Error('Invalid template file format');
  }
}
