import React from 'react';
import { Card, Descriptions, Tag, Space, Typography, Progress, Statistic, Row, Col } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { TSPacket, ValidationResult } from '../types/TSPacket';

const { Title, Text } = Typography;

interface PacketAnalysisProps {
  packet: TSPacket | null;
  validation: ValidationResult | null;
}

export const PacketAnalysis: React.FC<PacketAnalysisProps> = ({ packet, validation }) => {
  if (!packet) {
    return (
      <Card>
        <Text type="secondary">No packet loaded for analysis.</Text>
      </Card>
    );
  }

  const calculateStats = () => {
    const headerSize = 4;
    const afSize = packet.adaptationField ? packet.adaptationField.length + 1 : 0;
    const payloadSize = packet.payload?.length || 0;
    const stuffingSize = packet.adaptationField?.stuffingBytes.length || 0;
    const totalSize = 188;

    const headerPercent = (headerSize / totalSize) * 100;
    const afPercent = (afSize / totalSize) * 100;
    const payloadPercent = (payloadSize / totalSize) * 100;
    const stuffingPercent = (stuffingSize / totalSize) * 100;

    return {
      headerSize,
      afSize,
      payloadSize,
      stuffingSize,
      totalSize,
      headerPercent,
      afPercent,
      payloadPercent,
      stuffingPercent,
    };
  };

  const stats = calculateStats();

  const getPacketType = () => {
    const pid = packet.header.pid;
    if (pid === 0) return { type: 'PAT', color: 'blue', description: 'Program Association Table' };
    if (pid === 1) return { type: 'CAT', color: 'cyan', description: 'Conditional Access Table' };
    if (pid === 2) return { type: 'TSDT', color: 'geekblue', description: 'Transport Stream Description Table' };
    if (pid === 0x1fff) return { type: 'NULL', color: 'default', description: 'Null Packet (padding)' };
    if (pid >= 0x10 && pid <= 0x1f) return { type: 'DVB', color: 'purple', description: 'DVB Metadata' };
    if (pid >= 0x20 && pid <= 0x1ffe) return { type: 'PES/Data', color: 'green', description: 'User-defined stream' };
    return { type: 'Unknown', color: 'red', description: 'Unknown packet type' };
  };

  const packetType = getPacketType();

  const hasErrors = validation?.errors.filter((e) => e.severity === 'error').length || 0;
  const hasWarnings = validation?.errors.filter((e) => e.severity === 'warning').length || 0;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Overall Status */}
      <Card>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Packet Status"
              value={validation?.isValid ? 'Valid' : 'Invalid'}
              valueStyle={{ color: validation?.isValid ? '#3f8600' : '#cf1322' }}
              prefix={validation?.isValid ? <CheckCircleOutlined /> : <WarningOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Errors"
              value={hasErrors}
              valueStyle={{ color: hasErrors > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Warnings"
              value={hasWarnings}
              valueStyle={{ color: hasWarnings > 0 ? '#faad14' : '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic title="Packet Size" value={stats.totalSize} suffix="bytes" />
          </Col>
        </Row>
      </Card>

      {/* Packet Classification */}
      <Card title={<Title level={4} style={{ margin: 0 }}>Packet Classification</Title>}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Type">
            <Tag color={packetType.color} icon={<FileTextOutlined />}>
              {packetType.type}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Description">{packetType.description}</Descriptions.Item>

          <Descriptions.Item label="PID">
            <Text code>0x{packet.header.pid.toString(16).toUpperCase().padStart(4, '0')}</Text>
            {' '}({packet.header.pid})
          </Descriptions.Item>

          <Descriptions.Item label="Has PCR">
            {packet.adaptationField?.pcrFlag ? (
              <Tag color="success">Yes</Tag>
            ) : (
              <Tag color="default">No</Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Scrambled">
            {packet.header.transportScramblingControl !== 0 ? (
              <Tag color="warning">Yes ({packet.header.transportScramblingControl})</Tag>
            ) : (
              <Tag color="success">No</Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Start Indicator">
            {packet.header.payloadUnitStartIndicator ? (
              <Tag color="blue">Start of PES/PSI</Tag>
            ) : (
              <Tag color="default">Continuation</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Size Distribution */}
      <Card title={<Title level={4} style={{ margin: 0 }}>Size Distribution</Title>}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text>Header: {stats.headerSize} bytes ({stats.headerPercent.toFixed(1)}%)</Text>
            <Progress
              percent={stats.headerPercent}
              strokeColor="#faad14"
              showInfo={false}
            />
          </div>

          {stats.afSize > 0 && (
            <div>
              <Text>Adaptation Field: {stats.afSize} bytes ({stats.afPercent.toFixed(1)}%)</Text>
              <Progress
                percent={stats.afPercent}
                strokeColor="#1890ff"
                showInfo={false}
              />
            </div>
          )}

          {stats.payloadSize > 0 && (
            <div>
              <Text>Payload: {stats.payloadSize} bytes ({stats.payloadPercent.toFixed(1)}%)</Text>
              <Progress
                percent={stats.payloadPercent}
                strokeColor="#52c41a"
                showInfo={false}
              />
            </div>
          )}

          {stats.stuffingSize > 0 && (
            <div>
              <Text>Stuffing: {stats.stuffingSize} bytes ({stats.stuffingPercent.toFixed(1)}%)</Text>
              <Progress
                percent={stats.stuffingPercent}
                strokeColor="#d9d9d9"
                showInfo={false}
              />
            </div>
          )}
        </Space>
      </Card>

      {/* Validation Details */}
      {validation && validation.errors.length > 0 && (
        <Card
          title={<Title level={4} style={{ margin: 0 }}>Validation Issues</Title>}
          extra={
            <Tag color={hasErrors > 0 ? 'error' : 'warning'}>
              {hasErrors} errors, {hasWarnings} warnings
            </Tag>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {validation.errors.map((error, index) => (
              <Card
                key={index}
                size="small"
                type="inner"
                title={
                  <Space>
                    {error.severity === 'error' ? (
                      <WarningOutlined style={{ color: '#cf1322' }} />
                    ) : (
                      <InfoCircleOutlined style={{ color: '#faad14' }} />
                    )}
                    <Text strong>{error.field}</Text>
                  </Space>
                }
              >
                <Text>{error.message}</Text>
              </Card>
            ))}
          </Space>
        </Card>
      )}
    </Space>
  );
};
