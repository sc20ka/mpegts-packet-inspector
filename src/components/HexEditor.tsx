import React, { useState } from 'react';
import { Card, Typography, Space, Input } from 'antd';
import './HexEditor.css';

const { Text, Title } = Typography;

interface HexEditorProps {
  data: Uint8Array;
  onChange?: (offset: number, value: number) => void;
  highlights?: { start: number; end: number; color: string; label: string }[];
}

export const HexEditor: React.FC<HexEditorProps> = ({ data, onChange, highlights = [] }) => {
  const [selectedByte, setSelectedByte] = useState<number | null>(null);

  const renderHexRow = (offset: number, length: number) => {
    const bytes: JSX.Element[] = [];

    for (let i = 0; i < length; i++) {
      const byteOffset = offset + i;
      if (byteOffset >= data.length) break;

      const byte = data[byteOffset];
      const isSelected = selectedByte === byteOffset;

      // Find highlight for this byte
      const highlight = highlights.find(
        (h) => byteOffset >= h.start && byteOffset < h.end
      );

      bytes.push(
        <span
          key={byteOffset}
          className={`hex-byte ${isSelected ? 'selected' : ''}`}
          style={{
            backgroundColor: highlight ? highlight.color : undefined,
            cursor: onChange ? 'pointer' : 'default',
          }}
          onClick={() => setSelectedByte(byteOffset)}
          title={highlight?.label}
        >
          {byte.toString(16).toUpperCase().padStart(2, '0')}
        </span>
      );
    }

    return bytes;
  };

  const renderAsciiRow = (offset: number, length: number) => {
    const chars: JSX.Element[] = [];

    for (let i = 0; i < length; i++) {
      const byteOffset = offset + i;
      if (byteOffset >= data.length) break;

      const byte = data[byteOffset];
      const char = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
      const isSelected = selectedByte === byteOffset;

      chars.push(
        <span
          key={byteOffset}
          className={`ascii-char ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedByte(byteOffset)}
        >
          {char}
        </span>
      );
    }

    return chars;
  };

  const rows: JSX.Element[] = [];
  const bytesPerRow = 16;

  for (let offset = 0; offset < data.length; offset += bytesPerRow) {
    rows.push(
      <div key={offset} className="hex-row">
        <span className="hex-offset">
          {offset.toString(16).toUpperCase().padStart(4, '0')}
        </span>
        <span className="hex-bytes">{renderHexRow(offset, bytesPerRow)}</span>
        <span className="ascii-chars">{renderAsciiRow(offset, bytesPerRow)}</span>
      </div>
    );
  }

  return (
    <Card
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            Hex View
          </Title>
          {selectedByte !== null && (
            <Text type="secondary">
              Selected: 0x{selectedByte.toString(16).toUpperCase()} (
              {data[selectedByte].toString(16).toUpperCase().padStart(2, '0')})
            </Text>
          )}
        </Space>
      }
    >
      <div className="hex-editor">{rows}</div>

      {selectedByte !== null && onChange && (
        <Space style={{ marginTop: 16 }}>
          <Text>Edit byte at 0x{selectedByte.toString(16).toUpperCase()}:</Text>
          <Input
            style={{ width: 80 }}
            placeholder="00-FF"
            maxLength={2}
            defaultValue={data[selectedByte].toString(16).toUpperCase().padStart(2, '0')}
            onChange={(e) => {
              const value = parseInt(e.target.value, 16);
              if (!isNaN(value) && value >= 0 && value <= 255) {
                onChange(selectedByte, value);
              }
            }}
          />
        </Space>
      )}
    </Card>
  );
};
