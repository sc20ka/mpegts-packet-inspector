# 🔍 mpegts-packet-inspector

WebUI tool for visual analysis and editing of MPEG-TS packages with the ability to work bitwise/byte-by-byte with data.

## Features

### Phase 1: MVP ✅
- **Visual Packet Inspector**: View MPEG-TS packet structure with detailed field breakdown
- **Hex Editor**: Interactive hex viewer with byte-level editing capabilities
- **Multiple Sample Packets**: Pre-built sample packets for testing (PAT, PCR, Null, Adaptation-only)
- **Validation**: Real-time packet validation with error/warning reporting
- **Import/Export**: Load TS files and download modified packets
- **Syntax Highlighting**: Color-coded hex view showing header, adaptation field, and payload

### Phase 2: Core Features ✅ (NEW!)
- **Bit-Level Editor**: Interactive bit editor with visual bit toggles and real-time binary/hex/decimal conversion
- **Field-Level Editing**: Edit packet fields directly in the visual inspector with Input controls
- **Edit Mode Toggle**: Switch between read-only inspection and editable mode
- **Undo/Redo**: Full history management with unlimited undo/redo for all packet modifications
- **Dynamic Field Visibility**: Smart field display based on packet flags (shows only relevant fields)
- **Advanced Adaptation Field**: Complete parsing of Adaptation Field Extension (LTW, Piecewise Rate, Seamless Splice)
- **Packet Analysis Tab**: Comprehensive packet statistics, classification, and size distribution visualization
- **Enhanced Validation**: Real-time validation with error/warning badges in header
- **Multi-Bit Field Editor**: Grouped bit editing with labeled bit positions and descriptions

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Ant Design** - UI component library
- **MPEG-TS Parser** - Custom implementation supporting full TS packet structure

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

### Loading a Packet

1. **Upload TS File**: Click "Upload TS File" to load a binary MPEG-TS file
2. **Create Sample**: Use the dropdown to create pre-built sample packets:
   - **PAT Packet (PID 0)**: Program Association Table packet
   - **Packet with PCR**: Packet with Program Clock Reference
   - **Null Packet (0x1FFF)**: Standard null packet for padding
   - **Adaptation Only**: Packet with only adaptation field (no payload)

### Visual Inspector

The Visual Inspector tab shows:
- **Packet Header**: All header fields with binary/hex values
- **Adaptation Field**: When present, shows all adaptation field details including PCR
- **Payload**: Payload data with hex preview

### Hex Editor

The Hex Editor provides:
- Traditional hex dump view with ASCII representation
- Byte offset addresses
- Syntax highlighting showing packet structure
- Click any byte to select and edit it
- Color-coded regions:
  - **Yellow**: Header (bytes 0-3)
  - **Blue**: Adaptation Field
  - **Green**: Payload

### Editing

To edit a packet:
1. Switch to the **Hex Editor** tab
2. Click on any byte to select it
3. Enter new hex value (00-FF) in the input field
4. The packet will automatically re-parse and validate

### Download

Click **Download Packet** to save the current packet as a binary `.ts` file.

## Project Structure

```
src/
├── components/
│   ├── PacketVisualizer.tsx   # Visual packet display component
│   ├── HexEditor.tsx           # Hex editor component
│   └── HexEditor.css           # Hex editor styles
├── lib/
│   └── mpegts-parser.ts        # MPEG-TS packet parser & serializer
├── types/
│   └── TSPacket.ts             # TypeScript interfaces
├── utils/
│   └── samplePackets.ts        # Sample packet generators
├── App.tsx                     # Main application component
├── App.css                     # Application styles
├── main.tsx                    # Application entry point
└── index.css                   # Global styles
```

## MPEG-TS Packet Format

MPEG-TS packets are 188 bytes (or 204 with FEC) structured as:

### Header (4 bytes)
- **Sync Byte**: Always 0x47
- **Transport Error Indicator (TEI)**: Error flag
- **Payload Unit Start Indicator (PUSI)**: Marks start of PES/PSI
- **Transport Priority**: Priority flag
- **PID**: 13-bit Packet Identifier
- **Transport Scrambling Control**: Scrambling mode
- **Adaptation Field Control**: Indicates presence of adaptation/payload
- **Continuity Counter**: 4-bit sequence counter

### Adaptation Field (optional, variable length)
- **PCR/OPCR**: Program/Original Clock Reference (for synchronization)
- **Splice Countdown**: Splicing information
- **Transport Private Data**: Custom data
- **Stuffing Bytes**: Padding

### Payload (optional, variable length)
- PES or PSI data

## Development Phases

### ✅ Phase 1: MVP (Completed)
- [x] Basic packet parser
- [x] Simple visual display
- [x] Header field editing
- [x] Hex view

### ✅ Phase 2: Core Features (Completed)
- [x] Full Adaptation Field Extension parsing (LTW, Piecewise Rate, Seamless Splice)
- [x] Dynamic field visibility based on packet flags
- [x] Bit-level editor with interactive bit toggles
- [x] Field-level editing in visual inspector
- [x] Undo/Redo functionality with history management
- [x] Enhanced validation with real-time error/warning display
- [x] Packet analysis and statistics view
- [x] Edit mode toggle

### 📋 Phase 3: Enhanced UX (Next)
- [ ] Multilingual support (en/ru)
- [ ] Interactive tooltips with field descriptions
- [ ] Auto-calculations (adaptation field length, continuity counter)
- [ ] Keyboard shortcuts (Ctrl+Z/Y for undo/redo)
- [ ] Export to JSON format
- [ ] Packet templates

### 🚀 Phase 4: Advanced Features (Future)
- [ ] Stream analysis (multiple packets)
- [ ] Export/Import (C, Python, Wireshark dissector)
- [ ] PWA support with offline capabilities
- [ ] Performance optimization with Web Workers
- [ ] PES packet parsing
- [ ] PSI table parsing (PAT, PMT, CAT, etc.)
- [ ] Live stream capture from URL

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
