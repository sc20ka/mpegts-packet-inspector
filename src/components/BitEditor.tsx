import React, { useState, useEffect } from 'react';
import { Card, Space, Typography, Button, Tooltip } from 'antd';
import './BitEditor.css';

const { Text } = Typography;

interface BitEditorProps {
  value: number;
  bits: number;
  onChange?: (newValue: number) => void;
  label?: string;
  readOnly?: boolean;
  descriptions?: string[];
}

export const BitEditor: React.FC<BitEditorProps> = ({
  value,
  bits,
  onChange,
  label,
  readOnly = false,
  descriptions = [],
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const toggleBit = (bitIndex: number) => {
    if (readOnly || !onChange) return;

    const newValue = localValue ^ (1 << bitIndex);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const renderBit = (bitIndex: number) => {
    const bitValue = (localValue >> bitIndex) & 1;
    const isActive = bitValue === 1;
    const description = descriptions[bits - 1 - bitIndex];

    const bitElement = (
      <div
        key={bitIndex}
        className={`bit ${isActive ? 'active' : 'inactive'} ${readOnly ? 'readonly' : 'editable'}`}
        onClick={() => toggleBit(bitIndex)}
      >
        <div className="bit-index">{bits - 1 - bitIndex}</div>
        <div className="bit-value">{bitValue}</div>
      </div>
    );

    if (description) {
      return (
        <Tooltip key={bitIndex} title={description}>
          {bitElement}
        </Tooltip>
      );
    }

    return bitElement;
  };

  const bits_array = Array.from({ length: bits }, (_, i) => bits - 1 - i);

  return (
    <div className="bit-editor-container">
      {label && (
        <Text strong style={{ marginBottom: 8, display: 'block' }}>
          {label}
        </Text>
      )}
      <div className="bit-editor">
        <div className="bits-row">{bits_array.map((i) => renderBit(i))}</div>
      </div>
      <Space style={{ marginTop: 8 }}>
        <Text type="secondary">
          Binary: <Text code>{localValue.toString(2).padStart(bits, '0')}</Text>
        </Text>
        <Text type="secondary">
          Decimal: <Text code>{localValue}</Text>
        </Text>
        <Text type="secondary">
          Hex: <Text code>0x{localValue.toString(16).toUpperCase()}</Text>
        </Text>
      </Space>
      {!readOnly && onChange && (
        <Space style={{ marginTop: 8 }}>
          <Button size="small" onClick={() => { setLocalValue(0); onChange(0); }}>
            Clear All
          </Button>
          <Button size="small" onClick={() => {
            const maxValue = (1 << bits) - 1;
            setLocalValue(maxValue);
            onChange(maxValue);
          }}>
            Set All
          </Button>
        </Space>
      )}
    </div>
  );
};

interface MultiBitFieldEditorProps {
  fields: {
    name: string;
    value: number;
    bits: number;
    onChange?: (newValue: number) => void;
    description?: string;
    bitDescriptions?: string[];
  }[];
}

export const MultiBitFieldEditor: React.FC<MultiBitFieldEditorProps> = ({ fields }) => {
  return (
    <Card title="Bit-Level Editor" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {fields.map((field, index) => (
          <div key={index}>
            <BitEditor
              value={field.value}
              bits={field.bits}
              onChange={field.onChange}
              label={field.name}
              descriptions={field.bitDescriptions}
            />
            {field.description && (
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                {field.description}
              </Text>
            )}
          </div>
        ))}
      </Space>
    </Card>
  );
};
