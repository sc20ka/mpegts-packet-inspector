import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  List,
  Modal,
  Input,
  Form,
  message,
  Popconfirm,
  Tag,
  Empty,
  Upload,
} from 'antd';
import {
  SaveOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { TSPacket } from '../types/TSPacket';
import {
  getSavedTemplates,
  saveTemplate,
  deleteTemplate,
  createTemplateFromPacket,
  exportTemplates,
  importTemplates,
  PacketTemplate,
} from '../utils/templates';
import { downloadFile } from '../utils/exportImport';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface TemplateManagerProps {
  currentPacket: TSPacket | null;
  onLoadTemplate: (packet: TSPacket) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  currentPacket,
  onLoadTemplate,
}: TemplateManagerProps) => {
  const [templates, setTemplates] = useState<PacketTemplate[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const loaded = getSavedTemplates();
    setTemplates(loaded);
  };

  const handleSaveTemplate = async () => {
    if (!currentPacket) {
      message.warning('No packet to save');
      return;
    }

    try {
      const values = await form.validateFields();
      const template = createTemplateFromPacket(
        currentPacket,
        values.name,
        values.description,
        values.tags ? values.tags.split(',').map((t: string) => t.trim()) : []
      );

      saveTemplate(template);
      loadTemplates();
      setSaveModalVisible(false);
      form.resetFields();
      message.success('Template saved successfully!');
    } catch (error) {
      console.error('Save template failed:', error);
    }
  };

  const handleLoadTemplate = (template: PacketTemplate) => {
    onLoadTemplate(template.packet);
    message.success(`Template "${template.name}" loaded!`);
  };

  const handleDeleteTemplate = (id: string) => {
    try {
      deleteTemplate(id);
      loadTemplates();
      message.success('Template deleted');
    } catch (error) {
      message.error('Failed to delete template');
    }
  };

  const handleExportTemplates = () => {
    if (templates.length === 0) {
      message.warning('No templates to export');
      return;
    }

    try {
      const json = exportTemplates(templates);
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      downloadFile(json, `mpegts-templates_${timestamp}.json`, 'application/json');
      message.success('Templates exported successfully!');
    } catch (error) {
      message.error('Failed to export templates');
    }
  };

  const uploadProps: UploadProps = {
    accept: '.json',
    beforeUpload: (file: File) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const content = e.target?.result as string;
          const imported = importTemplates(content);

          // Save all imported templates
          imported.forEach(t => saveTemplate(t));

          loadTemplates();
          message.success(`Imported ${imported.length} template(s)!`);
        } catch (error) {
          message.error('Failed to import templates: Invalid file format');
        }
      };
      reader.readAsText(file);
      return false; // Prevent upload
    },
    showUploadList: false,
  };

  return (
    <Card
      title={
        <Space>
          <FolderOpenOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Template Manager
          </Title>
        </Space>
      }
      extra={
        <Space>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} size="small">
              Import
            </Button>
          </Upload>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportTemplates}
            disabled={templates.length === 0}
            size="small"
          >
            Export
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setSaveModalVisible(true)}
            disabled={!currentPacket}
          >
            Save Current
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Templates List */}
        {templates.length === 0 ? (
          <Empty
            description={
              <Space direction="vertical">
                <Text>No saved templates</Text>
                <Text type="secondary">
                  Save your current packet as a template to reuse it later
                </Text>
              </Space>
            }
          />
        ) : (
          <List
            dataSource={templates}
            renderItem={(template: PacketTemplate) => (
              <List.Item
                key={template.id}
                actions={[
                  <Button
                    type="link"
                    icon={<FolderOpenOutlined />}
                    onClick={() => handleLoadTemplate(template)}
                    key="load"
                  >
                    Load
                  </Button>,
                  <Popconfirm
                    title="Delete this template?"
                    onConfirm={() => handleDeleteTemplate(template.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    key="delete"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{template.name}</Text>
                      {template.category === 'system' && (
                        <Tag color="blue">System</Tag>
                      )}
                      {template.tags?.map((tag: string) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Text type="secondary">{template.description}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        PID: {template.packet.header.pid} | CC:{' '}
                        {template.packet.header.continuityCounter}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}

        {/* Tips */}
        <Card type="inner" size="small" title="💡 Tips">
          <Space direction="vertical" size="small">
            <Text>
              • <Text strong>Save Current</Text>: Save your current packet as a reusable
              template
            </Text>
            <Text>
              • <Text strong>Load</Text>: Apply a template to create a new packet
            </Text>
            <Text>
              • <Text strong>Export/Import</Text>: Share templates across devices or with
              others
            </Text>
            <Text>
              • Templates are stored locally in your browser's localStorage
            </Text>
          </Space>
        </Card>
      </Space>

      {/* Save Template Modal */}
      <Modal
        title={
          <Space>
            <SaveOutlined />
            <span>Save Packet as Template</span>
          </Space>
        }
        open={saveModalVisible}
        onOk={handleSaveTemplate}
        onCancel={() => {
          setSaveModalVisible(false);
          form.resetFields();
        }}
        okText="Save"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: '',
            description: '',
            tags: '',
          }}
        >
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g., PAT with custom PID" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <TextArea
              rows={3}
              placeholder="Describe what this template is for..."
            />
          </Form.Item>

          <Form.Item name="tags" label="Tags (comma-separated)">
            <Input placeholder="e.g., PAT, system, custom" />
          </Form.Item>

          {currentPacket && (
            <Card size="small" type="inner" title="Current Packet Info">
              <Space direction="vertical" size="small">
                <Text>
                  PID: <Text code>{currentPacket.header.pid}</Text>
                </Text>
                <Text>
                  Continuity Counter:{' '}
                  <Text code>{currentPacket.header.continuityCounter}</Text>
                </Text>
                <Text>
                  Has Adaptation Field:{' '}
                  <Text code>{currentPacket.adaptationField ? 'Yes' : 'No'}</Text>
                </Text>
                <Text>
                  Has Payload: <Text code>{currentPacket.payload ? 'Yes' : 'No'}</Text>
                </Text>
              </Space>
            </Card>
          )}
        </Form>
      </Modal>
    </Card>
  );
};
