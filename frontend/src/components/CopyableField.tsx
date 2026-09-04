import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App, Input, Tooltip } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { copyText } from '../lib/clipboard'

interface Props {
  value: string
  placeholder?: string
  rows?: number
  readOnly?: boolean
  onChange?: (value: string) => void
  mono?: boolean
  size?: 'large' | 'middle' | 'small'
  masked?: boolean
}

export default function CopyableField({ value, placeholder, rows = 3, readOnly = true, onChange, mono = true, size, masked = false }: Props) {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [hovered, setHovered] = useState(false)

  const effectiveReadOnly = readOnly || masked
  const displayValue = masked && value ? '•'.repeat(20) : value

  const handleCopy = async () => {
    if (!value) return
    const ok = await copyText(value)
    if (ok) message.success(t('msg.copied'))
    else message.error(t('msg.copyFailed'))
  }

  const className = [mono ? 'mono-input' : '', size ? `copyable-field--${size}` : ''].filter(Boolean).join(' ')

  return (
    <div className="copyable-field" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Input.TextArea
        value={displayValue}
        placeholder={placeholder}
        autoSize={effectiveReadOnly ? { minRows: rows, maxRows: rows } : { minRows: rows, maxRows: 8 }}
        readOnly={effectiveReadOnly}
        onChange={(e) => onChange?.(e.target.value)}
        onClick={effectiveReadOnly ? handleCopy : undefined}
        className={className}
      />
      {readOnly && hovered && value && (
        <Tooltip title={t('msg.copied')}>
          <span className="copyable-field__badge">
            <CopyOutlined />
          </span>
        </Tooltip>
      )}
    </div>
  )
}
