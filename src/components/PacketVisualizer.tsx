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

            {packet.adaptationField.elementaryStreamPriorityIndicator !== undefined && (
              <Descriptions.Item label="Elementary Stream Priority Indicator">
                <Tag color={packet.adaptationField.elementaryStreamPriorityIndicator ? 'gold' : 'default'}>
                  {packet.adaptationField.elementaryStreamPriorityIndicator ? 'High Priority' : 'Normal'}
                </Tag>
              </Descriptions.Item>
            )}

            {/* Flags Display */}
            <Descriptions.Item label="Flags">
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

            {packet.adaptationField.transportPrivateData && (
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

            {packet.adaptationField.extension && (
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
