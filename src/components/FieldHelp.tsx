import React, { useState } from 'react';
import { Card, Input, Space, Typography, Collapse, Empty, Tag } from 'antd';
import { QuestionCircleOutlined, SearchOutlined, BookOutlined } from '@ant-design/icons';
import { fieldHelp, FieldHelp as FieldHelpType } from '../utils/fieldHelp';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

export const FieldHelpPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter fields based on search term
  const filteredFields = Object.entries(fieldHelp).filter(([key, help]) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      key.toLowerCase().includes(searchLower) ||
      help.title.toLowerCase().includes(searchLower) ||
      (typeof help.description === 'string' &&
        help.description.toLowerCase().includes(searchLower))
    );
  });

  // Group fields by category
  const headerFields = filteredFields.filter(([key]) =>
    [
      'syncByte',
      'transportErrorIndicator',
      'payloadUnitStartIndicator',
      'transportPriority',
      'pid',
      'transportScramblingControl',
      'adaptationFieldControl',
      'continuityCounter',
    ].includes(key)
  );

  const afFields = filteredFields.filter(([key]) =>
    [
      'discontinuityIndicator',
      'randomAccessIndicator',
      'elementaryStreamPriorityIndicator',
      'pcr',
      'opcr',
      'spliceCountdown',
      'transportPrivateData',
      'stuffingBytes',
    ].includes(key)
  );

  const extensionFields = filteredFields.filter(([key]) =>
    ['ltw', 'piecewiseRate', 'seamlessSplice'].includes(key)
  );

  const renderFieldGroup = (
    title: string,
    fields: [string, FieldHelpType][],
    icon: React.ReactNode
  ) => {
    if (fields.length === 0) return null;

    return (
      <Card
        size="small"
        title={
          <Space>
            {icon}
            <Text strong>{title}</Text>
            <Tag>{fields.length} fields</Tag>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Collapse accordion>
          {fields.map(([key, help]) => (
            <Panel
              header={
                <Space>
                  <QuestionCircleOutlined />
                  <Text strong>{help.title}</Text>
                  {help.standardReference && (
                    <Tag color="blue" style={{ fontSize: 10 }}>
                      Standard
                    </Tag>
                  )}
                </Space>
              }
              key={key}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>{help.description}</div>

                {help.technicalDetails && (
                  <Card type="inner" size="small">
                    <Text strong>Technical Details: </Text>
                    <Text code>{help.technicalDetails}</Text>
                  </Card>
                )}

                {help.standardReference && (
                  <Text type="secondary" italic style={{ fontSize: 12 }}>
                    📚 Reference: {help.standardReference}
                  </Text>
                )}
              </Space>
            </Panel>
          ))}
        </Collapse>
      </Card>
    );
  };

  return (
    <Card
      title={
        <Space>
          <BookOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Field Documentation
          </Title>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Search Bar */}
        <Input
          placeholder="Search fields... (e.g., PCR, PID, continuity)"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          allowClear
          size="large"
        />

        {/* Introduction */}
        {!searchTerm && (
          <Card type="inner" size="small" style={{ backgroundColor: '#f0f5ff' }}>
            <Space direction="vertical">
              <Text strong>📖 MPEG-TS Field Reference</Text>
              <Paragraph style={{ marginBottom: 0 }}>
                This reference guide explains all fields in MPEG-TS packets according to
                the ISO/IEC 13818-1 standard. Click on any field to see detailed
                information, technical specifications, and standard references.
              </Paragraph>
            </Space>
          </Card>
        )}

        {/* Results */}
        {filteredFields.length === 0 ? (
          <Empty description={`No fields found matching "${searchTerm}"`} />
        ) : (
          <>
            {renderFieldGroup(
              'Transport Packet Header',
              headerFields,
              <Tag color="green">Header</Tag>
            )}
            {renderFieldGroup(
              'Adaptation Field',
              afFields,
              <Tag color="blue">AF</Tag>
            )}
            {renderFieldGroup(
              'AF Extension',
              extensionFields,
              <Tag color="purple">Extension</Tag>
            )}
          </>
        )}

        {/* Statistics */}
        {!searchTerm && (
          <Card type="inner" size="small" title="📊 Coverage">
            <Space direction="vertical" size="small">
              <Text>
                • <Text strong>Total Fields Documented:</Text>{' '}
                {Object.keys(fieldHelp).length}
              </Text>
              <Text>
                • <Text strong>Header Fields:</Text> 8
              </Text>
              <Text>
                • <Text strong>Adaptation Field:</Text> 8
              </Text>
              <Text>
                • <Text strong>AF Extensions:</Text> 3
              </Text>
              <Text type="secondary" style={{ marginTop: 8 }}>
                All fields are documented according to ISO/IEC 13818-1:2000
              </Text>
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
};
