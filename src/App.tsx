import React, { useState, useCallback } from 'react';
import {
  Layout,
  Typography,
  Upload,
  Button,
  Space,
  message,
  Tabs,
  Select,
  Divider,
} from 'antd';
import {
  UploadOutlined,
  FileAddOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { PacketVisualizer } from './components/PacketVisualizer';
import { HexEditor } from './components/HexEditor';
import { parsePacket, validatePacket, serializePacket } from './lib/mpegts-parser';
import { TSPacket } from './types/TSPacket';
import {
  createSamplePATPacket,
  createSamplePacketWithPCR,
  createNullPacket,
  createAdaptationOnlyPacket,
} from './utils/samplePackets';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
  const [packet, setPacket] = useState<TSPacket | null>(null);
  const [rawData, setRawData] = useState<Uint8Array | null>(null);

  const loadPacket = useCallback((data: Uint8Array) => {
    try {
      const parsed = parsePacket(data);
      const validation = validatePacket(parsed);

      setPacket(parsed);
      setRawData(data);

      if (validation.errors.length > 0) {
        validation.errors.forEach((error) => {
          if (error.severity === 'error') {
            message.error(`${error.field}: ${error.message}`);
          } else {
            message.warning(`${error.field}: ${error.message}`);
          }
        });
      } else {
        message.success('Packet loaded and validated successfully!');
      }
    } catch (error) {
      message.error(`Failed to parse packet: ${(error as Error).message}`);
      console.error(error);
    }
  }, []);

  const uploadProps: UploadProps = {
    accept: '.ts,.bin,.dat',
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);

        if (data.length < 188) {
          message.error('File is too small to be a valid TS packet (minimum 188 bytes)');
          return;
        }

        // Load first packet
        loadPacket(data.slice(0, 188));
      };
      reader.readAsArrayBuffer(file);
      return false; // Prevent upload
    },
    showUploadList: false,
  };

  const createSamplePacket = (type: string) => {
    let data: Uint8Array;

    switch (type) {
      case 'pat':
        data = createSamplePATPacket();
        break;
      case 'pcr':
        data = createSamplePacketWithPCR();
        break;
      case 'null':
        data = createNullPacket();
        break;
      case 'adaptation-only':
        data = createAdaptationOnlyPacket();
        break;
      default:
        message.error('Unknown sample type');
        return;
    }

    loadPacket(data);
    message.success(`Sample ${type.toUpperCase()} packet created!`);
  };

  const downloadPacket = () => {
    if (!packet) {
      message.warning('No packet to download');
      return;
    }

    try {
      const data = serializePacket(packet);
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `packet_pid_${packet.header.pid}.ts`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Packet downloaded!');
    } catch (error) {
      message.error(`Failed to serialize packet: ${(error as Error).message}`);
    }
  };

  const handleHexEdit = (offset: number, value: number) => {
    if (!rawData) return;

    const newData = new Uint8Array(rawData);
    newData[offset] = value;
    loadPacket(newData);
    message.info(`Byte at offset 0x${offset.toString(16).toUpperCase()} updated`);
  };

  const getHighlights = () => {
    if (!packet) return [];

    const highlights = [
      { start: 0, end: 4, color: 'rgba(255, 193, 7, 0.3)', label: 'Header' },
    ];

    if (packet.adaptationField) {
      const afLength = packet.adaptationField.length + 1; // +1 for length byte
      highlights.push({
        start: 4,
        end: 4 + afLength,
        color: 'rgba(33, 150, 243, 0.3)',
        label: 'Adaptation Field',
      });

      if (packet.payload) {
        highlights.push({
          start: 4 + afLength,
          end: 188,
          color: 'rgba(76, 175, 80, 0.3)',
          label: 'Payload',
        });
      }
    } else if (packet.payload) {
      highlights.push({
        start: 4,
        end: 188,
        color: 'rgba(76, 175, 80, 0.3)',
        label: 'Payload',
      });
    }

    return highlights;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#1890ff', padding: '0 24px' }}>
        <Title level={3} style={{ color: 'white', margin: '16px 0' }}>
          MPEG-TS Packet Inspector
        </Title>
      </Header>

      <Content style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Actions */}
          <Space wrap>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Upload TS File</Button>
            </Upload>

            <Select
              placeholder="Create Sample Packet"
              style={{ width: 200 }}
              onChange={createSamplePacket}
              value={undefined}
            >
              <Select.Option value="pat">PAT Packet (PID 0)</Select.Option>
              <Select.Option value="pcr">Packet with PCR</Select.Option>
              <Select.Option value="null">Null Packet (0x1FFF)</Select.Option>
              <Select.Option value="adaptation-only">Adaptation Only</Select.Option>
            </Select>

            <Button
              icon={<DownloadOutlined />}
              onClick={downloadPacket}
              disabled={!packet}
            >
              Download Packet
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                if (rawData) loadPacket(rawData);
              }}
              disabled={!packet}
            >
              Reload
            </Button>
          </Space>

          <Divider />

          {/* Main Content */}
          <Tabs
            defaultActiveKey="visual"
            items={[
              {
                key: 'visual',
                label: 'Visual Inspector',
                children: <PacketVisualizer packet={packet} />,
              },
              {
                key: 'hex',
                label: 'Hex Editor',
                children: rawData ? (
                  <HexEditor
                    data={rawData}
                    onChange={handleHexEdit}
                    highlights={getHighlights()}
                  />
                ) : (
                  <Text type="secondary">No data loaded</Text>
                ),
              },
            ]}
          />
        </Space>
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        <Text type="secondary">
          MPEG-TS Packet Inspector - WebUI tool for visual analysis and editing of MPEG-TS
          packages
        </Text>
      </Footer>
    </Layout>
  );
}

export default App;
