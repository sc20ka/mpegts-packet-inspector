import React, { useState } from 'react';
import { Card, Descriptions, Tag, Space, Typography, InputNumber, Switch, Collapse, Alert } from 'antd';
import { InfoCircleOutlined, EditOutlined } from '@ant-design/icons';
import { TSPacket } from '../types/TSPacket';
import { BitEditor, MultiBitFieldEditor } from './BitEditor';
import { isFieldVisible } from '../utils/fieldVisibility';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface EditablePacketVisualizerProps {
  packet: TSPacket | null;
  onFieldChange?: (field: string, value: any) => void;
  editMode?: boolean;
}

export const EditablePacketVisualizer: React.FC<EditablePacketVisualizerProps> = ({
  packet,
  onFieldChange,
  editMode = false,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['header']);

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
      'Reserved (invalid)',
      'Payload only',
      'Adaptation field only',
      'Adaptation field + Payload',
    ];
    return descriptions[afc] || 'Unknown';
  };

  const getPIDDescription = (pid: number) => {
    if (pid === 0) return 'PAT (Program Association Table)';
    if (pid === 1) return 'CAT (Conditional Access Table)';
    if (pid === 2) return 'TSDT (Transport Stream Description Table)';
    if (pid === 0x1fff) return 'Null Packet';
    if (pid >= 0x10 && pid <= 0x1ffe) return 'User-defined';
    return 'Reserved';
  };

  const handleFieldChange = (field: string, value: any) => {
    if (onFieldChange) {
      onFieldChange(field, value);
    }
  };

  const renderEditableField = (field: string, value: number, max: number) => {
    if (!editMode) {
      return <Text code>{value}</Text>;
    }

    return (
      <InputNumber
        size="small"
        min={0}
        max={max}
        value={value}
        onChange={(v) => handleFieldChange(field, v ?? 0)}
        style={{ width: 120 }}
      />
    );
  };

  const renderEditableBoolean = (field: string, value: boolean) => {
    if (!editMode) {
      return <Tag color={value ? 'blue' : 'default'}>{value ? 'Yes' : 'No'}</Tag>;
    }

    return (
      <Switch
        checked={value}
        onChange={(checked) => handleFieldChange(field, checked)}
        size="small"
      />
    );
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {editMode && (
        <Alert
          message="Edit Mode Active"
          description="You can now edit packet fields. Changes will be reflected in the hex view."
          type="info"
          icon={<EditOutlined />}
          showIcon
        />
      )}

      <Collapse
        activeKey={expandedKeys}
        onChange={(keys) => setExpandedKeys(keys as string[])}
      >
        {/* Header */}
        <Panel header={<Title level={4} style={{ margin: 0 }}>Packet Header</Title>} key="header">
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

            <Descriptions.Item
              label={
                <Space>
                  Transport Error Indicator (TEI)
                  <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                </Space>
              }
            >
              {renderEditableBoolean('header.transportErrorIndicator', packet.header.transportErrorIndicator)}
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                Indicates transmission errors
              </Text>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <Space>
                  Payload Unit Start Indicator (PUSI)
                  <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                </Space>
              }
            >
              {renderEditableBoolean('header.payloadUnitStartIndicator', packet.header.payloadUnitStartIndicator)}
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                Start of PES/PSI data
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label="Transport Priority">
              {renderEditableBoolean('header.transportPriority', packet.header.transportPriority)}
            </Descriptions.Item>

            <Descriptions.Item label="PID (Packet ID)">
              {editMode ? (
                <InputNumber
                  size="small"
                  min={0}
                  max={0x1fff}
                  value={packet.header.pid}
                  onChange={(v) => handleFieldChange('header.pid', v ?? 0)}
                  style={{ width: 120 }}
                />
              ) : (
                renderBinaryValue(packet.header.pid, 13)
              )}
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {getPIDDescription(packet.header.pid)}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Transport Scrambling Control">
              {editMode ? (
                <InputNumber
                  size="small"
                  min={0}
                  max={3}
                  value={packet.header.transportScramblingControl}
                  onChange={(v) => handleFieldChange('header.transportScramblingControl', v ?? 0)}
                  style={{ width: 100 }}
                />
              ) : (
                renderBinaryValue(packet.header.transportScramblingControl, 2)
              )}
              {packet.header.transportScramblingControl === 0 && (
                <Tag color="success" style={{ marginLeft: 8 }}>
                  Not scrambled
                </Tag>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Adaptation Field Control (AFC)">
              {editMode ? (
                <InputNumber
                  size="small"
                  min={0}
                  max={3}
                  value={packet.header.adaptationFieldControl}
                  onChange={(v) => handleFieldChange('header.adaptationFieldControl', v ?? 0)}
                  style={{ width: 100 }}
                />
              ) : (
                renderBinaryValue(packet.header.adaptationFieldControl, 2)
              )}
              <Tag color="cyan" style={{ marginLeft: 8 }}>
                {getAFCDescription(packet.header.adaptationFieldControl)}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Continuity Counter">
              {renderEditableField('header.continuityCounter', packet.header.continuityCounter, 15)}
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                Increments with each packet of same PID
              </Text>
            </Descriptions.Item>
          </Descriptions>

          {editMode && (
            <div style={{ marginTop: 16 }}>
              <MultiBitFieldEditor
                fields={[
                  {
                    name: 'Byte 1 (TEI, PUSI, Priority, PID[12:8])',
                    value:
                      (packet.header.transportErrorIndicator ? 0x80 : 0) |
                      (packet.header.payloadUnitStartIndicator ? 0x40 : 0) |
                      (packet.header.transportPriority ? 0x20 : 0) |
                      ((packet.header.pid >> 8) & 0x1f),
                    bits: 8,
                    bitDescriptions: [
                      'TEI',
                      'PUSI',
                      'Priority',
                      'PID[12]',
                      'PID[11]',
                      'PID[10]',
                      'PID[9]',
                      'PID[8]',
                    ],
                  },
                  {
                    name: 'Byte 3 (TSC, AFC, CC)',
                    value:
                      (packet.header.transportScramblingControl << 6) |
                      (packet.header.adaptationFieldControl << 4) |
                      packet.header.continuityCounter,
                    bits: 8,
                    bitDescriptions: [
                      'TSC[1]',
                      'TSC[0]',
                      'AFC[1]',
                      'AFC[0]',
                      'CC[3]',
                      'CC[2]',
                      'CC[1]',
                      'CC[0]',
                    ],
                  },
                ]}
              />
            </div>
          )}
        </Panel>

        {/* Adaptation Field */}
        {isFieldVisible(packet, 'adaptationField') && packet.adaptationField && (
          <Panel header={<Title level={4} style={{ margin: 0 }}>Adaptation Field</Title>} key="adaptation">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Length">
                {renderEditableField('adaptationField.length', packet.adaptationField.length, 183)}
                {' bytes'}
              </Descriptions.Item>

              {packet.adaptationField.discontinuityIndicator !== undefined && (
                <Descriptions.Item label="Discontinuity Indicator">
                  {renderEditableBoolean(
                    'adaptationField.discontinuityIndicator',
                    packet.adaptationField.discontinuityIndicator
                  )}
                </Descriptions.Item>
              )}

              {packet.adaptationField.randomAccessIndicator !== undefined && (
                <Descriptions.Item label="Random Access Indicator">
                  {renderEditableBoolean(
                    'adaptationField.randomAccessIndicator',
                    packet.adaptationField.randomAccessIndicator
                  )}
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    Indicates stream can be decoded from this point
                  </Text>
                </Descriptions.Item>
              )}

              {packet.adaptationField.elementaryStreamPriorityIndicator !== undefined && (
                <Descriptions.Item label="Elementary Stream Priority Indicator">
                  {renderEditableBoolean(
                    'adaptationField.elementaryStreamPriorityIndicator',
                    packet.adaptationField.elementaryStreamPriorityIndicator
                  )}
                </Descriptions.Item>
              )}

              {/* Flags Display */}
              <Descriptions.Item label="Adaptation Field Flags">
                <Space wrap>
                  {packet.adaptationField.pcrFlag !== undefined && (
                    <Tag color={packet.adaptationField.pcrFlag ? 'green' : 'default'}>
                      PCR: {packet.adaptationField.pcrFlag ? 'Yes' : 'No'}
                    </Tag>
                  )}
                  {packet.adaptationField.opcrFlag !== undefined && (
                    <Tag color={packet.adaptationField.opcrFlag ? 'green' : 'default'}>
                      OPCR: {packet.adaptationField.opcrFlag ? 'Yes' : 'No'}
                    </Tag>
                  )}
                  {packet.adaptationField.splicingPointFlag !== undefined && (
                    <Tag color={packet.adaptationField.splicingPointFlag ? 'orange' : 'default'}>
                      Splice: {packet.adaptationField.splicingPointFlag ? 'Yes' : 'No'}
                    </Tag>
                  )}
                  {packet.adaptationField.transportPrivateDataFlag !== undefined && (
                    <Tag color={packet.adaptationField.transportPrivateDataFlag ? 'purple' : 'default'}>
                      Private Data: {packet.adaptationField.transportPrivateDataFlag ? 'Yes' : 'No'}
                    </Tag>
                  )}
                  {packet.adaptationField.adaptationFieldExtensionFlag !== undefined && (
                    <Tag color={packet.adaptationField.adaptationFieldExtensionFlag ? 'cyan' : 'default'}>
                      Extension: {packet.adaptationField.adaptationFieldExtensionFlag ? 'Yes' : 'No'}
                    </Tag>
                  )}
                </Space>
              </Descriptions.Item>

              {isFieldVisible(packet, 'adaptationField.pcr') && packet.adaptationField.pcr && (
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
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      PCR = (base × 300 + extension) / 27 MHz
                    </Text>
                  </Space>
                </Descriptions.Item>
              )}

              {isFieldVisible(packet, 'adaptationField.opcr') && packet.adaptationField.opcr && (
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

              {isFieldVisible(packet, 'adaptationField.spliceCountdown') && packet.adaptationField.spliceCountdown !== undefined && (
                <Descriptions.Item label="Splice Countdown">
                  {editMode ? (
                    <InputNumber
                      size="small"
                      min={-128}
                      max={127}
                      value={packet.adaptationField.spliceCountdown}
                      onChange={(v) => handleFieldChange('adaptationField.spliceCountdown', v ?? 0)}
                      style={{ width: 100 }}
                    />
                  ) : (
                    <Text code>{packet.adaptationField.spliceCountdown}</Text>
                  )}
                </Descriptions.Item>
              )}

              {isFieldVisible(packet, 'adaptationField.transportPrivateData') && packet.adaptationField.transportPrivateData && (
                <Descriptions.Item label="Transport Private Data">
                  <Space direction="vertical">
                    <Text>
                      Length: <Text code>{packet.adaptationField.transportPrivateData.length}</Text> bytes
                    </Text>
                    <Text>
                      Data: <Text code style={{ wordBreak: 'break-all', fontSize: 11 }}>
                        {Array.from(packet.adaptationField.transportPrivateData.data.slice(0, 32))
                          .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
                          .join(' ')}
                        {packet.adaptationField.transportPrivateData.data.length > 32 && '...'}
                      </Text>
                    </Text>
                  </Space>
                </Descriptions.Item>
              )}

              {isFieldVisible(packet, 'adaptationField.extension') && packet.adaptationField.extension && (
                <Descriptions.Item label="Adaptation Field Extension">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Extension Length: <Text code>{packet.adaptationField.extension.length}</Text> bytes</Text>

                    {packet.adaptationField.extension.ltw && (
                      <Card size="small" type="inner" title="LTW (Legal Time Window)">
                        <Space direction="vertical">
                          <Text>
                            Valid Flag: <Tag color={packet.adaptationField.extension.ltw.validFlag ? 'success' : 'default'}>
                              {packet.adaptationField.extension.ltw.validFlag ? 'Valid' : 'Invalid'}
                            </Tag>
                          </Text>
                          <Text>
                            Offset: <Text code>{packet.adaptationField.extension.ltw.offset}</Text>
                          </Text>
                        </Space>
                      </Card>
                    )}

                    {packet.adaptationField.extension.piecewiseRate !== undefined && (
                      <Card size="small" type="inner" title="Piecewise Rate">
                        <Text>
                          Rate: <Text code>{packet.adaptationField.extension.piecewiseRate}</Text>
                          <Text type="secondary"> ({(packet.adaptationField.extension.piecewiseRate * 50).toLocaleString()} bytes/sec)</Text>
                        </Text>
                      </Card>
                    )}

                    {packet.adaptationField.extension.seamlessSplice && (
                      <Card size="small" type="inner" title="Seamless Splice">
                        <Space direction="vertical">
                          <Text>
                            Splice Type: <Text code>{packet.adaptationField.extension.seamlessSplice.spliceType}</Text>
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                              {packet.adaptationField.extension.seamlessSplice.spliceType === 0 ? 'Video' :
                               packet.adaptationField.extension.seamlessSplice.spliceType === 1 ? 'Audio' : 'Other'}
                            </Tag>
                          </Text>
                          <Text>
                            DTS Next AU: <Text code>{packet.adaptationField.extension.seamlessSplice.dtsNextAu.toString()}</Text>
                          </Text>
                        </Space>
                      </Card>
                    )}

                    {/* Extension Flags */}
                    <Space wrap>
                      {packet.adaptationField.extension.ltwFlag !== undefined && (
                        <Tag color={packet.adaptationField.extension.ltwFlag ? 'processing' : 'default'}>
                          LTW: {packet.adaptationField.extension.ltwFlag ? 'Present' : 'Absent'}
                        </Tag>
                      )}
                      {packet.adaptationField.extension.piecewiseRateFlag !== undefined && (
                        <Tag color={packet.adaptationField.extension.piecewiseRateFlag ? 'processing' : 'default'}>
                          Piecewise Rate: {packet.adaptationField.extension.piecewiseRateFlag ? 'Present' : 'Absent'}
                        </Tag>
                      )}
                      {packet.adaptationField.extension.seamlessSpliceFlag !== undefined && (
                        <Tag color={packet.adaptationField.extension.seamlessSpliceFlag ? 'processing' : 'default'}>
                          Seamless Splice: {packet.adaptationField.extension.seamlessSpliceFlag ? 'Present' : 'Absent'}
                        </Tag>
                      )}
                    </Space>
                  </Space>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Stuffing Bytes">
                <Text code>{packet.adaptationField.stuffingBytes.length}</Text> bytes
              </Descriptions.Item>
            </Descriptions>
          </Panel>
        )}

        {/* Payload */}
        {isFieldVisible(packet, 'payload') && packet.payload && (
          <Panel header={<Title level={4} style={{ margin: 0 }}>Payload</Title>} key="payload">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Length">
                <Text code>{packet.payload.length}</Text> bytes
              </Descriptions.Item>
              <Descriptions.Item label="First 32 bytes">
                <Text code style={{ wordBreak: 'break-all', fontSize: 11 }}>
                  {Array.from(packet.payload.slice(0, 32))
                    .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
                    .join(' ')}
                  {packet.payload.length > 32 && '...'}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Panel>
        )}
      </Collapse>
    </Space>
  );
};
