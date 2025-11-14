import React from 'react';
import { Card, Descriptions, Tag, Space, Typography } from 'antd';
import { TSPacket } from '../types/TSPacket';

const { Title, Text } = Typography;

interface PacketVisualizerProps {
  packet: TSPacket | null;
  onFieldChange?: (field: string, value: any) => void;
}

export const PacketVisualizer: React.FC<PacketVisualizerProps> = ({ packet }) => {
  if (!packet) {
    return (
      <Card>
        <Text type="secondary">No packet loaded. Please upload or create a packet.</Text>
      </Card>
    );
  }

  const renderBinaryValue = (value: number, bits: number) => {
    return (
      <Space>
        <Text code>{value.toString(2).padStart(bits, '0')}</Text>
        <Text type="secondary">({value})</Text>
      </Space>
    );
  };

  const renderHexValue = (value: number) => {
    return (
      <Space>
        <Text code>0x{value.toString(16).toUpperCase().padStart(2, '0')}</Text>
        <Text type="secondary">({value})</Text>
      </Space>
    );
  };

  const getAFCDescription = (afc: number) => {
    const descriptions = [
      'Reserved',
      'Payload only',
      'Adaptation field only',
      'Adaptation field + Payload',
    ];
    return descriptions[afc] || 'Unknown';
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Header */}
      <Card title={<Title level={4}>Packet Header</Title>}>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Sync Byte">
            {renderHexValue(packet.header.syncByte)}
            {packet.header.syncByte === 0x47 ? (
              <Tag color="success" style={{ marginLeft: 8 }}>
                Valid
              </Tag>
            ) : (
              <Tag color="error" style={{ marginLeft: 8 }}>
                Invalid
              </Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Transport Error Indicator (TEI)">
            <Tag color={packet.header.transportErrorIndicator ? 'error' : 'default'}>
              {packet.header.transportErrorIndicator ? 'Error' : 'No Error'}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Payload Unit Start Indicator (PUSI)">
            <Tag color={packet.header.payloadUnitStartIndicator ? 'blue' : 'default'}>
              {packet.header.payloadUnitStartIndicator ? 'Start' : 'Continuation'}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Transport Priority">
            <Tag color={packet.header.transportPriority ? 'gold' : 'default'}>
              {packet.header.transportPriority ? 'High' : 'Normal'}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="PID (Packet ID)">
            {renderBinaryValue(packet.header.pid, 13)}
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {packet.header.pid === 0 ? 'PAT' : packet.header.pid === 0x1fff ? 'Null' : `PID ${packet.header.pid}`}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Transport Scrambling Control">
            {renderBinaryValue(packet.header.transportScramblingControl, 2)}
            {packet.header.transportScramblingControl === 0 && (
              <Tag color="success" style={{ marginLeft: 8 }}>
                Not scrambled
              </Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Adaptation Field Control (AFC)">
            {renderBinaryValue(packet.header.adaptationFieldControl, 2)}
            <Tag color="cyan" style={{ marginLeft: 8 }}>
              {getAFCDescription(packet.header.adaptationFieldControl)}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Continuity Counter">
            {renderBinaryValue(packet.header.continuityCounter, 4)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Adaptation Field */}
      {packet.adaptationField && (
        <Card title={<Title level={4}>Adaptation Field</Title>}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Length">
              <Text code>{packet.adaptationField.length}</Text> bytes
            </Descriptions.Item>

            {packet.adaptationField.discontinuityIndicator !== undefined && (
              <Descriptions.Item label="Discontinuity Indicator">
                <Tag color={packet.adaptationField.discontinuityIndicator ? 'warning' : 'default'}>
                  {packet.adaptationField.discontinuityIndicator ? 'Yes' : 'No'}
                </Tag>
              </Descriptions.Item>
            )}

            {packet.adaptationField.randomAccessIndicator !== undefined && (
              <Descriptions.Item label="Random Access Indicator">
                <Tag color={packet.adaptationField.randomAccessIndicator ? 'blue' : 'default'}>
                  {packet.adaptationField.randomAccessIndicator ? 'Yes' : 'No'}
                </Tag>
              </Descriptions.Item>
            )}

            {packet.adaptationField.pcr && (
              <Descriptions.Item label="PCR (Program Clock Reference)">
                <Space direction="vertical">
                  <Text>
                    Base: <Text code>{packet.adaptationField.pcr.base.toString()}</Text>
                  </Text>
                  <Text>
                    Extension: <Text code>{packet.adaptationField.pcr.extension}</Text>
                  </Text>
                  <Text>
                    Time: <Text code>{packet.adaptationField.pcr.calculated.toFixed(2)} μs</Text>
                  </Text>
                </Space>
              </Descriptions.Item>
            )}

            {packet.adaptationField.opcr && (
              <Descriptions.Item label="OPCR (Original Program Clock Reference)">
                <Space direction="vertical">
                  <Text>
                    Base: <Text code>{packet.adaptationField.opcr.base.toString()}</Text>
                  </Text>
                  <Text>
                    Extension: <Text code>{packet.adaptationField.opcr.extension}</Text>
                  </Text>
                </Space>
              </Descriptions.Item>
            )}

            {packet.adaptationField.spliceCountdown !== undefined && (
              <Descriptions.Item label="Splice Countdown">
                <Text code>{packet.adaptationField.spliceCountdown}</Text>
              </Descriptions.Item>
            )}

            <Descriptions.Item label="Stuffing Bytes">
              <Text code>{packet.adaptationField.stuffingBytes.length}</Text> bytes
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* Payload */}
      {packet.payload && (
        <Card title={<Title level={4}>Payload</Title>}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Length">
              <Text code>{packet.payload.length}</Text> bytes
            </Descriptions.Item>
            <Descriptions.Item label="First 16 bytes">
              <Text code style={{ wordBreak: 'break-all' }}>
                {Array.from(packet.payload.slice(0, 16))
                  .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
                  .join(' ')}
                {packet.payload.length > 16 && '...'}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Space>
  );
};
