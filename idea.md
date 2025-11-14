# 🔧 mpegts-packet-inspector - Technical Specification

## Core Components Specification

### 1. Packet Parser Module

```typescript
interface TSPacket {
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
```

### 2. Visual Component Architecture

```typescript
// Dynamic field visibility rules
const FieldVisibilityRules = {
  adaptationField: {
    condition: (packet: TSPacket) => 
      packet.header.adaptationFieldControl === 0b10 || 
      packet.header.adaptationFieldControl === 0b11,
    
    children: {
      pcr: {
        condition: (packet: TSPacket) => 
          packet.adaptationField?.pcrFlag === true
      },
      opcr: {
        condition: (packet: TSPacket) => 
          packet.adaptationField?.opcrFlag === true
      },
      spliceCountdown: {
        condition: (packet: TSPacket) => 
          packet.adaptationField?.splicingPointFlag === true
      },
      transportPrivateData: {
        condition: (packet: TSPacket) => 
          packet.adaptationField?.transportPrivateDataFlag === true
      },
      extension: {
        condition: (packet: TSPacket) => 
          packet.adaptationField?.adaptationFieldExtensionFlag === true
      }
    }
  },
  
  payload: {
    condition: (packet: TSPacket) => 
      packet.header.adaptationFieldControl === 0b01 || 
      packet.header.adaptationFieldControl === 0b11
  }
};
```

### 3. Interactive Editor Components

```typescript
interface BitEditorProps {
  value: number;
  bits: number;
  onChange: (newValue: number) => void;
  labels?: string[];
  descriptions?: LocalizedString;
}

interface FieldEditorProps {
  field: PacketField;
  value: any;
  onChange: (newValue: any) => void;
  validation?: ValidationRule[];
  suggestions?: any[];
}

interface HexEditorProps {
  data: Uint8Array;
  highlights: HighlightRegion[];
  editable: boolean;
  onChange: (offset: number, value: number) => void;
  onSelect: (start: number, end: number) => void;
}
```

### 4. Validation Rules

```typescript
const ValidationRules = {
  syncByte: {
    validate: (value: number) => value === 0x47,
    error: 'Sync byte must be 0x47',
    severity: 'error'
  },
  
  continuityCounter: {
    validate: (current: number, previous?: number) => {
      if (previous === undefined) return true;
      return current === ((previous + 1) & 0x0F);
    },
    error: 'Continuity counter error',
    severity: 'warning'
  },
  
  adaptationFieldLength: {
    validate: (length: number, afc: number) => {
      if (afc === 0b10) return length === 183;
      if (afc === 0b11) return length >= 0 && length <= 183;
      return true;
    },
    error: 'Invalid adaptation field length',
    severity: 'error'
  },
  
  pcrBase: {
    validate: (value: bigint) => value < (1n << 33n),
    error: 'PCR base exceeds 33 bits',
    severity: 'error'
  }
};
```

### 5. Auto-calculation Functions

```typescript
class AutoCalculator {
  static updateAdaptationFieldLength(packet: TSPacket): void {
    if (!packet.adaptationField) return;
    
    let length = 1; // flags byte
    
    if (packet.adaptationField.pcrFlag) length += 6;
    if (packet.adaptationField.opcrFlag) length += 6;
    if (packet.adaptationField.splicingPointFlag) length += 1;
    if (packet.adaptationField.transportPrivateDataFlag) {
      length += 1 + (packet.adaptationField.transportPrivateData?.length || 0);
    }
    if (packet.adaptationField.adaptationFieldExtensionFlag) {
      length += 1 + (packet.adaptationField.extension?.length || 0);
    }
    
    packet.adaptationField.length = length;
  }
  
  static calculatePCRTime(pcr: { base: bigint, extension: number }): number {
    // PCR = base * 300 + extension
    // Time in microseconds = PCR / 27
    const pcrValue = pcr.base * 300n + BigInt(pcr.extension);
    return Number(pcrValue * 1000000n / 27000000n);
  }
  
  static calculateStuffingBytes(packet: TSPacket): number {
    const headerSize = 4;
    const afSize = packet.adaptationField ? 
      packet.adaptationField.length + 1 : 0;
    const payloadSize = packet.payload?.length || 0;
    
    return 188 - headerSize - afSize - payloadSize;
  }
}
```

### 6. Localization Structure

```typescript
interface Localization {
  fields: {
    [fieldName: string]: {
      name: string;
      description: string;
      tooltip?: string;
      values?: {
        [value: string]: string;
      };
    };
  };
  
  messages: {
    errors: {
      [errorCode: string]: string;
    };
    warnings: {
      [warningCode: string]: string;
    };
    info: {
      [infoCode: string]: string;
    };
  };
  
  ui: {
    buttons: { [key: string]: string };
    labels: { [key: string]: string };
    placeholders: { [key: string]: string };
  };
}
```

### 7. State Management

```typescript
interface AppState {
  packet: TSPacket | null;
  
  ui: {
    mode: 'visual' | 'hex' | 'inspector' | 'analysis';
    language: 'en' | 'ru';
    theme: 'light' | 'dark';
    expandedFields: string[];
    highlightedField: string | null;
  };
  
  editor: {
    isDirty: boolean;
    history: TSPacket[];
    historyIndex: number;
    clipboardData: any | null;
  };
  
  validation: {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
  
  stream: {
    packets: TSPacket[];
    currentIndex: number;
    filter: {
      pids: number[];
      hasErrors: boolean;
      hasAdaptation: boolean;
    };
  };
}
```

### 8. API Endpoints (for future backend)

```typescript
interface API {
  // Parser endpoints
  '/api/parse': {
    POST: {
      body: { data: string | ArrayBuffer };
      response: TSPacket;
    };
  };
  
  // Validation endpoints
  '/api/validate': {
    POST: {
      body: TSPacket;
      response: ValidationResult;
    };
  };
  
  // Stream analysis
  '/api/stream/analyze': {
    POST: {
      body: { url: string };
      response: StreamAnalysis;
    };
  };
  
  // Export formats
  '/api/export': {
    POST: {
      body: {
        packet: TSPacket;
        format: 'json' | 'c' | 'python' | 'wireshark';
      };
      response: string;
    };
  };
}
```

### 9. PWA Configuration

```json
{
  "name": "mpegts-packet-inspector",
  "short_name": "ts-pckg-inspector",
  "description": "MPEG-TS packet analyzer and editor",
  "theme_color": "#1976d2",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "landscape",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "features": [
    "offline-capable",
    "installable",
    "file-handling"
  ]
}
```

### 10. Performance Optimizations

```typescript
// Use React.memo for expensive components
const PacketVisualizer = React.memo(({ packet, onChange }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for re-render optimization
  return prevProps.packet === nextProps.packet;
});

// Use virtualization for large packet lists
import { FixedSizeList } from 'react-window';

const PacketList = ({ packets }) => (
  <FixedSizeList
    height={600}
    itemCount={packets.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => (
      <PacketListItem 
        style={style}
        packet={packets[index]}
      />
    )}
  </FixedSizeList>
);

// Web Worker for heavy parsing
// parser.worker.ts
self.addEventListener('message', (e) => {
  const { data, action } = e.data;
  
  switch (action) {
    case 'parse':
      const packet = parsePacket(data);
      self.postMessage({ action: 'parsed', packet });
      break;
    
    case 'validate':
      const errors = validatePacket(data);
      self.postMessage({ action: 'validated', errors });
      break;
  }
});
```

## Development Phases

### Phase 1: MVP (Week 1-2)
- [ ] Basic packet parser
- [ ] Simple visual display
- [ ] Header field editing
- [ ] Hex view

### Phase 2: Core Features (Week 3-4)
- [ ] Adaptation field support
- [ ] Dynamic field visibility
- [ ] Bit-level editor
- [ ] Basic validation

### Phase 3: Enhanced UX (Week 5-6)
- [ ] Multilingual support
- [ ] Interactive tooltips
- [ ] Auto-calculations
- [ ] Undo/Redo

### Phase 4: Advanced Features (Week 7-8)
- [ ] Stream analysis
- [ ] Export/Import
- [ ] PWA support
- [ ] Performance optimization

## Testing Strategy

```typescript
// Unit tests for parser
describe('TSPacketParser', () => {
  it('should parse valid packet header', () => {
    const data = new Uint8Array([0x47, 0x40, 0x00, 0x10, ...]);
    const packet = parsePacket(data);
    
    expect(packet.header.syncByte).toBe(0x47);
    expect(packet.header.pid).toBe(0);
    expect(packet.header.continuityCounter).toBe(0);
  });
  
  it('should handle adaptation field', () => {
    // Test implementation
  });
});

// Integration tests for UI
describe('PacketVisualizer', () => {
  it('should show adaptation field when AFC = 10', () => {
    // Test implementation
  });
  
  it('should hide payload when AFC = 10', () => {
    // Test implementation
  });
});
```

## Deployment Configuration

```yaml
# vite.config.ts
export default defineConfig({
  base: '/mpegts-packet-inspector/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'parser': ['./src/lib/mpegts-parser'],
          'ui': ['antd', '@ant-design/icons'],
        }
      }
    }
  }
});
```

---

Ready to start development! 🚀