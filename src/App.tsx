import React, { useState, useCallback, useEffect } from 'react';
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
  Switch,
  Badge,
} from 'antd';
import {
  UploadOutlined,
  ReloadOutlined,
  UndoOutlined,
  RedoOutlined,
  EditOutlined,
  EyeOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  ThunderboltOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { PacketVisualizer } from './components/PacketVisualizer';
import { EditablePacketVisualizer } from './components/EditablePacketVisualizer';
import { HexEditor } from './components/HexEditor';
import { PacketAnalysis } from './components/PacketAnalysis';
import { ExportMenu } from './components/ExportMenu';
import { AutoCalculator } from './components/AutoCalculator';
import { TemplateManager } from './components/TemplateManager';
import { parsePacket, validatePacket, serializePacket } from './lib/mpegts-parser';
import { TSPacket, ValidationResult } from './types/TSPacket';
import {
  createSamplePATPacket,
  createSamplePacketWithPCR,
  createNullPacket,
  createAdaptationOnlyPacket,
  createPacketWithPrivateData,
  createPacketWithOPCRAndSplice,
  createPacketWithExtensionLTW,
  createPacketWithExtensionPiecewiseRate,
  createPacketWithExtensionSeamlessSplice,
  createComplexPacket,
} from './utils/samplePackets';
import { useHistory } from './hooks/useHistory';
import { autoUpdateLengths, autoAddStuffing } from './utils/autoCalculations';
import { exportToJSON, downloadFile } from './utils/exportImport';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface PacketState {
  packet: TSPacket | null;
  rawData: Uint8Array | null;
}

function App() {
  const history = useHistory<PacketState>({
    packet: null,
    rawData: null,
  });

  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [autoMode, setAutoMode] = useState(false);

  const packet = history.state.packet;
  const rawData = history.state.rawData;

  useEffect(() => {
    if (packet) {
      const result = validatePacket(packet);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [packet]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (history.canUndo) {
          e.preventDefault();
          history.undo();
          message.info('Undo');
        }
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
      else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
               ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        if (history.canRedo) {
          e.preventDefault();
          history.redo();
          message.info('Redo');
        }
      }
      // Ctrl/Cmd + E - Toggle Edit Mode
      else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setEditMode((prev: boolean) => !prev);
        message.info(`Edit mode ${!editMode ? 'enabled' : 'disabled'}`);
      }
      // Ctrl/Cmd + S - Export JSON
      else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (packet) {
          const json = exportToJSON(packet);
          const pid = packet.header.pid;
          const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
          downloadFile(json, `packet_pid${pid}_${timestamp}.json`, 'application/json');
          message.success('JSON exported!');
        }
      }
      // Ctrl/Cmd + L - Auto-Fix
      else if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        if (packet) {
          let updated = autoUpdateLengths(packet);
          updated = autoAddStuffing(updated);
          const newData = serializePacket(updated);
          loadPacket(newData);
          message.success('Auto-fixed!');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, packet, editMode]);

  const loadPacket = useCallback(
    (data: Uint8Array, addToHistory = true) => {
      try {
        const parsed = parsePacket(data);
        const validation = validatePacket(parsed);

        const newState = {
          packet: parsed,
          rawData: data,
        };

        if (addToHistory) {
          history.set(newState);
        } else {
          history.reset(newState);
        }

        if (validation.errors.length > 0) {
          const errors = validation.errors.filter((e) => e.severity === 'error').length;
          const warnings = validation.errors.filter((e) => e.severity === 'warning').length;

          if (errors > 0) {
            message.error(`Packet has ${errors} error(s) and ${warnings} warning(s)`);
          } else if (warnings > 0) {
            message.warning(`Packet has ${warnings} warning(s)`);
          }
        } else {
          message.success('Packet loaded and validated successfully!');
        }
      } catch (error) {
        message.error(`Failed to parse packet: ${(error as Error).message}`);
        console.error(error);
      }
    },
    [history]
  );

  const uploadProps: UploadProps = {
    accept: '.ts,.bin,.dat',
    beforeUpload: (file: File) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);

        if (data.length < 188) {
          message.error('File is too small to be a valid TS packet (minimum 188 bytes)');
          return;
        }

        // Load first packet
        loadPacket(data.slice(0, 188), false);
      };
      reader.readAsArrayBuffer(file);
      return false; // Prevent upload
    },
    showUploadList: false,
  };

  const createSamplePacket = (type: string) => {
    let data: Uint8Array;
    let name = type.toUpperCase();

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
      case 'private-data':
        data = createPacketWithPrivateData();
        name = 'Private Data';
        break;
      case 'opcr-splice':
        data = createPacketWithOPCRAndSplice();
        name = 'OPCR & Splice';
        break;
      case 'extension-ltw':
        data = createPacketWithExtensionLTW();
        name = 'Extension (LTW)';
        break;
      case 'extension-piecewise':
        data = createPacketWithExtensionPiecewiseRate();
        name = 'Extension (Piecewise Rate)';
        break;
      case 'extension-seamless':
        data = createPacketWithExtensionSeamlessSplice();
        name = 'Extension (Seamless Splice)';
        break;
      case 'complex':
        data = createComplexPacket();
        name = 'Complex (All Features)';
        break;
      default:
        message.error('Unknown sample type');
        return;
    }

    loadPacket(data, false);
    message.success(`Sample packet "${name}" created!`);
  };

  const handlePacketUpdate = (updatedPacket: TSPacket) => {
    const data = serializePacket(updatedPacket);
    loadPacket(data);
  };

  const downloadPacket = () => {
    if (!packet) {
      message.warning('No packet to download');
      return;
    }

    try {
      const data = serializePacket(packet);
      const blob = new Blob([data.buffer], { type: 'application/octet-stream' });
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

  const handlePacketUpdate = useCallback((updatedPacket: TSPacket) => {
    try {
      const data = serializePacket(updatedPacket);
      loadPacket(data);
    } catch (error) {
      message.error(`Failed to update packet: ${(error as Error).message}`);
    }
  }, [loadPacket]);

  const handleHexEdit = (offset: number, value: number) => {
    if (!rawData) return;

    const newData = new Uint8Array(rawData);
    newData[offset] = value;
    loadPacket(newData);
    message.info(`Byte at offset 0x${offset.toString(16).toUpperCase()} updated`);
  };

  const handleFieldEdit = (field: string, value: any) => {
    if (!packet || !rawData) return;

    // Update packet field
    const fieldParts = field.split('.');
    const newPacket = JSON.parse(JSON.stringify(packet)); // Deep clone

    let target: any = newPacket;
    for (let i = 0; i < fieldParts.length - 1; i++) {
      target = target[fieldParts[i]];
    }
    target[fieldParts[fieldParts.length - 1]] = value;

    // Serialize and reload
    try {
      const newData = serializePacket(newPacket);
      loadPacket(newData);
      message.success(`Field ${field} updated`);
    } catch (error) {
      message.error(`Failed to update field: ${(error as Error).message}`);
    }
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

  const errorCount = validation?.errors.filter((e: ValidationError) => e.severity === 'error').length || 0;
  const warningCount = validation?.errors.filter((e: ValidationError) => e.severity === 'warning').length || 0;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#1890ff', padding: '0 24px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={3} style={{ color: 'white', margin: '16px 0' }}>
            🔍 MPEG-TS Packet Inspector
          </Title>
          {validation && (
            <Space>
              {errorCount > 0 && (
                <Badge count={errorCount} style={{ backgroundColor: '#ff4d4f' }}>
                  <Button danger size="small">
                    Errors
                  </Button>
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge count={warningCount} style={{ backgroundColor: '#faad14' }}>
                  <Button size="small">Warnings</Button>
                </Badge>
              )}
            </Space>
          )}
        </Space>
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
              style={{ width: 260 }}
              onChange={createSamplePacket}
              value={undefined}
            >
              <Select.OptGroup label="Basic Packets">
                <Select.Option value="pat">PAT Packet (PID 0)</Select.Option>
                <Select.Option value="pcr">Packet with PCR</Select.Option>
                <Select.Option value="null">Null Packet (0x1FFF)</Select.Option>
                <Select.Option value="adaptation-only">Adaptation Only</Select.Option>
              </Select.OptGroup>
              <Select.OptGroup label="Advanced Features">
                <Select.Option value="private-data">🔒 Transport Private Data</Select.Option>
                <Select.Option value="opcr-splice">⏰ OPCR + Splice Countdown</Select.Option>
              </Select.OptGroup>
              <Select.OptGroup label="AF Extensions">
                <Select.Option value="extension-ltw">📺 Extension: LTW</Select.Option>
                <Select.Option value="extension-piecewise">📊 Extension: Piecewise Rate</Select.Option>
                <Select.Option value="extension-seamless">🎬 Extension: Seamless Splice</Select.Option>
              </Select.OptGroup>
              <Select.OptGroup label="Complex">
                <Select.Option value="complex">⭐ All Features Combined</Select.Option>
              </Select.OptGroup>
            </Select>

            <Divider type="vertical" />

            <Button
              icon={<UndoOutlined />}
              onClick={history.undo}
              disabled={!history.canUndo}
              title="Undo (Ctrl+Z)"
            >
              Undo
            </Button>

            <Button
              icon={<RedoOutlined />}
              onClick={history.redo}
              disabled={!history.canRedo}
              title="Redo (Ctrl+Y)"
            >
              Redo
            </Button>

            <Divider type="vertical" />

            <Space>
              <Text>Edit Mode:</Text>
              <Switch
                checked={editMode}
                onChange={setEditMode}
                checkedChildren={<EditOutlined />}
                unCheckedChildren={<EyeOutlined />}
              />
            </Space>

            <Divider type="vertical" />

            <ExportMenu packet={packet} disabled={!packet} />

            <Button
              icon={<ThunderboltOutlined />}
              onClick={() => {
                if (packet) {
                  let updated = autoUpdateLengths(packet);
                  updated = autoAddStuffing(updated);
                  handlePacketUpdate(updated);
                }
              }}
              disabled={!packet}
              type="primary"
              title="Auto-Fix (Ctrl+L)"
            >
              Auto-Fix
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                if (rawData) loadPacket(rawData, false);
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
                label: editMode ? 'Visual Editor' : 'Visual Inspector',
                icon: editMode ? <EditOutlined /> : <EyeOutlined />,
                children: editMode ? (
                  <EditablePacketVisualizer
                    packet={packet}
                    onFieldChange={handleFieldEdit}
                    editMode={editMode}
                  />
                ) : (
                  <PacketVisualizer packet={packet} />
                ),
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
              {
                key: 'analysis',
                label: 'Analysis',
                icon: <BarChartOutlined />,
                children: <PacketAnalysis packet={packet} validation={validation} />,
              },
              {
                key: 'calculator',
                label: 'Auto-Calculator',
                icon: <CalculatorOutlined />,
                children: (
                  <AutoCalculator
                    packet={packet}
                    onPacketUpdate={handlePacketUpdate}
                    autoMode={autoMode}
                    onAutoModeChange={setAutoMode}
                  />
                ),
              },
              {
                key: 'templates',
                label: 'Templates',
                icon: <FolderOpenOutlined />,
                children: (
                  <TemplateManager
                    currentPacket={packet}
                    onLoadTemplate={handlePacketUpdate}
                  />
                ),
              },
            ]}
          />
        </Space>
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        <Space direction="vertical" size="small">
          <Text type="secondary">
            MPEG-TS Packet Inspector v3.1 - Phase 3: Auto-calculations, Export, Templates & Keyboard shortcuts
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Shortcuts: Ctrl+Z (Undo) | Ctrl+Y (Redo) | Ctrl+E (Edit Mode) | Ctrl+S (Export JSON) |
            Ctrl+L (Auto-Fix)
          </Text>
        </Space>
      </Footer>
    </Layout>
  );
}

export default App;
