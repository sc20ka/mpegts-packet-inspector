import React from 'react';
import { Dropdown, Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { TSPacket } from '../types/TSPacket';
import {
  exportToJSON,
  exportToCArray,
  exportToPython,
  exportToHexString,
  exportToTextReport,
  downloadFile,
} from '../utils/exportImport';
import { serializePacket } from '../lib/mpegts-parser';

interface ExportMenuProps {
  packet: TSPacket | null;
  disabled?: boolean;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ packet, disabled }: ExportMenuProps) => {
  const handleExport = (format: string) => {
    if (!packet) {
      message.warning('No packet to export');
      return;
    }

    const pid = packet.header.pid;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

    try {
      switch (format) {
        case 'binary':
          {
            const data = serializePacket(packet);
            const blob = new Blob([data.buffer], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `packet_pid${pid}_${timestamp}.ts`;
            a.click();
            URL.revokeObjectURL(url);
            message.success('Binary packet downloaded!');
          }
          break;

        case 'json':
          {
            const json = exportToJSON(packet);
            downloadFile(json, `packet_pid${pid}_${timestamp}.json`, 'application/json');
            message.success('JSON exported!');
          }
          break;

        case 'c':
          {
            const code = exportToCArray(packet);
            downloadFile(code, `packet_pid${pid}_${timestamp}.c`, 'text/plain');
            message.success('C array exported!');
          }
          break;

        case 'python':
          {
            const code = exportToPython(packet);
            downloadFile(code, `packet_pid${pid}_${timestamp}.py`, 'text/x-python');
            message.success('Python code exported!');
          }
          break;

        case 'hex':
          {
            const hex = exportToHexString(packet);
            downloadFile(hex, `packet_pid${pid}_${timestamp}.hex`, 'text/plain');
            message.success('Hex string exported!');
          }
          break;

        case 'report':
          {
            const report = exportToTextReport(packet);
            downloadFile(report, `packet_pid${pid}_${timestamp}.txt`, 'text/plain');
            message.success('Text report exported!');
          }
          break;

        case 'clipboard-json':
          {
            const json = exportToJSON(packet);
            navigator.clipboard.writeText(json).then(() => {
              message.success('JSON copied to clipboard!');
            });
          }
          break;

        case 'clipboard-hex':
          {
            const hex = exportToHexString(packet);
            navigator.clipboard.writeText(hex).then(() => {
              message.success('Hex string copied to clipboard!');
            });
          }
          break;

        default:
          message.error('Unknown export format');
      }
    } catch (error) {
      message.error(`Export failed: ${(error as Error).message}`);
      console.error(error);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'download',
      type: 'group',
      label: 'Download',
      children: [
        {
          key: 'binary',
          label: '💾 Binary (.ts)',
          onClick: () => handleExport('binary'),
        },
        {
          key: 'json',
          label: '📄 JSON',
          onClick: () => handleExport('json'),
        },
        {
          key: 'hex',
          label: '🔢 Hex String',
          onClick: () => handleExport('hex'),
        },
        {
          key: 'report',
          label: '📋 Text Report',
          onClick: () => handleExport('report'),
        },
      ],
    },
    {
      key: 'code',
      type: 'group',
      label: 'Export as Code',
      children: [
        {
          key: 'c',
          label: '🇨 C Array',
          onClick: () => handleExport('c'),
        },
        {
          key: 'python',
          label: '🐍 Python Bytes',
          onClick: () => handleExport('python'),
        },
      ],
    },
    {
      key: 'clipboard',
      type: 'group',
      label: 'Copy to Clipboard',
      children: [
        {
          key: 'clipboard-json',
          label: '📋 JSON',
          onClick: () => handleExport('clipboard-json'),
        },
        {
          key: 'clipboard-hex',
          label: '📋 Hex String',
          onClick: () => handleExport('clipboard-hex'),
        },
      ],
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} disabled={disabled} placement="bottomLeft">
      <Button icon={<DownloadOutlined />} disabled={disabled}>
        Export
      </Button>
    </Dropdown>
  );
};
