import React from 'react';
import { Card, Button, Space, Typography, Descriptions, message, Switch } from 'antd';
import { CalculatorOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { TSPacket } from '../types/TSPacket';
import {
  autoUpdateLengths,
  autoAddStuffing,
  calculateNextContinuityCounter,
  validatePacketLength,
} from '../utils/autoCalculations';

const { Text, Title } = Typography;

interface AutoCalculatorProps {
  packet: TSPacket | null;
  onPacketUpdate: (packet: TSPacket) => void;
  autoMode?: boolean;
  onAutoModeChange?: (enabled: boolean) => void;
}

export const AutoCalculator: React.FC<AutoCalculatorProps> = ({
  packet,
  onPacketUpdate,
  autoMode = false,
  onAutoModeChange,
}: AutoCalculatorProps) => {
  const handleAutoUpdateLengths = () => {
    if (!packet) return;

    try {
      const updated = autoUpdateLengths(packet);
      onPacketUpdate(updated);
      message.success('Lengths auto-calculated and updated!');
    } catch (error) {
      message.error(`Failed to update lengths: ${(error as Error).message}`);
    }
  };

  const handleAutoAddStuffing = () => {
    if (!packet) return;

    try {
      const updated = autoAddStuffing(packet);
      onPacketUpdate(updated);
      message.success('Stuffing bytes added automatically!');
    } catch (error) {
      message.error(`Failed to add stuffing: ${(error as Error).message}`);
    }
  };

  const handleIncrementCC = () => {
    if (!packet) return;

    try {
      const updated = JSON.parse(JSON.stringify(packet));
      updated.header.continuityCounter = calculateNextContinuityCounter(packet.header.continuityCounter);
      onPacketUpdate(updated);
      message.success(`Continuity counter incremented to ${updated.header.continuityCounter}`);
    } catch (error) {
      message.error(`Failed to increment CC: ${(error as Error).message}`);
    }
  };

  const handleValidateLength = () => {
    if (!packet) return;

    const validation = validatePacketLength(packet);
    if (validation.valid) {
      message.success('Packet length is valid!');
    } else {
      message.error(validation.message);
    }
  };

  const handleAutoFix = () => {
    if (!packet) return;

    try {
      let updated = autoUpdateLengths(packet);
      updated = autoAddStuffing(updated);
      onPacketUpdate(updated);
      message.success('Packet auto-fixed: lengths calculated and stuffing added!');
    } catch (error) {
      message.error(`Auto-fix failed: ${(error as Error).message}`);
    }
  };

  if (!packet) {
    return (
      <Card>
        <Text type="secondary">No packet loaded for auto-calculations.</Text>
      </Card>
    );
  }

  const currentCC = packet.header.continuityCounter;
  const nextCC = calculateNextContinuityCounter(currentCC);
  const afLength = packet.adaptationField?.length || 0;
  const validation = validatePacketLength(packet);

  return (
    <Card
      title={
        <Space>
          <CalculatorOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Auto-Calculator
          </Title>
        </Space>
      }
      extra={
        onAutoModeChange && (
          <Space>
            <Text>Auto Mode:</Text>
            <Switch
              checked={autoMode}
              onChange={onAutoModeChange}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </Space>
        )
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Quick Actions */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Quick Actions
          </Text>
          <Space wrap>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={handleAutoFix}
              type="primary"
              title="Auto-calculate lengths and add stuffing"
            >
              Auto-Fix All
            </Button>
            <Button onClick={handleAutoUpdateLengths} title="Recalculate AF and extension lengths">
              Update Lengths
            </Button>
            <Button onClick={handleAutoAddStuffing} title="Add stuffing bytes to fill 188 bytes">
              Add Stuffing
            </Button>
            <Button onClick={handleIncrementCC} title="Increment continuity counter">
              Increment CC
            </Button>
            <Button onClick={handleValidateLength}>Validate Length</Button>
          </Space>
        </div>

        {/* Current Values */}
        <Descriptions bordered column={2} size="small" title="Current Values">
          <Descriptions.Item label="Continuity Counter">
            <Space>
              <Text code>{currentCC}</Text>
              <Text type="secondary">→ Next: {nextCC}</Text>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="AF Length">
            <Space>
              <Text code>{afLength} bytes</Text>
              {packet.adaptationField && afLength === 0 && (
                <Text type="warning">(Will be auto-calculated)</Text>
              )}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Extension Length">
            <Text code>{packet.adaptationField?.extension?.length || 0} bytes</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Stuffing Bytes">
            <Text code>{packet.adaptationField?.stuffingBytes.length || 0} bytes</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Packet Valid" span={2}>
            {validation.valid ? (
              <Text type="success">✓ Valid</Text>
            ) : (
              <Text type="danger">✗ {validation.message}</Text>
            )}
          </Descriptions.Item>
        </Descriptions>

        {/* Auto Mode Description */}
        {autoMode && (
          <Card type="inner" size="small" style={{ backgroundColor: '#f0f5ff' }}>
            <Space direction="vertical">
              <Text strong>🤖 Auto Mode Enabled</Text>
              <Text type="secondary">
                Lengths and stuffing will be automatically calculated when you make changes.
              </Text>
            </Space>
          </Card>
        )}

        {/* Tips */}
        <Card type="inner" size="small" title="💡 Tips">
          <Space direction="vertical" size="small">
            <Text>
              • <Text strong>Auto-Fix All</Text>: Quickly fix common issues (lengths + stuffing)
            </Text>
            <Text>
              • <Text strong>Update Lengths</Text>: Recalculates adaptation field lengths based on
              content
            </Text>
            <Text>
              • <Text strong>Add Stuffing</Text>: Fills packet to exactly 188 bytes with 0xFF
            </Text>
            <Text>
              • <Text strong>Increment CC</Text>: Automatically increments continuity counter
              (wraps at 15)
            </Text>
          </Space>
        </Card>
      </Space>
    </Card>
  );
};
